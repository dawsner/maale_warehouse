"""
מודול לניהול תחזוקה ותיקונים של פריטים במחסן ציוד קולנוע.
מספק פונקציות לניהול סטטוס תחזוקה, רשומות תחזוקה, תזכורות תקופתיות ומידע אחריות.
"""

import sys
import os
import json
import datetime
from pytz import timezone

# הוספת תיקיית האב לנתיב החיפוש כדי לייבא מודולים מהתיקייה הראשית
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from database import get_db_connection

def get_israel_time():
    """מחזיר את השעה הנוכחית בישראל"""
    israel_tz = timezone('Asia/Jerusalem')
    return datetime.datetime.now(israel_tz)

# ======== ניהול סטטוס תחזוקה ========

def get_item_maintenance_status(item_id):
    """מחזיר את סטטוס התחזוקה של פריט מסוים"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT ms.id, ms.status, ms.notes, ms.updated_at, 
                   u.full_name as updated_by_name
            FROM maintenance_status ms
            LEFT JOIN users u ON ms.updated_by = u.id
            WHERE ms.item_id = %s
            """,
            (item_id,)
        )
        status = cur.fetchone()
        
        if status:
            return {
                'id': status[0],
                'item_id': item_id,
                'status': status[1],
                'notes': status[2],
                'updated_at': status[3],
                'updated_by': status[4]
            }
        else:
            # אם אין רשומת תחזוקה, מחזירים סטטוס ברירת מחדל
            return {
                'item_id': item_id,
                'status': 'operational',  # פריט תקין כברירת מחדל
                'notes': None,
                'updated_at': None,
                'updated_by': None
            }
    finally:
        conn.close()

def update_item_maintenance_status(item_id, status, notes, user_id):
    """מעדכן או יוצר את סטטוס התחזוקה של פריט"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        # בדיקה אם כבר קיים סטטוס לפריט זה
        cur.execute(
            "SELECT id FROM maintenance_status WHERE item_id = %s",
            (item_id,)
        )
        existing = cur.fetchone()
        
        if existing:
            # עדכון הסטטוס הקיים
            cur.execute(
                """
                UPDATE maintenance_status 
                SET status = %s, notes = %s, updated_at = %s, updated_by = %s
                WHERE item_id = %s
                RETURNING id
                """,
                (status, notes, get_israel_time(), user_id, item_id)
            )
        else:
            # יצירת סטטוס חדש
            cur.execute(
                """
                INSERT INTO maintenance_status (item_id, status, notes, updated_at, updated_by)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
                """,
                (item_id, status, notes, get_israel_time(), user_id)
            )
        
        status_result = cur.fetchone()
        status_id = status_result[0] if status_result else None
        conn.commit()
        
        # אם הפריט בתחזוקה, אנחנו רוצים גם לעדכן את הזמינות שלו בטבלת items
        if status == 'in_maintenance' or status == 'out_of_order':
            cur.execute(
                "UPDATE items SET is_available = FALSE WHERE id = %s",
                (item_id,)
            )
        elif status == 'operational':
            # אם הפריט חזר למצב תקין, נעדכן את הזמינות שלו ל-TRUE
            cur.execute(
                "UPDATE items SET is_available = TRUE WHERE id = %s",
                (item_id,)
            )
        
        conn.commit()
        return status_id
        
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

# ======== ניהול רשומות תחזוקה ========

def add_maintenance_record(item_id, maintenance_type, description, start_date, 
                           end_date=None, performed_by=None, cost=0, 
                           receipt_url=None, notes=None, user_id=None):
    """מוסיף רשומת תחזוקה חדשה לפריט"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO maintenance_records 
            (item_id, maintenance_type, description, start_date, end_date, performed_by, 
             cost, receipt_url, created_at, created_by, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (item_id, maintenance_type, description, start_date, end_date, performed_by,
             cost, receipt_url, get_israel_time(), user_id, notes)
        )
        record_result = cur.fetchone()
        record_id = record_result[0] if record_result else None
        conn.commit()
        
        # אם הסתיימה התחזוקה (יש תאריך סיום), נעדכן את סטטוס התחזוקה של הפריט
        if end_date:
            update_item_maintenance_status(item_id, 'operational', 
                                          f"פריט חזר מתחזוקה בתאריך {end_date.strftime('%d/%m/%Y')}", 
                                          user_id)
            
            # נעדכן גם את תאריך התחזוקה האחרונה ונחשב מועד תחזוקה הבא
            cur.execute(
                """
                UPDATE maintenance_schedules
                SET last_performed = %s, 
                    next_due = %s + (frequency_days || ' days')::interval
                WHERE item_id = %s AND maintenance_type = %s
                """,
                (end_date, end_date, item_id, maintenance_type)
            )
            conn.commit()
            
        return record_id
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def get_item_maintenance_records(item_id):
    """מחזיר את כל רשומות התחזוקה של פריט מסוים"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, maintenance_type, description, start_date, end_date, 
                   performed_by, cost, receipt_url, created_at, created_by, notes
            FROM maintenance_records
            WHERE item_id = %s
            ORDER BY start_date DESC
            """,
            (item_id,)
        )
        records = cur.fetchall()
        
        result = []
        for record in records:
            result.append({
                'id': record[0],
                'item_id': item_id,
                'maintenance_type': record[1],
                'description': record[2],
                'start_date': record[3],
                'end_date': record[4],
                'performed_by': record[5],
                'cost': float(record[6]) if record[6] is not None else 0,
                'receipt_url': record[7],
                'created_at': record[8],
                'created_by': record[9],
                'notes': record[10]
            })
        
        return result
    finally:
        conn.close()

