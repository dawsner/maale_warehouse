"""
מודול לניהול משתמשים - פעולות נוספות מעבר להרשמה והתחברות בסיסיים.
כולל חסימת משתמשים, ניהול הרשאות והגבלות גישה לפריטים ספציפיים.
"""

import sys
import os
import json
import datetime
import traceback

# הוספת תיקיית השורש לpath כדי לאפשר import של מודולים אחרים
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(parent_dir)

from database import get_db_connection
from werkzeug.security import generate_password_hash
from auth_api import User

class DateTimeEncoder(json.JSONEncoder):
    """מחלקה להמרת אובייקטי תאריך ל-JSON"""
    def default(self, o):
        if isinstance(o, (datetime.datetime, datetime.date)):
            return o.isoformat()
        return super().default(o)

def get_all_users():
    """מחזיר רשימה של כל המשתמשים במערכת"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, username, password, role, email, full_name, 
                       study_year, branch, status, created_at, last_login 
                FROM users
                ORDER BY id
            """)
            users = []
            for user in cur.fetchall():
                user_obj = User(
                    id=user[0],
                    username=user[1],
                    role=user[3],
                    email=user[4],
                    full_name=user[5],
                    study_year=user[6],
                    branch=user[7],
                    status=user[8],
                    created_at=user[9],
                    last_login=user[10]
                )
                users.append(user_obj.to_dict())
            return users

def update_user_status(user_id, status):
    """
    משנה את סטטוס המשתמש (פעיל/חסום)
    status יכול להיות 'active' או 'blocked'
    """
    if status not in ['active', 'blocked']:
        return False, "סטטוס לא חוקי. ערכים אפשריים: 'active', 'blocked'"
        
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("UPDATE users SET status = %s WHERE id = %s", (status, user_id))
                if cur.rowcount == 0:
                    return False, "משתמש לא נמצא"
                conn.commit()
                return True, f"סטטוס המשתמש עודכן ל-{status}"
    except Exception as e:
        return False, f"שגיאה בעדכון סטטוס המשתמש: {str(e)}"

def update_user_details(user_id, details):
    """
    עדכון פרטי משתמש
    details הוא מילון המכיל את השדות לעדכון (לדוגמה: full_name, email, role, study_year, branch)
    """
    allowed_fields = ['full_name', 'email', 'role', 'study_year', 'branch']
    update_fields = []
    params = []
    
    # בנייה של שאילתת העדכון הדינמית
    for field in allowed_fields:
        if field in details and details[field] is not None:
            update_fields.append(f"{field} = %s")
            params.append(details[field])
            
    if not update_fields:
        return False, "לא סופקו שדות לעדכון"
            
    # הוספת ה-ID בסוף הפרמטרים
    params.append(user_id)
    
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s"
                cur.execute(query, params)
                
                if cur.rowcount == 0:
                    return False, "משתמש לא נמצא"
                    
                conn.commit()
                return True, "פרטי המשתמש עודכנו בהצלחה"
    except Exception as e:
        return False, f"שגיאה בעדכון פרטי המשתמש: {str(e)}"

def change_user_password(user_id, new_password):
    """שינוי סיסמת משתמש"""
    try:
        hashed_password = generate_password_hash(new_password)
        
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("UPDATE users SET password = %s WHERE id = %s", (hashed_password, user_id))
                
                if cur.rowcount == 0:
                    return False, "משתמש לא נמצא"
                    
                conn.commit()
                return True, "סיסמת המשתמש שונתה בהצלחה"
    except Exception as e:
        return False, f"שגיאה בשינוי סיסמת המשתמש: {str(e)}"

def get_user_restrictions(user_id):
    """מחזיר רשימה של כל ההגבלות לפריטים ספציפיים עבור משתמש מסוים"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT r.id, r.user_id, r.item_id, i.name, i.category, r.reason, 
                       r.created_at, r.created_by, u.username as created_by_name
                FROM user_item_restrictions r
                JOIN items i ON r.item_id = i.id
                LEFT JOIN users u ON r.created_by = u.id
                WHERE r.user_id = %s
                ORDER BY r.created_at DESC
            """, (user_id,))
            
            restrictions = []
            for row in cur.fetchall():
                restrictions.append({
                    'id': row[0],
                    'user_id': row[1],
                    'item_id': row[2],
                    'item_name': row[3],
                    'item_category': row[4],
                    'reason': row[5],
                    'created_at': row[6],
                    'created_by_id': row[7],
                    'created_by_name': row[8]
                })
            
            return restrictions

