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
    # Set page config with new layout - הידוס הסיידבר
    st.set_page_config(
        page_title="מערכת ניהול מחסן השאלות",
        page_icon="📦",
        layout="wide",
        initial_sidebar_state="collapsed"
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
        }
        
        /* ביטול התפריט הצדדי והפיכתו לתפריט עליון */
        [data-testid="stSidebar"] {
            display: none !important;
        }
        
        /* יצירת תפריט עליון קבוע */
        .top-menu {
            position: fixed;
            top: 0;
            right: 0;
            left: 0;
            height: 80px;
            background-color: #E7E7E7;
            z-index: 999;
            display: flex;
            align-items: center;
            padding: 0 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            direction: rtl;
        }
        
        /* מרווח בראש הדף כדי לתת מקום לתפריט העליון */
        .main .block-container {
            margin-top: 100px;
            padding: 1rem;
        }
        
        /* עיצוב הכפתורים בתפריט העליון */
        .top-menu-button {
            display: inline-block;
            margin: 0 10px;
            padding: 5px 15px;
            border: none;
            background-color: transparent;
            color: #333;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
            border-radius: 4px;
        }
        
        .top-menu-button:hover {
            background-color: rgba(0,0,0,0.05);
        }
        
        .top-menu-button.active {
            background-color: #0078FF;
            color: white;
        }
        
        /* לוגו בתפריט העליון */
        .top-menu-logo {
            height: 50px;
            margin-left: 20px;
        }
        
        /* אזור הודעות משתמש בתפריט העליון */
        .user-info {
            margin-right: auto;  /* דוחף לצד שמאל */
            display: flex;
            align-items: center;
        }
        
        /* התאמות נוספות לממשק */
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
        
        /* עיצוב התפריט העליון כאשר חלון הדפדפן קטן */
        @media (max-width: 992px) {
            .top-menu {
                overflow-x: auto;
                white-space: nowrap;
                padding: 0 10px;
            }
            
            .top-menu-button {
                margin: 0 5px;
                padding: 5px 10px;
                font-size: 14px;
            }
            
            .top-menu-logo {
                height: 40px;
                margin-left: 10px;
            }
        }
    </style>
    ''', unsafe_allow_html=True)
    
    # Initialize the session state for page navigation if not exists
    if 'current_page' not in st.session_state:
        st.session_state.current_page = 'מלאי' if st.session_state.get('user') and st.session_state.user.role == 'warehouse' else 'התחברות'
    
    # יצירת התפריט העליון
    if st.session_state.get('user'):
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
        
        # בניית התפריט העליון כ-HTML
        menu_html = '<div class="top-menu">'
        # הוספת הלוגו
        menu_html += f'<img src="data:image/png;base64,{get_image_as_base64("assets/logo.png")}" class="top-menu-logo" alt="Logo">'
        
        # הוספת הכפתורים
        for page, icon in pages.items():
            active_class = "active" if st.session_state.current_page == page else ""
            page_id = page.replace(" ", "_")
            menu_html += f'<button id="nav_{page_id}" class="top-menu-button {active_class}">{icon} {page}</button>'
        
        # הוספת פרטי המשתמש ולחצן ההתנתקות
        menu_html += f'<div class="user-info">'
        menu_html += f'<span>👤 שלום, {st.session_state.user.full_name}</span>'
        menu_html += f'<button id="nav_logout" class="top-menu-button">התנתק</button>'
        menu_html += '</div>'
        
        menu_html += '</div>'
        
        # הצגת התפריט העליון
        st.markdown(menu_html, unsafe_allow_html=True)
        
        # JavaScript לטיפול בלחיצות על כפתורי התפריט
        js = """
        <script>
            // כפתורי ניווט
            document.querySelectorAll('.top-menu-button').forEach(button => {
                button.addEventListener('click', function() {
                    const id = this.id;
                    
                    if (id === 'nav_logout') {
                        window.parent.postMessage({"type": "streamlit:setComponentValue", "value": {"action": "logout"}}, "*");
                    } else {
                        const page = id.replace('nav_', '').replace('_', ' ');
                        window.parent.postMessage({"type": "streamlit:setComponentValue", "value": {"action": "navigate", "page": page}}, "*");
                    }
                });
            });
        </script>
        """
        st.markdown(js, unsafe_allow_html=True)
        
        # בדיקת ניווט מהתפריט
        nav_callback = st.empty()
        
        if 'nav_action' in st.session_state:
            action = st.session_state.nav_action
            if action.get('action') == 'navigate':
                st.session_state.current_page = action.get('page')
                del st.session_state.nav_action
                st.rerun()
            elif action.get('action') == 'logout':
                logout()
                del st.session_state.nav_action
                st.rerun()
        
        # הצגת מידע על השאלות באיחור לצוות המחסן
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
        # תפריט עליון למסך ההתחברות/הרשמה
        login_menu_html = '<div class="top-menu">'
        # הוספת הלוגו
        login_menu_html += f'<img src="data:image/png;base64,{get_image_as_base64("assets/logo.png")}" class="top-menu-logo" alt="Logo">'
        
        # כפתורי התחברות/הרשמה
        login_active = "active" if st.session_state.current_page == 'התחברות' else ""
        register_active = "active" if st.session_state.current_page == 'הרשמה' else ""
        
        login_menu_html += f'<button id="nav_login" class="top-menu-button {login_active}">התחברות</button>'
        login_menu_html += f'<button id="nav_register" class="top-menu-button {register_active}">הרשמה</button>'
        login_menu_html += '</div>'
        
        # הצגת התפריט העליון
        st.markdown(login_menu_html, unsafe_allow_html=True)
        
        # JavaScript לטיפול בלחיצות על כפתורים
        js = """
        <script>
            // כפתורי ניווט
            document.getElementById('nav_login').addEventListener('click', function() {
                window.parent.postMessage({"type": "streamlit:setComponentValue", "value": {"action": "navigate", "page": "התחברות"}}, "*");
            });
            
            document.getElementById('nav_register').addEventListener('click', function() {
                window.parent.postMessage({"type": "streamlit:setComponentValue", "value": {"action": "navigate", "page": "הרשמה"}}, "*");
            });
        </script>
        """
        st.markdown(js, unsafe_allow_html=True)
        
        # בדיקת ניווט מהתפריט
        nav_callback = st.empty()
        
        if 'nav_action' in st.session_state:
            action = st.session_state.nav_action
            if action.get('action') == 'navigate':
                st.session_state.current_page = action.get('page')
                del st.session_state.nav_action
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
