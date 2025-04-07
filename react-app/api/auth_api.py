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
    def __init__(self, id, username, role, email, full_name):
        self.id = id
        self.username = username
        self.role = role
        self.email = email
        self.full_name = full_name

    @staticmethod
    def get(user_id):
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
                user = cur.fetchone()
                if user:
                    return User(
                        id=user[0],
                        username=user[1],
                        role=user[3],
                        email=user[4],
                        full_name=user[5]
                    )
        return None

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
            full_name='שחר ישראלי'
        )
    
    if username == 'dawn' and password == '123456':
        # משתמש סטודנט לדוגמה
        return User(
            id=2,
            username='dawn',
            role='student',
            email='dawn@student.example.com',
            full_name='דון סטודנט'
        )
    
    if username == 'admin' and password == '123456':
        # משתמש אדמין לדוגמה
        return User(
            id=3,
            username='admin',
            role='admin',
            email='admin@example.com',
            full_name='מנהל המערכת'
        )
    
    # ניסיון אימות בבסיס הנתונים
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM users WHERE username = %s", (username,))
                user = cur.fetchone()
                
                if user:
                    try:
                        if check_password_hash(user[2], password):
                            return User(
                                id=user[0],
                                username=user[1],
                                role=user[3],
                                email=user[4],
                                full_name=user[5]
                            )
                    except Exception as e:
                        print(f"Error checking password: {e}")
    except Exception as e:
        print(f"Database error: {e}")
                    
    return None  # אם האימות נכשל

def register_api(username, password, role, email, full_name):
    hashed_password = generate_password_hash(password)
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            try:
                # בדיקה האם המשתמש כבר קיים
                cur.execute("SELECT id FROM users WHERE username = %s", (username,))
                if cur.fetchone():
                    return False, "שם המשתמש כבר קיים במערכת"
                
                # הוספת המשתמש החדש
                cur.execute(
                    """INSERT INTO users (username, password, role, email, full_name)
                       VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                    (username, hashed_password, role, email, full_name)
                )
                
                user_id = cur.fetchone()[0]
                conn.commit()
                
                # החזרת אובייקט User החדש
                return True, User(
                    id=user_id,
                    username=username,
                    role=role,
                    email=email,
                    full_name=full_name
                )
            except Exception as e:
                conn.rollback()
                return False, f"שגיאה ביצירת משתמש: {str(e)}"

def verify_token_api(user_id):
    """אימות קיום המשתמש לפי מזהה"""
    return User.get(user_id)