def update_maintenance_record(record_id, maintenance_type=None, description=None, 
                             start_date=None, end_date=None, performed_by=None, 
                             cost=None, receipt_url=None, notes=None, user_id=None):
    """מעדכן רשומת תחזוקה קיימת"""
    conn = get_db_connection()
    try:
        # קריאת רשומת התחזוקה הנוכחית לפני העדכון
        cur = conn.cursor()
        cur.execute(
            "SELECT item_id, end_date FROM maintenance_records WHERE id = %s",
            (record_id,)
        )
        record = cur.fetchone()
        if not record:
            raise ValueError(f"רשומת תחזוקה עם מזהה {record_id} לא נמצאה")
            
        item_id = record[0]
        had_end_date = record[1] is not None
        
        # בניית שאילתת עדכון דינמית עם רק השדות שיש לעדכן
        update_fields = []
        params = []
        
        if maintenance_type is not None:
            update_fields.append("maintenance_type = %s")
            params.append(maintenance_type)
        if description is not None:
            update_fields.append("description = %s")
            params.append(description)
        if start_date is not None:
            update_fields.append("start_date = %s")
            params.append(start_date)
        if end_date is not None:
            update_fields.append("end_date = %s")
            params.append(end_date)
        if performed_by is not None:
            update_fields.append("performed_by = %s")
            params.append(performed_by)
        if cost is not None:
            update_fields.append("cost = %s")
            params.append(cost)
        if receipt_url is not None:
            update_fields.append("receipt_url = %s")
            params.append(receipt_url)
        if notes is not None:
            update_fields.append("notes = %s")
            params.append(notes)
            
        if not update_fields:
            return record_id  # אין שדות לעדכון
            
        # הוספת מזהה הרשומה לפרמטרים
        params.append(record_id)
        
        # ביצוע העדכון
        cur.execute(
            f"""
            UPDATE maintenance_records 
            SET {", ".join(update_fields)}
            WHERE id = %s
            RETURNING id
            """,
            params
        )
        conn.commit()
        
        # אם הוספנו תאריך סיום לרשומה, נעדכן את סטטוס התחזוקה של הפריט
        if end_date is not None and not had_end_date:
            update_item_maintenance_status(item_id, 'operational', 
                                         f"פריט חזר מתחזוקה בתאריך {end_date.strftime('%d/%m/%Y')}", 
                                         user_id)
            
            # נשיג את סוג התחזוקה
            if maintenance_type is None:
                cur.execute("SELECT maintenance_type FROM maintenance_records WHERE id = %s", (record_id,))
                result = cur.fetchone()
                if result:
                    maintenance_type = result[0]
                else:
                    maintenance_type = "general"  # ערך ברירת מחדל אם לא נמצא
                
            # נעדכן תאריך תחזוקה אחרונה ונחשב מועד תחזוקה הבא
            cur.execute(
                """
                UPDATE maintenance_schedules
                SET last_performed = %s, 
                    next_due = %s + (frequency_days || ' days')::interval
                WHERE item_id = %s AND maintenance_type = %s
                """,
                (end_date, end_date, item_id, maintenance_type)
            )
            conn.commit()
            
        return record_id
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def delete_maintenance_record(record_id):
    """מוחק רשומת תחזוקה"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM maintenance_records WHERE id = %s RETURNING id", (record_id,))
        result = cur.fetchone()
        conn.commit()
        return result is not None
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

# ======== ניהול מידע אחריות ========

def add_warranty_info(item_id, warranty_provider, warranty_number, start_date, end_date, 
                     contact_info=None, terms=None):
    """מוסיף או מעדכן מידע אחריות לפריט"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        # בדיקה אם כבר קיים מידע אחריות לפריט זה
        cur.execute("SELECT id FROM warranty_info WHERE item_id = %s", (item_id,))
        existing = cur.fetchone()
        
        if existing:
            # עדכון מידע אחריות קיים
            cur.execute(
                """
                UPDATE warranty_info 
                SET warranty_provider = %s, warranty_number = %s, start_date = %s, 
                    end_date = %s, contact_info = %s, terms = %s, updated_at = %s
                WHERE item_id = %s
                RETURNING id
                """,
                (warranty_provider, warranty_number, start_date, end_date, 
                 contact_info, terms, get_israel_time(), item_id)
            )
        else:
            # יצירת רשומת אחריות חדשה
            cur.execute(
                """
                INSERT INTO warranty_info 
                (item_id, warranty_provider, warranty_number, start_date, end_date, 
                 contact_info, terms, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (item_id, warranty_provider, warranty_number, start_date, end_date, 
                 contact_info, terms, get_israel_time(), get_israel_time())
            )
            
        result = cur.fetchone()
        warranty_id = result[0] if result else None
        conn.commit()
        return warranty_id
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def get_item_warranty_info(item_id):
    """מחזיר מידע אחריות של פריט מסוים"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, warranty_provider, warranty_number, start_date, end_date,
                   contact_info, terms, created_at, updated_at
            FROM warranty_info
            WHERE item_id = %s
            """,
            (item_id,)
        )
        warranty = cur.fetchone()
        
        if warranty:
            return {
                'id': warranty[0],
                'item_id': item_id,
                'warranty_provider': warranty[1],
                'warranty_number': warranty[2],
                'start_date': warranty[3],
                'end_date': warranty[4],
                'contact_info': warranty[5],
                'terms': warranty[6],
                'created_at': warranty[7],
                'updated_at': warranty[8],
                'is_active': warranty[4] >= datetime.date.today() if warranty[4] else False
            }
        else:
            return None
    finally:
        conn.close()

def delete_warranty_info(item_id):
    """מוחק מידע אחריות של פריט"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM warranty_info WHERE item_id = %s RETURNING id", (item_id,))
        result = cur.fetchone()
        conn.commit()
        return result is not None
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

