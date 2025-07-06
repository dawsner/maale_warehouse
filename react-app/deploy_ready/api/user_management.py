"""
מודול לניהול משתמשים - פעולות נוספות מעבר להרשמה והתחברות בסיסיים.
כולל חסימת משתמשים, ניהול הרשאות והגבלות גישה לפריטים ספציפיים.
"""

import sys
import os
import json
import datetime
import logging
import psycopg2
from psycopg2.extras import RealDictCursor

# הגדרת ספרייה נוכחית להיות בספרייה של הקובץ
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(parent_dir)

# ייבוא פונקציית חיבור למסד הנתונים
from database import get_db_connection

# קידוד JSON לאובייקטי תאריך
class DateTimeEncoder(json.JSONEncoder):
    """מחלקה להמרת אובייקטי תאריך ל-JSON"""
    def default(self, o):
        if isinstance(o, (datetime.datetime, datetime.date)):
            return o.isoformat()
        return super(DateTimeEncoder, self).default(o)

def get_all_users():
    """מחזיר רשימה של כל המשתמשים במערכת"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # שליפת כל המשתמשים עם מידע נוסף
        cursor.execute("""
            SELECT 
                id, username, role, email, full_name, study_year, branch, 
                status, created_at, last_login 
            FROM users 
            ORDER BY full_name
        """)
        
        users = cursor.fetchall()
        return {'success': True, 'users': users}
    
    except Exception as e:
        logging.error(f"Error fetching users: {e}")
        return {'success': False, 'message': str(e)}
    
    finally:
        if conn:
            conn.close()

def update_user_status(user_id, status):
    """
    משנה את סטטוס המשתמש (פעיל/חסום)
    status יכול להיות 'active' או 'blocked'
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # עדכון הסטטוס של המשתמש
        cursor.execute("""
            UPDATE users 
            SET status = %s, 
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = %s
            RETURNING id
        """, (status, user_id))
        
        updated = cursor.fetchone()
        conn.commit()
        
        if not updated:
            return {'success': False, 'message': 'User not found'}
            
        return {'success': True, 'message': f'User status updated to {status}'}
    
    except Exception as e:
        if conn:
            conn.rollback()
        logging.error(f"Error updating user status: {e}")
        return {'success': False, 'message': str(e)}
    
    finally:
        if conn:
            conn.close()

def update_user_details(user_id, details):
    """
    עדכון פרטי משתמש
    details הוא מילון המכיל את השדות לעדכון (לדוגמה: full_name, email, role, study_year, branch)
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # בניית השאילתה הדינמית לעדכון רק השדות שהתקבלו
        allowed_fields = {'full_name', 'email', 'role', 'study_year', 'branch'}
        fields_to_update = {k: v for k, v in details.items() if k in allowed_fields}
        
        if not fields_to_update:
            return {'success': False, 'message': 'No valid fields to update'}
        
        query_parts = []
        values = []
        
        for field, value in fields_to_update.items():
            query_parts.append(f"{field} = %s")
            values.append(value)
        
        # הוספת שדה updated_at
        query_parts.append("updated_at = CURRENT_TIMESTAMP")
        
        # בניית השאילתה המלאה
        query = f"""
            UPDATE users 
            SET {', '.join(query_parts)} 
            WHERE id = %s
            RETURNING id
        """
        
        values.append(user_id)
        cursor.execute(query, values)
        
        updated = cursor.fetchone()
        conn.commit()
        
        if not updated:
            return {'success': False, 'message': 'User not found'}
            
        return {'success': True, 'message': 'User details updated successfully'}
    
    except Exception as e:
        if conn:
            conn.rollback()
        logging.error(f"Error updating user details: {e}")
        return {'success': False, 'message': str(e)}
    
    finally:
        if conn:
            conn.close()

def change_user_password(user_id, new_password):
    """שינוי סיסמת משתמש"""
    conn = None
    try:
        # יצירת גיבוב לסיסמה
        import hashlib
        import os
        import base64
        
        # יצירת salt אקראי
        salt = os.urandom(16)
        salt_b64 = base64.b64encode(salt).decode('utf-8')
        
        # יצירת גיבוב לסיסמה בסגנון דומה ל-scrypt
        password_bytes = new_password.encode('utf-8')
        hash_obj = hashlib.pbkdf2_hmac('sha256', password_bytes, salt, 1000)
        password_hash_b64 = base64.b64encode(hash_obj).decode('utf-8')
        
        # יצירת מחרוזת גיבוב בפורמט: scrypt:32768:8:1$salt_b64$hash_b64
        password_hash = f"scrypt:32768:8:1${salt_b64}${password_hash_b64}"
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # עדכון הסיסמה בבסיס הנתונים
        cursor.execute("""
            UPDATE users 
            SET password_hash = %s, 
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = %s
            RETURNING id
        """, (password_hash, user_id))
        
        updated = cursor.fetchone()
        conn.commit()
        
        if not updated:
            return {'success': False, 'message': 'User not found'}
            
        return {'success': True, 'message': 'Password changed successfully'}
    
    except Exception as e:
        if conn:
            conn.rollback()
        logging.error(f"Error changing user password: {e}")
        return {'success': False, 'message': str(e)}
    
    finally:
        if conn:
            conn.close()

def get_user_restrictions(user_id):
    """מחזיר רשימה של כל ההגבלות לפריטים ספציפיים עבור משתמש מסוים"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # שליפת הגבלות הפריטים של המשתמש
        cursor.execute("""
            SELECT 
                ur.id, ur.user_id, ur.item_id, ur.reason, ur.created_at,
                ur.created_by as created_by_id, u.full_name as created_by_name,
                i.name as item_name, i.category as item_category
            FROM user_item_restrictions ur
            JOIN users u ON ur.created_by = u.id
            JOIN items i ON ur.item_id = i.id
            WHERE ur.user_id = %s
            ORDER BY ur.created_at DESC
        """, (user_id,))
        
        restrictions = cursor.fetchall()
        return {'success': True, 'restrictions': restrictions}
    
    except Exception as e:
        logging.error(f"Error fetching user restrictions: {e}")
        return {'success': False, 'message': str(e)}
    
    finally:
        if conn:
            conn.close()

