from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db_connection
import streamlit as st
from functools import wraps
import bcrypt

login_manager = LoginManager()

class User(UserMixin):
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

def init_auth():
    if 'user' not in st.session_state:
        st.session_state.user = None

def check_bcrypt_password(stored_hash, password):
    """Check bcrypt password"""
    try:
        # בדיקה אם יש לנו סיסמה תקפה
        if not stored_hash:
            print("Password hash is empty")
            return False
            
        # בדיקה אם הסיסמה מוצפנת בפורמט bcrypt
        if stored_hash.startswith('$2b$') or stored_hash.startswith('$2a$'):
            # המרת הסיסמה ל-bytes אם היא string
            if isinstance(password, str):
                password = password.encode('utf-8')
            if isinstance(stored_hash, str):
                stored_hash = stored_hash.encode('utf-8')
            return bcrypt.checkpw(password, stored_hash)
        else:
            # ננסה להשתמש ב-werkzeug במקרה שזה בפורמט אחר
            try:
                return check_password_hash(stored_hash, password)
            except ValueError as ve:
                print(f"Invalid hash format: {ve}")
                return False
    except Exception as e:
        print(f"Error in password check: {e}")
        return False

def hash_password_bcrypt(password):
    """Hash password using bcrypt"""
    if isinstance(password, str):
        password = password.encode('utf-8')
    return bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')

def login(username, password):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM users WHERE username = %s", (username,))
            user = cur.fetchone()
            if user:
                try:
                    if check_bcrypt_password(user[2], password):
                        user_obj = User(
                            id=user[0],
                            username=user[1],
                            role=user[3],
                            email=user[4],
                            full_name=user[5]
                        )
                        st.session_state.user = user_obj
                        return user_obj
                except Exception as e:
                    print(f"Error checking password: {e}")
    return None

def logout():
    st.session_state.user = None

def create_user(username, password, role, email, full_name):
    hashed_password = hash_password_bcrypt(password)
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            try:
                cur.execute(
                    """INSERT INTO users (username, password, role, email, full_name)
                       VALUES (%s, %s, %s, %s, %s)""",
                    (username, hashed_password, role, email, full_name)
                )
                conn.commit()
                return True
            except Exception as e:
                print(f"Error creating user: {e}")
                return False

def require_login(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if st.session_state.user is None:
            st.warning("עליך להתחבר כדי לגשת לדף זה")
            show_login_page()
            return
        return func(*args, **kwargs)
    return wrapper

def require_role(role):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if st.session_state.user is None:
                st.warning("עליך להתחבר כדי לגשת לדף זה")
                show_login_page()
                return
            if st.session_state.user.role != role:
                st.error("אין לך הרשאות לגשת לדף זה")
                return
            return func(*args, **kwargs)
        return wrapper
    return decorator

def show_login_page():
    st.header("התחברות")
    with st.form("login_form"):
        username = st.text_input("שם משתמש")
        password = st.text_input("סיסמה", type="password")
        submitted = st.form_submit_button("התחבר")
        
        if submitted and username and password:
            user = login(username, password)
            if user:
                st.success("התחברת בהצלחה!")
                st.rerun()
            else:
                st.error("שם משתמש או סיסמה שגויים")

def show_registration_page():
    st.header("הרשמה")
    with st.form("register_form"):
        username = st.text_input("שם משתמש")
        password = st.text_input("סיסמה", type="password")
        email = st.text_input("אימייל")
        full_name = st.text_input("שם מלא")
        role = st.selectbox("תפקיד", ["student", "warehouse"])
        
        submitted = st.form_submit_button("הירשם")
        
        if submitted and all([username, password, email, full_name]):
            if create_user(username, password, role, email, full_name):
                st.success("נרשמת בהצלחה!")
                user = login(username, password)
                if user:
                    st.rerun()
                else:
                    st.error("נרשמת בהצלחה אך יש בעיה בהתחברות")
            else:
                st.error("שגיאה בהרשמה. ייתכן ששם המשתמש או האימייל כבר קיימים")