def add_user_restriction(user_id, item_id, reason, created_by):
    """הוספת הגבלת גישה לפריט ספציפי למשתמש"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # בדיקה שהמשתמש קיים
                cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
                if not cur.fetchone():
                    return False, "משתמש לא נמצא"
                
                # בדיקה שהפריט קיים
                cur.execute("SELECT id FROM items WHERE id = %s", (item_id,))
                if not cur.fetchone():
                    return False, "פריט לא נמצא"
                
                # בדיקה אם כבר קיימת הגבלה
                cur.execute("""
                    SELECT id FROM user_item_restrictions
                    WHERE user_id = %s AND item_id = %s
                """, (user_id, item_id))
                
                existing = cur.fetchone()
                if existing:
                    # עדכון הגבלה קיימת
                    cur.execute("""
                        UPDATE user_item_restrictions
                        SET reason = %s, created_by = %s, created_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    """, (reason, created_by, existing[0]))
                    conn.commit()
                    return True, "הגבלת הגישה עודכנה בהצלחה"
                else:
                    # יצירת הגבלה חדשה
                    cur.execute("""
                        INSERT INTO user_item_restrictions (user_id, item_id, reason, created_by)
                        VALUES (%s, %s, %s, %s)
                    """, (user_id, item_id, reason, created_by))
                    conn.commit()
                    return True, "הגבלת הגישה נוספה בהצלחה"
    except Exception as e:
        return False, f"שגיאה בהוספת הגבלת גישה: {str(e)}"

def remove_user_restriction(restriction_id):
    """הסרת הגבלת גישה לפריט ספציפי"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM user_item_restrictions WHERE id = %s", (restriction_id,))
                
                if cur.rowcount == 0:
                    return False, "הגבלה לא נמצאה"
                
                conn.commit()
                return True, "הגבלת הגישה הוסרה בהצלחה"
    except Exception as e:
        return False, f"שגיאה בהסרת הגבלת גישה: {str(e)}"

def get_category_permissions():
    """מחזיר רשימה של כל הרשאות הקטגוריות לפי שנת לימודים"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, study_year, category, created_at
                FROM category_permissions
                ORDER BY study_year, category
            """)
            
            permissions = []
            for row in cur.fetchall():
                permissions.append({
                    'id': row[0],
                    'study_year': row[1],
                    'category': row[2],
                    'created_at': row[3]
                })
            
            return permissions

def add_category_permission(study_year, category):
    """הוספת הרשאה לקטגוריה עבור שנת לימודים מסוימת"""
    if study_year not in ['first', 'second', 'third']:
        return False, "שנת לימודים לא חוקית. ערכים אפשריים: 'first', 'second', 'third'"
        
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # בדיקה שהקטגוריה קיימת
                cur.execute("SELECT DISTINCT category FROM items WHERE category = %s", (category,))
                if not cur.fetchone():
                    return False, "קטגוריה לא נמצאה"
                
                # בדיקה אם כבר קיימת הרשאה כזו
                cur.execute("""
                    SELECT id FROM category_permissions
                    WHERE study_year = %s AND category = %s
                """, (study_year, category))
                
                if cur.fetchone():
                    return False, "הרשאה כזו כבר קיימת"
                
                # יצירת הרשאה חדשה
                cur.execute("""
                    INSERT INTO category_permissions (study_year, category)
                    VALUES (%s, %s)
                """, (study_year, category))
                
                conn.commit()
                return True, "הרשאת הקטגוריה נוספה בהצלחה"
    except Exception as e:
        return False, f"שגיאה בהוספת הרשאת קטגוריה: {str(e)}"

