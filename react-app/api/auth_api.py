"""
מודול אימות משתמשים עבור ה-API.
גרסה מותאמת של auth.py ללא התלות ב-Streamlit.
"""

import sys
import os
import hashlib
import base64
import hmac
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from werkzeug.security import check_password_hash, generate_password_hash
from database import get_db_connection

def verify_scrypt_password(password_hash, password):
    """
    בדיקת סיסמה בפורמט scrypt
    פורמט: scrypt:32768:8:1$salt$hash
    """
    try:
        # מתאים לפורמט scrypt
        if password_hash.startswith("scrypt:"):
            # פיצול למרכיבים של ההצפנה
            parts = password_hash.split("$")
            if len(parts) != 3:
                return False
                
            scrypt_params = parts[0].split(":")
            if len(scrypt_params) != 4:
                return False
                
            N = int(scrypt_params[1])
            r = int(scrypt_params[2])
            p = int(scrypt_params[3])
            salt = parts[1].encode('utf-8')
            stored_hash = parts[2]
            
            # נוסף חישוב ה-hash עם הפרמטרים שנשלפו
            derived_key = hashlib.scrypt(
                password.encode('utf-8'),
                salt=salt,
                n=N,
                r=r,
                p=p,
                dklen=64
            )
            
            # המרת ההצפנה לייצוג hex
            derived_key_hex = derived_key.hex()
            
            # השוואה עם ההצפנה המקורית
            return hmac.compare_digest(derived_key_hex, stored_hash)
        
        # בדיקה עם werkzeug עבור פורמטים אחרים
        return check_password_hash(password_hash, password)
        
    except Exception as e:
        print(f"Error verifying password: {e}")
        return False

class User:
    def __init__(self, id, username, role, email, full_name, study_year=None, branch=None, status="active", created_at=None, last_login=None):
        self.id = id
        self.username = username
        self.role = role
        self.email = email
        self.full_name = full_name
        self.study_year = study_year
        self.branch = branch
        self.status = status
        self.created_at = created_at
        self.last_login = last_login

    @staticmethod
    def get(user_id):
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, username, password, role, email, full_name, 
                           study_year, branch, status, created_at, last_login 
                    FROM users WHERE id = %s
                """, (user_id,))
                user = cur.fetchone()
                if user:
                    return User(
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
        return None
        
    def to_dict(self):
        """המרת אובייקט המשתמש למילון - שימושי עבור JSON"""
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'email': self.email,
            'full_name': self.full_name,
            'study_year': self.study_year,
            'branch': self.branch,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
        
    def is_active(self):
        """בדיקה האם המשתמש פעיל"""
        return self.status == 'active'
        
    def can_access_category(self, category):
        """בדיקה האם למשתמש יש גישה לקטגוריה מסוימת"""
        # מנהלים ואנשי מחסן תמיד יכולים לגשת לכל הקטגוריות
        if self.role in ['admin', 'warehouse_staff']:
            return True
            
        # אם המשתמש לא פעיל, אין לו גישה לשום קטגוריה
        if not self.is_active():
            return False
            
        # לסטודנטים נבדוק לפי שנת הלימודים שלהם
        if self.role == 'student' and self.study_year:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT COUNT(*) FROM category_permissions 
                        WHERE study_year = %s AND category = %s
                    """, (self.study_year, category))
                    count = cur.fetchone()[0]
                    return count > 0
                    
        return False
        
    def can_access_item(self, item_id):
        """בדיקה האם למשתמש יש גישה לפריט מסוים"""
        # בדיקה אם המשתמש לא פעיל
        if not self.is_active():
            return False
            
        # מנהלים ואנשי מחסן תמיד יכולים לגשת לכל הפריטים
        if self.role in ['admin', 'warehouse_staff']:
            return True
            
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # בדיקה אם יש הגבלה ספציפית למשתמש עבור פריט זה
                cur.execute("""
                    SELECT COUNT(*) FROM user_item_restrictions 
                    WHERE user_id = %s AND item_id = %s
                """, (self.id, item_id))
                has_restriction = cur.fetchone()[0] > 0
                
                if has_restriction:
                    return False
                    
                # בדיקה לפי קטגוריה אם למשתמש יש גישה
                if self.role == 'student' and self.study_year:
                    cur.execute("""
                        SELECT category FROM items WHERE id = %s
                    """, (item_id,))
                    result = cur.fetchone()
                    
                    if result:
                        category = result[0]
                        return self.can_access_category(category)
                        
        return False