def add_user_restriction(user_id, item_id, reason, created_by):
    """הוספת הגבלת גישה לפריט ספציפי למשתמש"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # בדיקה אם ההגבלה כבר קיימת
        cursor.execute("""
            SELECT id FROM user_item_restrictions
            WHERE user_id = %s AND item_id = %s
        """, (user_id, item_id))
        
        existing = cursor.fetchone()
        
        if existing:
            # עדכון הגבלה קיימת
            cursor.execute("""
                UPDATE user_item_restrictions
                SET reason = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = %s AND item_id = %s
                RETURNING id
            """, (reason, user_id, item_id))
        else:
            # יצירת הגבלה חדשה
            cursor.execute("""
                INSERT INTO user_item_restrictions (user_id, item_id, reason, created_by)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """, (user_id, item_id, reason, created_by))
        
        result = cursor.fetchone()
        conn.commit()
        
        if not result:
            return {'success': False, 'message': 'Failed to add or update restriction'}
            
        # הוצאת המזהה מהתוצאה בצורה בטוחה
        restriction_id = result[0] if result and len(result) > 0 else None
        return {'success': True, 'restriction_id': restriction_id, 'message': 'Restriction added successfully'}
    
    except Exception as e:
        if conn:
            conn.rollback()
        logging.error(f"Error adding user restriction: {e}")
        return {'success': False, 'message': str(e)}
    
    finally:
        if conn:
            conn.close()

def remove_user_restriction(restriction_id):
    """הסרת הגבלת גישה לפריט ספציפי"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # מחיקת ההגבלה
        cursor.execute("""
            DELETE FROM user_item_restrictions
            WHERE id = %s
            RETURNING id
        """, (restriction_id,))
        
        deleted = cursor.fetchone()
        conn.commit()
        
        if not deleted:
            return {'success': False, 'message': 'Restriction not found'}
            
        return {'success': True, 'message': 'Restriction removed successfully'}
    
    except Exception as e:
        if conn:
            conn.rollback()
        logging.error(f"Error removing user restriction: {e}")
        return {'success': False, 'message': str(e)}
    
    finally:
        if conn:
            conn.close()

