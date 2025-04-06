import bcrypt
from database import get_db_connection

def hash_password_bcrypt(password):
    """Hash password using bcrypt"""
    if isinstance(password, str):
        password = password.encode('utf-8')
    return bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')

def create_admin_user():
    username = "admin"
    password = "admin"
    role = "admin"
    email = "admin@example.com"
    full_name = "Admin User"
    
    # Generate bcrypt password
    hashed_password = hash_password_bcrypt(password)
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # בדוק אם המשתמש כבר קיים
            cur.execute("SELECT * FROM users WHERE username = %s", (username,))
            user = cur.fetchone()
            
            if user:
                # עדכן את הסיסמה
                cur.execute(
                    "UPDATE users SET password = %s WHERE username = %s",
                    (hashed_password, username)
                )
                print(f"Updated password for existing user {username}")
            else:
                # צור משתמש חדש
                cur.execute(
                    """INSERT INTO users (username, password, role, email, full_name)
                       VALUES (%s, %s, %s, %s, %s)""",
                    (username, hashed_password, role, email, full_name)
                )
                print(f"Created new user {username}")
            
            conn.commit()

if __name__ == "__main__":
    create_admin_user()