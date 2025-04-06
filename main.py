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
    
    # Add custom CSS based on provided design
    st.markdown('''
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Outfit:wght@400;500;600&display=swap');
        
        /* בסיס */
        * {
            font-family: 'Poppins', 'Open Sans', sans-serif !important;
        }
        
        .stApp {
            direction: rtl;
            background-color: #FAFBFF !important;
        }
        
        /* פס ניווט עליון חדש */
        .top-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 100px;
            background-color: white;
            border-bottom: 1px #CECECE solid;
            z-index: 999;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        /* אזור תוכן ראשי חדש */
        .main .block-container {
            padding-top: 120px;
            padding-right: 1rem;
            padding-left: 350px;
            padding-bottom: 1rem;
            margin: 0 auto;
        }
        
        /* עיצוב תיבת תוכן חדש */
        .content-box {
            width: 100%;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.15);
            padding: 20px;
            margin-bottom: 20px;
            border: 2px #EBEBEE solid;
        }
        
        /* סייד-בר חדש */
        [data-testid="stSidebar"] {
            background-color: white !important;
            padding-top: 100px !important;
            width: 306px !important;
            border-left: none !important;
            box-shadow: 0px 10px 60px rgba(225, 236, 248, 0.50) !important;
            position: fixed;
            right: 0 !important;
            left: auto !important;
        }
        
        /* לוגו */
        .logo-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            padding-top: 16px;
        }
        
        .logo-container img {
            height: 54px;
            width: auto;
        }
        
        /* פרופיל משתמש */
        .user-profile {
            display: flex;
            align-items: center;
            gap: 18px;
            margin-left: 28px;
        }
        
        .user-avatar {
            width: 36.85px;
            height: 36.85px;
            border-radius: 7.68px;
            background-color: #FFA78D;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 500;
            overflow: hidden;
        }
        
        .user-info {
            text-align: left;
            display: flex;
            flex-direction: column;
        }
        
        .welcome-text {
            font-size: 11.52px;
            color: #373B5C;
            margin: 0;
            font-family: Poppins !important;
            font-weight: 500;
        }
        
        .user-name {
            font-size: 19.58px;
            color: #373B5C;
            margin: 0;
            font-family: Poppins !important;
            font-weight: 500;
        }
        
        /* כפתורי תפריט */
        .stButton > button {
            font-family: 'Outfit', sans-serif !important;
            font-weight: 500 !important;
            font-size: 16px !important;
            color: #9197B3 !important;
            border: none !important;
            background: none !important;
            text-align: right;
            padding: 0.75rem 1rem;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            width: 100%;
        }
        
        .stButton > button:hover {
            background-color: rgba(0, 0, 0, 0.05) !important;
        }
        
        .stButton > button::after {
            content: "❯";
            margin-left: auto;
            margin-right: 0;
            font-size: 0.8rem;
            transform: rotate(180deg);
            color: #9197B3;
        }
        
        /* מעטפת לפרופיל משתמש עם עיצוב */
        .profile-wrapper {
            flex: 1;
            height: 61.03px;
            padding: 11.52px;
            background: rgba(255, 255, 255, 0.50);
            border-radius: 9.21px;
            outline: 1.15px #E8EFF7 solid;
            outline-offset: -1.15px;
            display: flex;
            align-items: center;
            gap: 11.52px;
        }
        
        /* עיצוב תוויות מדדים */
        div[data-testid="stMetricLabel"] {
            direction: rtl;
            text-align: right;
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
        
        /* תיבות טקסט */
        .stTextInput > div > div > input {
            direction: rtl;
        }
        
        button[kind="secondary"] {
            direction: rtl;
        }
        
        /* התראות */
        div[data-baseweb="notification"] {
            border-radius: 5px;
            border-width: 1px;
        }
        
        /* כפתור דשבורד מיוחד */
        .dashboard-button {
            color: white !important;
            font-size: 14px !important;
            font-family: Poppins !important;
            font-weight: 500 !important;
            background-color: none !important;
            padding: 0 !important;
            margin-bottom: 1rem !important;
        }
    </style>
    ''', unsafe_allow_html=True)
    
    # Initialize the session state for page navigation if not exists
    if 'current_page' not in st.session_state:
        st.session_state.current_page = 'מלאי' if st.session_state.get('user') and st.session_state.user.role == 'warehouse' else 'התחברות'
    
    # Create header area with user profile and logo
    st.markdown(f'''
    <div class="top-header">
        <div class="user-profile">
            <div class="user-avatar">{''.join([name[0] for name in st.session_state.user.full_name.split()]) if st.session_state.get('user') else 'G'}</div>
            <div class="user-info">
                <p class="welcome-text">{'Welcome back,' if st.session_state.get('user') else 'Guest'}</p>
                <p class="user-name">{st.session_state.user.full_name if st.session_state.get('user') else 'אורח'}</p>
            </div>
        </div>
        <div class="logo-container">
            <img src="./assets/logo.png" alt="Logo">
        </div>
    </div>
    ''', unsafe_allow_html=True)
    
    if st.session_state.user:
        # No need for additional profile markup as it's already in the main layout
        
        # Sidebar with logo and navigation
        with st.sidebar:
            # Add dashboard button and navigation icons
            st.markdown('''
            <div style="width: 24px; height: 20.51px; position: relative; margin-bottom: 20px; overflow: hidden">
              <div style="width: 20px; height: 17.10px; position: absolute; left: 2px; top: 1.71px; outline: 1.50px #1E2875 solid; outline-offset: -0.75px"></div>
              <div style="width: 10.99px; height: 9.39px; position: absolute; left: 6.50px; top: 5.57px; outline: 1.50px #1E2875 solid; outline-offset: -0.75px"></div>
            </div>
            <div style="color: #1E2875; font-size: 14px; font-family: Poppins; font-weight: 500; margin-bottom: 20px; word-wrap: break-word">Dashboard</div>
            ''', unsafe_allow_html=True)
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
