from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db_connection
import streamlit as st
from functools import wraps

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

def login(username, password):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM users WHERE username = %s", (username,))
            user = cur.fetchone()
            if user and check_password_hash(user[2], password):
                st.session_state.user = User(
                    id=user[0],
                    username=user[1],
                    role=user[3],
                    email=user[4],
                    full_name=user[5]
                )
                return True
    return False

def logout():
    st.session_state.user = None

def create_user(username, password, role, email, full_name):
    hashed_password = generate_password_hash(password)
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
            if login(username, password):
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
                login(username, password)
                st.rerun()
            else:
                st.error("שגיאה בהרשמה. ייתכן ששם המשתמש או האימייל כבר קיימים")
