"""
סקריפט זה בודק את זמינות פריט מסוים בטווח תאריכים.
משמש את ה-API של React לבדיקת זמינות לפני יצירת הזמנה.
"""

import json
import sys
from datetime import datetime
import traceback
from database import get_db_connection

def check_item_availability(item_id, start_date, end_date, quantity=1):
    """פונקציה שבודקת את זמינות הפריט בטווח התאריכים המבוקש"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # בדיקת זמינות הפריט
                cur.execute("""
                    SELECT i.id, i.name, i.category, i.quantity,
                        i.quantity - COALESCE(
                            (SELECT SUM(r.quantity)
                             FROM reservations r
                             WHERE r.item_id = i.id
                             AND r.status IN ('approved', 'pending')
                             AND (
                                 (r.start_date <= %s AND r.end_date >= %s)
                                 OR (r.start_date <= %s AND r.end_date >= %s)
                                 OR (r.start_date >= %s AND r.end_date <= %s)
                             )), 0) as available_quantity
                    FROM items i
                    WHERE i.id = %s AND i.is_available = true
                """, (end_date, start_date, end_date, start_date, start_date, end_date, item_id))
                
                row = cur.fetchone()
                if not row:
                    return {"success": False, "message": "פריט לא נמצא"}
                
                item_id, name, category, total_quantity, available_quantity = row
                
                # מידע נוסף על הזמנות קיימות לפריט זה בטווח התאריכים
                cur.execute("""
                    SELECT r.id, r.start_date, r.end_date, r.quantity, r.student_name, r.status
                    FROM reservations r
                    WHERE r.item_id = %s
                    AND r.status IN ('approved', 'pending')
                    AND (
                        (r.start_date <= %s AND r.end_date >= %s)
                        OR (r.start_date <= %s AND r.end_date >= %s)
                        OR (r.start_date >= %s AND r.end_date <= %s)
                    )
                    ORDER BY r.start_date
                """, (item_id, end_date, start_date, end_date, start_date, start_date, end_date))
                
                existing_reservations = []
                for res_row in cur.fetchall():
                    res_id, res_start, res_end, res_quantity, res_student, res_status = res_row
                    existing_reservations.append({
                        "id": res_id,
                        "start_date": res_start.strftime("%Y-%m-%d") if res_start else None,
                        "end_date": res_end.strftime("%Y-%m-%d") if res_end else None,
                        "quantity": res_quantity,
                        "student_name": res_student,
                        "status": res_status
                    })
                
                # החזרת תוצאה
                is_available = available_quantity >= quantity
                
                return {
                    "success": True,
                    "item": {
                        "id": item_id,
                        "name": name,
                        "category": category,
                        "total_quantity": total_quantity,
                        "available_quantity": available_quantity
                    },
                    "is_available": is_available,
                    "existing_reservations": existing_reservations,
                    "message": "הפריט זמין בתאריכים המבוקשים" if is_available else "הפריט אינו זמין בכמות המבוקשת"
                }
    except Exception as e:
        print(f"Error checking item availability: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        raise

def main():
    """פונקציה ראשית שבודקת זמינות פריט מפרמטרים בפורמט JSON"""
    try:
        # קריאת פרמטרים מ-stdin בפורמט JSON
        input_data = json.loads(sys.stdin.read())
        
        # חילוץ פרמטרים
        item_id = input_data.get('item_id')
        start_date_str = input_data.get('start_date')
        end_date_str = input_data.get('end_date')
        quantity = input_data.get('quantity', 1)
        
        # בדיקת תקינות הפרמטרים
        if not all([item_id, start_date_str, end_date_str]):
            raise ValueError("חסרים פרמטרים נדרשים: item_id, start_date, end_date")
        
        # המרת תאריכים לפורמט דיסיימל
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
        
        # בדיקת זמינות
        result = check_item_availability(item_id, start_date, end_date, quantity)
        
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "message": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()