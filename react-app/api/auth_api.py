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
            salt = parts[1]
            stored_hash = parts[2]
            
            # פענוח ה-salt מ-base64
            salt_padding = '=' * (4 - len(salt) % 4) % 4
            salt_bytes = base64.b64decode(salt + salt_padding)
            
            # חישוב ה-hash עם הפרמטרים שנשלפו
            derived_key = hashlib.scrypt(
                password.encode('utf-8'),
                salt=salt_bytes,
                n=N,
                r=r,
                p=p,
                dklen=64
            )
            
            # פענוח ה-hash המאוחסן מ-base64
            stored_hash_padding = '=' * (4 - len(stored_hash) % 4) % 4
            stored_hash_bytes = base64.b64decode(stored_hash + stored_hash_padding)
            
            # השוואה בטוחה
            return hmac.compare_digest(derived_key, stored_hash_bytes)
        else:
            # פורמט לא נתמך
            return False
    except Exception as e:
        print(f"Error in scrypt verification: {e}", file=sys.stderr)
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
        """קבלת פרטי משתמש לפי מזהה"""
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT id, username, role, email, full_name, 
                               study_year, branch, status, created_at, last_login
                        FROM users WHERE id = %s
                    """, (user_id,))
                    user = cur.fetchone()
                    if user:
                        return User(
                            id=user[0],
                            username=user[1],
                            role=user[2],
                            email=user[3],
                            full_name=user[4],
                            study_year=user[5],
                            branch=user[6],
                            status=user[7],
                            created_at=user[8],
                            last_login=user[9]
                        )
        except Exception as e:
            print(f"Error getting user: {e}", file=sys.stderr)
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

def login_api(username, password):
    """התחברות משתמש עם בדיקה במסד הנתונים האמיתי"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # חיפוש המשתמש במסד הנתונים
                cur.execute("""
                    SELECT id, username, password, role, email, full_name, 
                           study_year, branch, status, created_at, last_login
                    FROM users 
                    WHERE username = %s AND status = 'active'
                """, (username,))
                
                user_data = cur.fetchone()
                
                if not user_data:
                    return None  # משתמש לא נמצא או לא פעיל
                
                user_id, db_username, password_hash, role, email, full_name, study_year, branch, status, created_at, last_login = user_data
                
                # בדיקת הסיסמה - תמיכה בפורמטים שונים
                password_valid = False
                
                if password_hash:
                    # בדיקה אם זה פורמט scrypt
                    if password_hash.startswith("scrypt:"):
                        password_valid = verify_scrypt_password(password_hash, password)
                    # בדיקה אם זה פורמט werkzeug/pbkdf2
                    elif password_hash.startswith("pbkdf2:"):
                        password_valid = check_password_hash(password_hash, password)
                    # בדיקה אם זה פורמט bcrypt 
                    elif password_hash.startswith("$2a$") or password_hash.startswith("$2b$") or password_hash.startswith("$2y$"):
                        try:
                            import bcrypt
                            password_valid = bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
                        except ImportError:
                            # אם bcrypt לא זמין, ננסה עם werkzeug (שמטפל גם ב-bcrypt)
                            try:
                                from werkzeug.security import check_password_hash
                                # בניסיון לטפל ב-bcrypt דרך werkzeug, צריך לוודא שזה בפורמט הנכון
                                password_valid = bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
                            except:
                                password_valid = False
                    # פורמט פשוט (לא מומלץ אבל תומך לצורך תאימות אחורה)
                    else:
                        password_valid = (password_hash == password)
                
                if not password_valid:
                    return None  # סיסמה שגויה
                
                # עדכון זמן התחברות אחרון
                cur.execute("""
                    UPDATE users 
                    SET last_login = NOW() 
                    WHERE id = %s
                """, (user_id,))
                conn.commit()
                
                # יצירת אובייקט המשתמש
                return User(
                    id=user_id,
                    username=db_username,
                    role=role,
                    email=email,
                    full_name=full_name,
                    study_year=study_year,
                    branch=branch,
                    status=status,
                    created_at=created_at,
                    last_login=last_login
                )
                
    except Exception as e:
        print(f"Database error during login: {str(e)}", file=sys.stderr)
        return None

def register_api(username, password, role, email, full_name, study_year=None, branch='main'):
    """רישום משתמש חדש"""
    hashed_password = generate_password_hash(password)
    
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # בדיקה האם המשתמש כבר קיים
                cur.execute("SELECT id FROM users WHERE username = %s", (username,))
                if cur.fetchone():
                    return {'success': False, 'message': "שם המשתמש כבר קיים במערכת"}
                
                # קביעת ערכי ברירת מחדל לסטודנטים
                if role == 'student' and not study_year:
                    study_year = 'first'  # ברירת מחדל - שנה ראשונה
                
                # הוספת המשתמש החדש
                cur.execute(
                    """INSERT INTO users 
                       (username, password, role, email, full_name, study_year, branch, status)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s) 
                       RETURNING id""",
                    (username, hashed_password, role, email, full_name, study_year, branch, 'active')
                )
                result = cur.fetchone()
                if result:
                    user_id = result[0]
                else:
                    raise Exception("Failed to create user")
                conn.commit()
                
                return {'success': True, 'user_id': user_id, 'message': 'משתמש נוצר בהצלחה'}
                
    except Exception as e:
        print(f"Database error during registration: {str(e)}", file=sys.stderr)
        return {'success': False, 'message': f'שגיאה ביצירת המשתמש: {str(e)}'}

def verify_token_api(user_id):
    """אימות קיום המשתמש לפי מזהה"""
    user = User.get(user_id)
    if user and user.is_active():
        return user
    return None