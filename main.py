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
    
    # Add RTL CSS and Open Sans Hebrew font
    st.markdown('''
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap');
        
        * {
            font-family: 'Open Sans', sans-serif !important;
        }
        
        .stApp {
            direction: rtl;
            font-family: 'Open Sans', sans-serif !important;
            background-color: #E7E7E7 !important;
        }
        
        .main .block-container {
            padding-top: 1rem;
            padding-right: 15rem; /* שומר מקום לסייד-בר */
            padding-left: 1rem;
            padding-bottom: 1rem;
            background-color: #E7E7E7 !important;
        }
        .sidebar .sidebar-content {
            direction: rtl;
            text-align: right;
            padding: 1rem;
            background-color: #FFFFFF !important;
        }
        
        [data-testid="stSidebar"] {
            background-color: #FFFFFF !important;
        }
        
        [data-testid="stSidebarNav"] {
            background-color: #FFFFFF !important;
        }
        .stTabs [data-baseweb="tab-list"] {
            direction: rtl;
        }
        .stTabs [data-baseweb="tab"] {
            direction: rtl;
            margin-right: 0px;
            margin-left: 10px;
        }
        button[kind="secondary"] {
            direction: rtl;
        }
        .stTextInput > div > div > input {
            direction: rtl;
        }
        .stButton > button {
            border-radius: 5px;
            font-weight: 600;
            font-family: 'Open Sans', sans-serif !important;
        }
        
        /* Apply Open Sans font to inputs */
        input, textarea, div[data-baseweb="input"], div[data-baseweb="select"] {
            font-family: 'Open Sans', sans-serif !important;
        }
        
        /* Apply Open Sans font to table elements */
        table, th, td, div[data-testid="stTable"], div[data-testid="stDataFrame"] {
            font-family: 'Open Sans', sans-serif !important;
        }
        div[data-testid="stMetricLabel"] {
            direction: rtl;
            text-align: right;
        }
        .logo-container {
            margin-bottom: 2rem;
            text-align: center;
        }
        
        /* Custom styles for Hebrew headers */
        h1, h2, h3, h4, h5, h6, .stTitle {
            font-family: 'Open Sans', sans-serif !important;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        
        /* Add some space to widgets for better readability */
        div[data-testid="stVerticalBlock"] > div {
            margin-bottom: 1rem;
        }
    </style>
    ''', unsafe_allow_html=True)
    
    # Initialize the session state for page navigation if not exists
    if 'current_page' not in st.session_state:
        st.session_state.current_page = 'מלאי' if st.session_state.get('user') and st.session_state.user.role == 'warehouse' else 'התחברות'
    
    if st.session_state.user:
        # Sidebar with logo and navigation
        with st.sidebar:
            # Logo container
            st.markdown('<div class="logo-container">', unsafe_allow_html=True)
            st.image('assets/logo.png', width=200)
            st.markdown('</div>', unsafe_allow_html=True)
            
            # User info
            st.write(f"👤 שלום, {st.session_state.user.full_name}")
            
            # Role-based navigation
            st.divider()
            
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
            st.markdown('<div class="logo-container">', unsafe_allow_html=True)
            st.image('assets/logo.png', width=200)
            st.markdown('</div>', unsafe_allow_html=True)
            st.divider()
            
            # Switch between login and registration
            if st.button("התחברות", key="nav_login", use_container_width=True):
                st.session_state.current_page = 'התחברות'
                st.rerun()
            if st.button("הרשמה", key="nav_register", use_container_width=True):
                st.session_state.current_page = 'הרשמה'
                st.rerun()
        
        # Show login or registration based on current page
        if st.session_state.current_page == 'התחברות':
            st.title("התחברות")
            show_login_page()
        else:
            st.title("הרשמה")
            show_registration_page()

if __name__ == "__main__":
    main()