def login_api(username, password):
    # בדיקה מהירה למטרות פיתוח
    # הערה: בסביבת ייצור אמיתית, יש להשתמש בהצפנה אמיתית ולא בסיסמאות בטקסט פשוט
    if username == 'shachar' and password == '123456':
        # ניצור משתמש קבוע עם הרשאות מנהל מחסן
        return User(
            id=1,
            username='shachar',
            role='warehouse_staff',
            email='shachar@example.com',
            full_name='שחר ישראלי',
            branch='main',
            status='active'
        )
    
    if username == 'dawn' and password == '123456':
        # משתמש סטודנט לדוגמה
        return User(
            id=2,
            username='dawn',
            role='student',
            email='dawn@student.example.com',
            full_name='דון סטודנט',
            study_year='first',
            branch='main',
            status='active'
        )
    
    if username == 'admin' and (password == '123456' or password == 'admin123'):
        # משתמש אדמין לדוגמה
        return User(
            id=3,
            username='admin',
            role='admin',
            email='admin@example.com',
            full_name='מנהל המערכת',
            branch='main',
            status='active'
        )
    
    # ניסיון אימות בבסיס הנתונים
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # עדכון השאילתא כדי להחזיר את כל השדות החדשים
                cur.execute("""
                    SELECT id, username, password, role, email, full_name, 
                           study_year, branch, status, created_at, last_login 
                    FROM users WHERE username = %s
                """, (username,))
                user = cur.fetchone()
                
                if user:
                    # בדיקה אם המשתמש חסום
                    if user[8] == 'blocked':
                        print(f"User {username} is blocked")
                        return None
                        
                    try:
                        # אם אין סיסמה או שיש שגיאת תבנית - נאפשר כניסה עם סיסמאות ברירת מחדל במצב פיתוח
                        if not user[2]:  # אם הסיסמה ריקה
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
                            ) if password == '123456' or password == 'admin123' else None
                            
                            # עדכון תאריך ההתחברות האחרונה
                            if user_obj:
                                cur.execute("""
                                    UPDATE users SET last_login = CURRENT_TIMESTAMP
                                    WHERE id = %s
                                """, (user_obj.id,))
                                conn.commit()
                                
                            return user_obj
                            
                        # בדיקת סיסמה רגילה
                        if check_password_hash(user[2], password):
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
                            
                            # עדכון תאריך ההתחברות האחרונה
                            cur.execute("""
                                UPDATE users SET last_login = CURRENT_TIMESTAMP
                                WHERE id = %s
                            """, (user_obj.id,))
                            conn.commit()
                            
                            return user_obj
                    except Exception as e:
                        print(f"Error checking password: {e}")
                        # במקרה של שגיאה בבדיקת הסיסמה - נאפשר כניסה עם סיסמאות ברירת מחדל במצב פיתוח
                        if password == '123456' or password == 'admin123':
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
                            
                            # עדכון תאריך ההתחברות האחרונה
                            cur.execute("""
                                UPDATE users SET last_login = CURRENT_TIMESTAMP
                                WHERE id = %s
                            """, (user_obj.id,))
                            conn.commit()
                            
                            return user_obj
    except Exception as e:
        print(f"Database error: {e}")
        
    # בדיקה אחרונה - לאפשר כניסה חלופית במצב פיתוח
    if username == 'admin' and password == 'admin123':
        return User(
            id=999,
            username='admin',
            role='admin',
            email='admin@example.com',
            full_name='מנהל המערכת - גישה חירום',
            branch='main',
            status='active'
        )
                    
    return None  # אם האימות נכשל

def register_api(username, password, role, email, full_name, study_year=None, branch='main'):
    hashed_password = generate_password_hash(password)
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            try:
                # בדיקה האם המשתמש כבר קיים
                cur.execute("SELECT id FROM users WHERE username = %s", (username,))
                if cur.fetchone():
                    return False, "שם המשתמש כבר קיים במערכת"
                
                # קביעת ערכי ברירת מחדל לסטודנטים
                if role == 'student' and not study_year:
                    study_year = 'first'  # ברירת מחדל - שנה ראשונה
                
                # הוספת המשתמש החדש עם השדות הנוספים
                cur.execute(
                    """INSERT INTO users 
                       (username, password, role, email, full_name, study_year, branch, status)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s) 
                       RETURNING id""",
                    (username, hashed_password, role, email, full_name, study_year, branch, 'active')
                )
                
                user_id = cur.fetchone()[0]
                conn.commit()
                
                # החזרת אובייקט User החדש
                return True, User(
                    id=user_id,
                    username=username,
                    role=role,
                    email=email,
                    full_name=full_name,
                    study_year=study_year,
                    branch=branch,
                    status='active'
                )
            except Exception as e:
                conn.rollback()
                return False, f"שגיאה ביצירת משתמש: {str(e)}"

def verify_token_api(user_id):
    """אימות קיום המשתמש לפי מזהה"""
    return User.get(user_id)