def get_category_permissions():
    """מחזיר רשימה של כל הרשאות הקטגוריות לפי שנת לימודים"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # שליפת הרשאות קטגוריות
        cursor.execute("""
            SELECT id, study_year, category, created_at
            FROM category_permissions
            ORDER BY study_year, category
        """)
        
        permissions = cursor.fetchall()
        return {'success': True, 'permissions': permissions}
    
    except Exception as e:
        logging.error(f"Error fetching category permissions: {e}")
        return {'success': False, 'message': str(e)}
    
    finally:
        if conn:
            conn.close()

def add_category_permission(study_year, category):
    """הוספת הרשאה לקטגוריה עבור שנת לימודים מסוימת"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # בדיקה אם ההרשאה כבר קיימת
        cursor.execute("""
            SELECT id FROM category_permissions
            WHERE study_year = %s AND category = %s
        """, (study_year, category))
        
        existing = cursor.fetchone()
        
        if existing:
            return {'success': False, 'message': 'Permission already exists'}
        
        # יצירת הרשאה חדשה
        cursor.execute("""
            INSERT INTO category_permissions (study_year, category)
            VALUES (%s, %s)
            RETURNING id
        """, (study_year, category))
        
        result = cursor.fetchone()
        conn.commit()
        
        if not result:
            return {'success': False, 'message': 'Failed to add permission'}
            
        # הוצאת המזהה מהתוצאה בצורה בטוחה
        permission_id = result[0] if result and len(result) > 0 else None
        return {'success': True, 'permission_id': permission_id, 'message': 'Permission added successfully'}
    
    except Exception as e:
        if conn:
            conn.rollback()
        logging.error(f"Error adding category permission: {e}")
        return {'success': False, 'message': str(e)}
    
    finally:
        if conn:
            conn.close()

def remove_category_permission(permission_id):
    """הסרת הרשאה לקטגוריה"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # מחיקת ההרשאה
        cursor.execute("""
            DELETE FROM category_permissions
            WHERE id = %s
            RETURNING id
        """, (permission_id,))
        
        deleted = cursor.fetchone()
        conn.commit()
        
        if not deleted:
            return {'success': False, 'message': 'Permission not found'}
            
        return {'success': True, 'message': 'Permission removed successfully'}
    
    except Exception as e:
        if conn:
            conn.rollback()
        logging.error(f"Error removing category permission: {e}")
        return {'success': False, 'message': str(e)}
    
    finally:
        if conn:
            conn.close()

def get_available_categories_for_user(user_id):
    """מחזיר רשימה של כל הקטגוריות הזמינות למשתמש מסוים"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # שליפת פרטי המשתמש
        cursor.execute("""
            SELECT role, study_year FROM users WHERE id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        
        if not user:
            return {'success': False, 'message': 'User not found'}
        
        # אם המשתמש הוא מנהל או מחסנאי - כל הקטגוריות זמינות
        if user['role'] in ('admin', 'warehouse_staff'):
            cursor.execute("""
                SELECT DISTINCT category FROM items ORDER BY category
            """)
            categories = [row['category'] for row in cursor.fetchall()]
            return {'success': True, 'categories': categories}
        
        # עבור סטודנטים - רק קטגוריות המורשות לשנת הלימוד שלהם
        cursor.execute("""
            SELECT category FROM category_permissions
            WHERE study_year = %s
            ORDER BY category
        """, (user['study_year'],))
        
        categories = [row['category'] for row in cursor.fetchall()]
        return {'success': True, 'categories': categories}
    
    except Exception as e:
        logging.error(f"Error fetching available categories: {e}")
        return {'success': False, 'message': str(e)}
    
    finally:
        if conn:
            conn.close()

def main():
    """פונקציה ראשית למודול ניהול משתמשים"""
    try:
        # קריאת הקלט מ-stdin
        request_body = sys.stdin.read()
        request_data = json.loads(request_body) if request_body else {}
        
        action = request_data.get('action', '')
        params = request_data.get('params', {})
        
        # ביצוע הפעולה המבוקשת
        if action == 'get_all_users':
            result = get_all_users()
        elif action == 'update_user_status':
            result = update_user_status(params.get('user_id'), params.get('status'))
        elif action == 'update_user_details':
            result = update_user_details(params.get('user_id'), params.get('details', {}))
        elif action == 'change_user_password':
            result = change_user_password(params.get('user_id'), params.get('new_password'))
        elif action == 'get_user_restrictions':
            result = get_user_restrictions(params.get('user_id'))
        elif action == 'add_user_restriction':
            result = add_user_restriction(
                params.get('user_id'), 
                params.get('item_id'), 
                params.get('reason', ''), 
                params.get('created_by')
            )
        elif action == 'remove_user_restriction':
            result = remove_user_restriction(params.get('restriction_id'))
        elif action == 'get_category_permissions':
            result = get_category_permissions()
        elif action == 'add_category_permission':
            result = add_category_permission(params.get('study_year'), params.get('category'))
        elif action == 'remove_category_permission':
            result = remove_category_permission(params.get('permission_id'))
        elif action == 'get_available_categories':
            result = get_available_categories_for_user(params.get('user_id'))
        else:
            result = {'success': False, 'message': f'Unknown action: {action}'}
        
        # החזרת תוצאה כ-JSON
        print(json.dumps(result, cls=DateTimeEncoder))
        
    except Exception as e:
        error_result = {'success': False, 'message': str(e)}
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()