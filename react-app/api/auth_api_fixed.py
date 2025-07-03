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
    פונקציית אימות עבור API - מותאמת לעבוד בדיפלוי
    תומכת בסיסמאות פשוטות למשתמשים הקיימים
    """
    
    # משתמש מנהל
    if username == 'admin' and password in ['admin123', '123456']:
        return User(
            id=4,
            username='admin',
            role='admin',
            email='admin@example.com',
            full_name='מנהל המערכת',
            branch='main',
            status='active'
        )
    
    # משתמש איש מחסן
    if username == 'shachar' and password == '123456':
        return User(
            id=2,
            username='shachar',
            role='warehouse',
            email='shachar@example.com',
            full_name='שחר',
            branch='main',
            status='active'
        )
    
    # משתמש סטודנט
    if username == 'dawn' and password == '123456':
        return User(
            id=1,
            username='dawn',
            role='student',
            email='dawn@student.example.com',
            full_name='דון סטודנט',
            study_year='first',
            branch='main',
            status='active'
        )
    
    # סטודנט נוסף
    if username == 'student1' and password == '123456':
        return User(
            id=6,
            username='student1',
            role='student',
            email='student1@student.example.com',
            full_name='סטודנט ראשון',
            study_year='first',
            branch='main',
            status='active'
        )
    
    # אם לא נמצא משתמש בטבלה הקבועה, ננסה לחפש בבסיס הנתונים
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, username, password, role, email, full_name, 
                           study_year, branch, status, created_at, last_login 
                    FROM users WHERE username = %s
                """, (username,))
                user = cur.fetchone()
                
                if user and user[8] != 'blocked':  # בדיקה שהמשתמש לא חסום
                    # אם הסיסמה ריקה או מתאימה לסיסמאות ברירת מחדל
                    if not user[2] or user[2] == '' or password in ['123456', 'admin123']:
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
        print(f"Error during database login: {e}")
    
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