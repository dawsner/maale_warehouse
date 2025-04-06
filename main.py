import streamlit as st
from database import init_db
from components.inventory import show_inventory
from components.loans import show_loans
from components.history import show_history
from components.alerts import show_overdue_alerts
from components.statistics import show_statistics
from components.equipment_tracking import show_equipment_tracking
from components.reservations import show_reservations_page, show_reservation_management
from excel_handler import import_excel, export_to_excel
from utils import set_page_config, get_overdue_loans
from auth import init_auth, show_login_page, show_registration_page, logout
import os
import base64

def get_image_as_base64(path):
    with open(path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode()

def main():
    # Set page config with new layout
    st.set_page_config(
        page_title="מערכת ניהול מחסן השאלות",
        page_icon="📦",
        layout="wide",
        initial_sidebar_state="expanded"
    )
    init_db()
    init_auth()
    
    # Add ALL CSS styling here directly
    st.markdown('''
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap');
        
        /* בסיס */
        * {
            font-family: 'Open Sans', sans-serif !important;
        }
        
        .stApp {
            direction: rtl;
            font-family: 'Open Sans', sans-serif !important;
            background-color: #F8F9FB;
        }
        
        /* פס ניווט עליון */
        .top-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 70px;
            background-color: white;
            border-bottom: 1px solid #E6E6E6;
            z-index: 999;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 2rem;
        }
        
        /* אזור תוכן ראשי */
        .main .block-container {
            padding-top: 90px; /* מרווח מפס העליון */
            padding-right: 1rem;
            padding-left: 18rem; /* מרווח לסייד-בר */
            padding-bottom: 1rem;
            margin: 0 auto;
        }
        
        /* עיצוב תיבת תוכן */
        .content-box {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
            padding: 20px;
            margin-bottom: 20px;
        }
        
        /* סייד-בר */
        [data-testid="stSidebar"] {
            background-color: #F8F9FB !important;
            padding-top: 90px !important; /* מרווח מפס העליון */
            width: 17rem !important;
        }
        
        /* לוגו */
        .logo-container {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            height: 100%;
        }
        
        .logo-container img {
            height: 40px;
            width: auto;
        }
        
        /* פרופיל משתמש */
        .user-profile {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: #F2F2F2;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
            font-weight: 600;
        }
        
        .user-info {
            text-align: left;
        }
        
        .welcome-text {
            font-size: 14px;
            color: #666;
            margin: 0;
        }
        
        .user-name {
            font-size: 16px;
            font-weight: 600;
            color: #333;
            margin: 0;
        }
        
        /* כפתורי תפריט */
        .menu-button {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: transparent;
            border: none;
            width: 100%;
            text-align: right;
            padding: 12px 15px;
            margin-bottom: 5px;
            border-radius: 5px;
            font-weight: 600;
            color: #333;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .menu-button:hover {
            background-color: #f0f0f0;
            color: #E03C31;
        }
        
        /* כפתורי תפריט סטרימליט מקוריים */
        .stButton > button {
            border-radius: 5px;
            font-weight: 600;
            font-family: 'Open Sans', sans-serif !important;
            border: none !important;
            background: none !important;
            color: #333 !important;
            text-align: right;
            padding: 0.75rem 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
        }
        
        .stButton > button:hover {
            background-color: #f5f5f5 !important;
            color: #E03C31 !important;
        }
        
        .stButton > button::after {
            content: "❯";
            margin-left: 10px;
            font-size: 0.8rem;
        }
        
        /* תיבות טקסט וכפתורים */
        .stTextInput > div > div > input {
            direction: rtl;
        }
        
        button[kind="secondary"] {
            direction: rtl;
        }
        
        /* טאבים */
        .stTabs [data-baseweb="tab-list"] {
            direction: rtl;
        }
        
        .stTabs [data-baseweb="tab"] {
            direction: rtl;
            margin-right: 0px;
            margin-left: 10px;
        }
        
        /* פונטים */
        input, textarea, div[data-baseweb="input"], div[data-baseweb="select"] {
            font-family: 'Open Sans', sans-serif !important;
        }
        
        table, th, td, div[data-testid="stTable"], div[data-testid="stDataFrame"] {
            font-family: 'Open Sans', sans-serif !important;
        }
        
        div[data-testid="stMetricLabel"] {
            direction: rtl;
            text-align: right;
        }
        
        h1, h2, h3, h4, h5, h6, .stTitle {
            font-family: 'Open Sans', sans-serif !important;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        
        /* ריווח */
        div[data-testid="stVerticalBlock"] > div {
            margin-bottom: 1rem;
        }
        
        /* התראות */
        div[data-baseweb="notification"] {
            border-radius: 5px;
            border-width: 1px;
        }
    </style>
    ''', unsafe_allow_html=True)
    
    # Initialize the session state for page navigation if not exists
    if 'current_page' not in st.session_state:
        st.session_state.current_page = 'מלאי' if st.session_state.get('user') and st.session_state.user.role == 'warehouse' else 'התחברות'
    
    # Create top header with logo for ALL pages
    st.markdown(f'''
    <div class="top-header">
        <div class="logo-container">
            <img src="./assets/logo.png" alt="Logo">
        </div>
    </div>
    ''', unsafe_allow_html=True)
    
    if st.session_state.user:
        # Add user profile to header area (logo is already there)
        st.markdown(f'''
        <div class="user-profile" style="position: fixed; top: 0; left: 20px; height: 70px; z-index: 1000; display: flex; align-items: center;">
            <div class="user-avatar">{''.join([name[0] for name in st.session_state.user.full_name.split()])}</div>
            <div class="user-info">
                <p class="welcome-text">Welcome back</p>
                <p class="user-name">{st.session_state.user.full_name} ▼</p>
            </div>
        </div>
        ''', unsafe_allow_html=True)
        
        # Sidebar with logo and navigation
        with st.sidebar:
            # No user info or logo in sidebar - it's in the header now
            
            # Role-based navigation
            
            if st.session_state.user.role == 'warehouse':
                pages = {
                    "מלאי": "",
                    "השאלות": "",
                    "התראות": "",
                    "מעקב ציוד": "",
                    "היסטוריה": "",
                    "סטטיסטיקות": "",
                    "ייבוא/ייצוא": "",
                    "ניהול הזמנות": ""
                }
            else:  # student role
                pages = {
                    "הציוד שלי": "",
                    "פריטים זמינים": "",
                    "הזמנת ציוד": ""
                }
            
            # Navigation buttons
            for page, icon in pages.items():
                if st.button(f"{icon} {page}", key=f"nav_{page}", use_container_width=True):
                    st.session_state.current_page = page
                    st.rerun()
            
            # Logout button at the bottom
            st.divider()
            if st.button("התנתק", use_container_width=True):
                logout()
                st.rerun()
            
            # Show overdue notifications badge for warehouse staff
            if st.session_state.user.role == 'warehouse':
                overdue_loans = get_overdue_loans()
                if not overdue_loans.empty:
                    st.warning(f"{len(overdue_loans)} השאלות באיחור")
        
        # Main content area based on selected page
        st.markdown('<div class="content-box">', unsafe_allow_html=True)
        st.title(st.session_state.current_page)
        
        # Display page content based on current_page
        if st.session_state.user.role == 'warehouse':
            if st.session_state.current_page == 'מלאי':
                show_inventory()
            elif st.session_state.current_page == 'השאלות':
                show_loans()
            elif st.session_state.current_page == 'התראות':
                show_overdue_alerts()
            elif st.session_state.current_page == 'מעקב ציוד':
                show_equipment_tracking()
            elif st.session_state.current_page == 'היסטוריה':
                show_history()
            elif st.session_state.current_page == 'סטטיסטיקות':
                show_statistics()
            elif st.session_state.current_page == 'ייבוא/ייצוא':
                # Import section
                st.subheader("ייבוא מאקסל")
                uploaded_file = st.file_uploader("בחר קובץ אקסל", type=['xlsx', 'xls'])
                if uploaded_file is not None:
                    success, message = import_excel(uploaded_file)
                    if success:
                        st.success(message)
                    else:
                        st.error(message)
                
                # Export section
                st.subheader("ייצוא לאקסל")
                if st.button("ייצא נתונים לאקסל"):
                    export_file = export_to_excel()
                    with open(export_file, 'rb') as f:
                        st.download_button(
                            label="הורד קובץ אקסל",
                            data=f,
                            file_name="warehouse_export.xlsx",
                            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        )
                    # Clean up the temporary file
                    os.remove(export_file)
            elif st.session_state.current_page == 'ניהול הזמנות':
                show_reservation_management()
        else:  # student role
            if st.session_state.current_page == 'הציוד שלי':
                show_loans(user_id=st.session_state.user.id)
            elif st.session_state.current_page == 'פריטים זמינים':
                show_inventory(readonly=True)
            elif st.session_state.current_page == 'הזמנת ציוד':
                show_reservations_page()
    else:
        # Login/Register view with sidebar
        with st.sidebar:
            # No logo in sidebar for login page - moved to header
            
            # Switch between login and registration
            if st.button("התחברות", key="nav_login", use_container_width=True):
                st.session_state.current_page = 'התחברות'
                st.rerun()
            if st.button("הרשמה", key="nav_register", use_container_width=True):
                st.session_state.current_page = 'הרשמה'
                st.rerun()
        
        # Show login or registration based on current page
        st.markdown('<div class="content-box">', unsafe_allow_html=True)
        if st.session_state.current_page == 'התחברות':
            st.title("התחברות")
            show_login_page()
        else:
            st.title("הרשמה")
            show_registration_page()
        st.markdown('</div>', unsafe_allow_html=True)

if __name__ == "__main__":
    main()