# ======== ניהול תזכורות תחזוקה ========

def add_maintenance_schedule(item_id, maintenance_type, frequency_days, next_due, 
                            description=None, last_performed=None, user_id=None):
    """מוסיף תזכורת תחזוקה תקופתית לפריט"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        # בדיקה אם כבר קיימת תזכורת מאותו סוג לפריט זה
        cur.execute(
            "SELECT id FROM maintenance_schedules WHERE item_id = %s AND maintenance_type = %s",
            (item_id, maintenance_type)
        )
        existing = cur.fetchone()
        
        if existing:
            # עדכון תזכורת קיימת
            cur.execute(
                """
                UPDATE maintenance_schedules 
                SET frequency_days = %s, next_due = %s, description = %s, 
                    last_performed = %s, updated_at = %s
                WHERE item_id = %s AND maintenance_type = %s
                RETURNING id
                """,
                (frequency_days, next_due, description, last_performed, 
                 get_israel_time(), item_id, maintenance_type)
            )
        else:
            # יצירת תזכורת חדשה
            cur.execute(
                """
                INSERT INTO maintenance_schedules 
                (item_id, maintenance_type, frequency_days, next_due, description, 
                 last_performed, created_at, updated_at, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (item_id, maintenance_type, frequency_days, next_due, description, 
                 last_performed, get_israel_time(), get_israel_time(), user_id)
            )
            
        result = cur.fetchone()
        schedule_id = result[0] if result else None
        conn.commit()
        return schedule_id
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def get_item_maintenance_schedules(item_id):
    """מחזיר את כל תזכורות התחזוקה של פריט מסוים"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, maintenance_type, frequency_days, last_performed, next_due, 
                   description, created_at, updated_at, created_by
            FROM maintenance_schedules
            WHERE item_id = %s
            ORDER BY next_due ASC
            """,
            (item_id,)
        )
        schedules = cur.fetchall()
        
        result = []
        for schedule in schedules:
            result.append({
                'id': schedule[0],
                'item_id': item_id,
                'maintenance_type': schedule[1],
                'frequency_days': schedule[2],
                'last_performed': schedule[3],
                'next_due': schedule[4],
                'description': schedule[5],
                'created_at': schedule[6],
                'updated_at': schedule[7],
                'created_by': schedule[8],
                'days_remaining': (schedule[4] - datetime.date.today()).days if schedule[4] else None
            })
        
        return result
    finally:
        conn.close()