def remove_category_permission(permission_id):
    """הסרת הרשאה לקטגוריה"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM category_permissions WHERE id = %s", (permission_id,))
                
                if cur.rowcount == 0:
                    return False, "הרשאה לא נמצאה"
                
                conn.commit()
                return True, "הרשאת הקטגוריה הוסרה בהצלחה"
    except Exception as e:
        return False, f"שגיאה בהסרת הרשאת קטגוריה: {str(e)}"

def get_available_categories_for_user(user_id):
    """מחזיר רשימה של כל הקטגוריות הזמינות למשתמש מסוים"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # קבלת נתוני המשתמש
            cur.execute("""
                SELECT role, study_year
                FROM users
                WHERE id = %s
            """, (user_id,))
            
            user_data = cur.fetchone()
            if not user_data:
                return []
                
            role, study_year = user_data
            
            # אם המשתמש הוא מנהל מחסן או אדמין, הוא יכול לגשת לכל הקטגוריות
            if role in ['admin', 'warehouse_staff']:
                cur.execute("SELECT DISTINCT category FROM items ORDER BY category")
                return [row[0] for row in cur.fetchall()]
            
            # אם המשתמש הוא סטודנט, מחזיר רק את הקטגוריות המורשות לשנת הלימודים שלו
            if role == 'student' and study_year:
                cur.execute("""
                    SELECT DISTINCT category
                    FROM category_permissions
                    WHERE study_year = %s
                    ORDER BY category
                """, (study_year,))
                return [row[0] for row in cur.fetchall()]
            
            return []

def main():
    """פונקציה ראשית למודול ניהול משתמשים"""
    try:
        # קריאת נתוני ה-request מה-input הסטנדרטי
        request_data = json.loads(sys.stdin.read())
        
        # שליפת הפעולה הנדרשת והפרמטרים מהבקשה
        action = request_data.get('action', '')
        params = request_data.get('params', {})
        
        result = {'success': False, 'error': 'פעולה לא מוכרת'}
        
        # ביצוע הפעולה הנדרשת
        if action == 'get_all_users':
            users = get_all_users()
            result = {'success': True, 'users': users}
            
        elif action == 'update_user_status':
            success, message = update_user_status(params.get('user_id'), params.get('status'))
            result = {'success': success, 'message': message}
            
        elif action == 'update_user_details':
            success, message = update_user_details(params.get('user_id'), params.get('details', {}))
            result = {'success': success, 'message': message}
            
        elif action == 'change_user_password':
            success, message = change_user_password(params.get('user_id'), params.get('new_password'))
            result = {'success': success, 'message': message}
            
        elif action == 'get_user_restrictions':
            restrictions = get_user_restrictions(params.get('user_id'))
            result = {'success': True, 'restrictions': restrictions}
            
        elif action == 'add_user_restriction':
            success, message = add_user_restriction(
                params.get('user_id'), 
                params.get('item_id'), 
                params.get('reason', ''), 
                params.get('created_by')
            )
            result = {'success': success, 'message': message}
            
        elif action == 'remove_user_restriction':
            success, message = remove_user_restriction(params.get('restriction_id'))
            result = {'success': success, 'message': message}
            
        elif action == 'get_category_permissions':
            permissions = get_category_permissions()
            result = {'success': True, 'permissions': permissions}
            
        elif action == 'add_category_permission':
            success, message = add_category_permission(params.get('study_year'), params.get('category'))
            result = {'success': success, 'message': message}
            
        elif action == 'remove_category_permission':
            success, message = remove_category_permission(params.get('permission_id'))
            result = {'success': success, 'message': message}
            
        elif action == 'get_available_categories':
            categories = get_available_categories_for_user(params.get('user_id'))
            result = {'success': True, 'categories': categories}
            
        # החזרת התוצאה ב-JSON
        print(json.dumps(result, cls=DateTimeEncoder))
        
    except Exception as e:
        error_details = traceback.format_exc()
        print(json.dumps({
            'success': False,
            'error': f'שגיאה במודול ניהול משתמשים: {str(e)}',
            'details': error_details
        }, cls=DateTimeEncoder))

if __name__ == "__main__":
    main()