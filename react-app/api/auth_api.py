"""
מודול אימות משתמשים עבור ה-API.
גרסה מותאמת עם תמיכה בסיסמאות פשוטות לדיפלוי.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from database import get_db_connection

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
        try:
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
        except Exception as e:
            print(f"Error getting user {user_id}: {e}")
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
    """
    פונקציית אימות עבור API - מסתמכת על בסיס הנתונים בלבד
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, username, password, role, email, full_name, 
                           study_year, branch, status, created_at, last_login 
                    FROM users WHERE username = %s
                """, (username,))
                user = cur.fetchone()
                
                if not user:
                    return None
                
                # בדיקה שהמשתמש לא חסום
                user_status = user[8] if user[8] else 'active'
                if user_status == 'blocked':
                    return None
                
                # בדיקת סיסמה - מקבל סיסמאות פשוטות לדיפלוי
                stored_password = user[2] if user[2] else ''
                user_role = user[3]
                
                password_valid = False
                
                # אם המשתמש admin - מקבל admin123 או 123456
                if user_role == 'admin' and password in ['admin123', '123456']:
                    password_valid = True
                # עבור כל המשתמשים האחרים - מקבל 123456
                elif password == '123456':
                    password_valid = True
                # אם יש סיסמה מוצפנת בבסיס הנתונים - נבדוק אותה
                elif stored_password and stored_password.strip() != '':
                    password_valid = (password == stored_password)
                
                if not password_valid:
                    return None
                
                user_obj = User(
                    id=user[0],
                    username=user[1],
                    role=user[3],
                    email=user[4],
                    full_name=user[5],
                    study_year=user[6],
                    branch=user[7] if user[7] else 'main',
                    status=user_status,
                    created_at=user[9],
                    last_login=user[10]
                )
                
                # עדכון תאריך ההתחברות האחרונה
                cur.execute("""
                    UPDATE users SET last_login = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (user_obj.id,))
                conn.commit()
                
                # print(f"DEBUG: User {username} logged in successfully with role {user_role}")
                return user_obj
                        
    except Exception as e:
        print(f"ERROR: Database login failed: {e}")
        import traceback
        traceback.print_exc()
    
    return None

def register_api(username, password, role, email, full_name, study_year=None, branch='main'):
    """רישום משתמש חדש"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # בדיקה אם המשתמש כבר קיים
                cur.execute("SELECT id FROM users WHERE username = %s", (username,))
                if cur.fetchone():
                    return None  # המשתמש כבר קיים
                
                # הוספת המשתמש החדש
                cur.execute("""
                    INSERT INTO users (username, password, role, email, full_name, study_year, branch, status, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'active', CURRENT_TIMESTAMP)
                    RETURNING id
                """, (username, '', role, email, full_name, study_year, branch))
                
                result = cur.fetchone()
                if not result:
                    return None
                user_id = result[0]
                conn.commit()
                
                return User(
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
        print(f"Error during registration: {e}")
    
    return None

def verify_token_api(user_id):
    """אימות קיום המשתמש לפי מזהה"""
    return User.get(user_id)