def get_upcoming_maintenance_schedules(days_threshold=30):
    """מחזיר את כל תזכורות התחזוקה הקרובות"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        threshold_date = datetime.date.today() + datetime.timedelta(days=days_threshold)
        
        cur.execute(
            """
            SELECT ms.id, ms.item_id, i.name AS item_name, i.category, 
                   ms.maintenance_type, ms.frequency_days, ms.last_performed, 
                   ms.next_due, ms.description, ms.created_by,
                   u.full_name AS created_by_name
            FROM maintenance_schedules ms
            JOIN items i ON ms.item_id = i.id
            LEFT JOIN users u ON ms.created_by = u.id
            WHERE ms.next_due <= %s
            ORDER BY ms.next_due ASC
            """,
            (threshold_date,)
        )
        schedules = cur.fetchall()
        
        result = []
        for schedule in schedules:
            result.append({
                'id': schedule[0],
                'item_id': schedule[1],
                'item_name': schedule[2],
                'item_category': schedule[3],
                'maintenance_type': schedule[4],
                'frequency_days': schedule[5],
                'last_performed': schedule[6],
                'next_due': schedule[7],
                'description': schedule[8],
                'created_by': schedule[9],
                'created_by_name': schedule[10],
                'days_remaining': (schedule[7] - datetime.date.today()).days
            })
        
        return result
    finally:
        conn.close()

def delete_maintenance_schedule(schedule_id):
    """מוחק תזכורת תחזוקה"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM maintenance_schedules WHERE id = %s RETURNING id", (schedule_id,))
        result = cur.fetchone()
        conn.commit()
        return result is not None
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

# ======== פונקציות מסכמות ========

def get_item_maintenance_data(item_id):
    """מחזיר את כל נתוני התחזוקה של פריט: סטטוס, היסטוריה, אחריות ותזכורות"""
    # קבלת נתוני הפריט הבסיסיים
    conn = get_db_connection()
    item = None
    try:
        cur = conn.cursor()
        # קריאת פרטי הפריט בסיסיים
        cur.execute(
            """
            SELECT id, name, category, quantity, notes, is_available 
            FROM items 
            WHERE id = %s
            """,
            (item_id,)
        )
        item_data = cur.fetchone()
        
        if item_data:
            item = {
                'id': item_data[0],
                'name': item_data[1],
                'category': item_data[2],
                'quantity': item_data[3],
                'notes': item_data[4],
                'is_available': item_data[5]
            }
    except Exception as e:
        print(f"DEBUG: Error fetching item info: {e}", file=sys.stderr)
    finally:
        conn.close()
    
    return {
        'item': item,  # הוספת פרטי הפריט הבסיסיים
        'status': get_item_maintenance_status(item_id),
        'records': get_item_maintenance_records(item_id),
        'warranty': get_item_warranty_info(item_id),
        'schedules': get_item_maintenance_schedules(item_id)
    }

def get_maintenance_overview():
    """מחזיר סקירה כללית של מצב התחזוקה בכל המערכת"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        # פריטים בתחזוקה כרגע
        cur.execute(
            """
            SELECT COUNT(*) 
            FROM maintenance_status 
            WHERE status = 'in_maintenance'
            """
        )
        result = cur.fetchone()
        in_maintenance_count = result[0] if result else 0
        
        # פריטים שדורשים תיקון
        cur.execute(
            """
            SELECT COUNT(*) 
            FROM maintenance_status 
            WHERE status = 'needs_repair'
            """
        )
        result = cur.fetchone()
        needs_repair_count = result[0] if result else 0
        
        # פריטים מושבתים
        cur.execute(
            """
            SELECT COUNT(*) 
            FROM maintenance_status 
            WHERE status = 'out_of_order'
            """
        )
        result = cur.fetchone()
        out_of_order_count = result[0] if result else 0
        
        # תחזוקות תקופתיות שחלף מועדן
        cur.execute(
            """
            SELECT COUNT(*) 
            FROM maintenance_schedules 
            WHERE next_due < CURRENT_DATE
            """
        )
        result = cur.fetchone()
        overdue_maintenance_count = result[0] if result else 0
        
        # תחזוקות קרובות (ב-30 יום הקרובים)
        cur.execute(
            """
            SELECT COUNT(*) 
            FROM maintenance_schedules 
            WHERE next_due BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
            """
        )
        result = cur.fetchone()
        upcoming_maintenance_count = result[0] if result else 0
        
        # אחריות שפגה תוקפה
        cur.execute(
            """
            SELECT COUNT(*) 
            FROM warranty_info 
            WHERE end_date < CURRENT_DATE
            """
        )
        result = cur.fetchone()
        expired_warranty_count = result[0] if result else 0
        
        # אחריות שתפוג בקרוב (ב-90 יום הקרובים)
        cur.execute(
            """
            SELECT COUNT(*) 
            FROM warranty_info 
            WHERE end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
            """
        )
        result = cur.fetchone()
        expiring_warranty_count = result[0] if result else 0
        
        # פריטים עם אחריות תקפה
        cur.execute(
            """
            SELECT COUNT(*) 
            FROM warranty_info 
            WHERE end_date >= CURRENT_DATE
            """
        )
        result = cur.fetchone()
        active_warranty_count = result[0] if result else 0
        
        # סטטיסטיקת עלויות תחזוקה
        cur.execute(
            """
            SELECT 
                SUM(cost) AS total_cost,
                AVG(cost) AS average_cost,
                MAX(cost) AS max_cost
            FROM maintenance_records
            WHERE start_date >= CURRENT_DATE - INTERVAL '1 year'
            """
        )
        cost_stats = cur.fetchone()
        
        # טיפול במקרה שאין נתונים או שהנתונים הם NULL
        if cost_stats is None:
            total_cost = 0
            average_cost = 0
            max_cost = 0
        else:
            total_cost = float(cost_stats[0]) if cost_stats[0] is not None else 0
            average_cost = float(cost_stats[1]) if cost_stats[1] is not None else 0
            max_cost = float(cost_stats[2]) if cost_stats[2] is not None else 0
        
        # קבלת רשימת הפריטים שנמצאים בתחזוקה עם פרטיהם
        cur.execute(
            """
            SELECT 
                ms.id, ms.item_id, ms.status, ms.notes, ms.updated_at,
                i.name, i.category
            FROM maintenance_status ms
            JOIN items i ON ms.item_id = i.id
            WHERE ms.status IN ('in_maintenance', 'out_of_order', 'needs_repair')
            ORDER BY ms.updated_at DESC
            """
        )
        maintenance_items = []
        for row in cur.fetchall():
            maintenance_items.append({
                'id': row[0],
                'item_id': row[1],
                'status': row[2],
                'notes': row[3],
                'updated_at': row[4],
                'name': row[5],
                'category': row[6]
            })
        
        # סיכום כולל
        return {
            'in_maintenance_count': in_maintenance_count,
            'needs_repair_count': needs_repair_count,
            'out_of_order_count': out_of_order_count,
            'total_issues_count': in_maintenance_count + needs_repair_count + out_of_order_count,
            'overdue_maintenance_count': overdue_maintenance_count,
            'upcoming_maintenance_count': upcoming_maintenance_count,
            'active_warranty_count': active_warranty_count,
            'expired_warranty_count': expired_warranty_count,
            'expiring_warranty_count': expiring_warranty_count,
            'total_yearly_cost': total_cost,
            'average_maintenance_cost': average_cost,
            'highest_single_cost': max_cost,
            'in_maintenance_items': maintenance_items,
            'under_warranty_count': active_warranty_count,
            'last_updated': get_israel_time()
        }
    finally:
        conn.close()