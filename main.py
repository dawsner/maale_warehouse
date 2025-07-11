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
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Hebrew:wght@300;400;500;600;700&display=swap');
        
        * {
            font-family: 'IBM Plex Sans Hebrew', sans-serif !important;
        }
        
        .stApp > header {
            background-color: transparent !important;
        }
        
        .main .block-container {
            padding: 0 !important;
            max-width: 1440px !important;
            background: #FAFBFF;
            min-height: 100vh;
        }
        
        [data-testid="stHeader"] {
            display: none;
        }
        
        .stApp {
            direction: rtl;
            font-family: 'Open Sans', sans-serif !important;
        }
        
        /* ביטול התפריט הצדדי והפיכתו לתפריט עליון */
        [data-testid="stSidebar"] {
            display: none !important;
        }
        
        /* יצירת תפריט עליון קבוע מתחת לתפריט של streamlit - בסגנון מודרני יותר */
        .top-menu {
            position: sticky;
            top: 0;
            right: 0;
            left: 0;
            height: 70px;
            background-color: white;
            box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.05);
            z-index: 999;
            display: flex;
            align-items: center;
            padding: 0 20px;
            border-bottom: 1px #CECECE solid;
            direction: rtl;
        }
        
        .main-content {
            background: #FAFBFF;
            min-height: calc(100vh - 100px);
            padding: 0.5rem;
        }
        
        .content-card {
            background: white;
            border-radius: 12px;
            border: 1px solid #E8EFF7;
            box-shadow: 0px 4px 8px rgba(30, 40, 117, 0.08);
            padding: 2rem;
            margin-bottom: 2rem;
        }
        
        .user-info {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.7rem;
            background: rgba(255, 255, 255, 0.50);
            border-radius: 8px;
            border: 1px solid #E8EFF7;
        }
        
        .user-avatar {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            background: #FFA78D;
            overflow: hidden;
        }
        
        /* הסתרת האלמנטים המקוריים של סטרימליט */
[data-testid="stHeader"], 
header[data-testid="stHeader"],
.stDeployButton {
    display: none !important;
    height: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: hidden !important;
    position: absolute !important;
    visibility: hidden !important;
    top: 0;
}
        
        /* צמצום המרווח בין התפריט לתוכן העמוד */
        .main .block-container {
            padding-top: 0 !important;
            padding-left: 1rem;
            padding-right: 1rem;
            margin-top: 0 !important;
            max-width: 100% !important;
        }
        
        /* הסרת רווחים נוספים מהכותרת ותוכן העמוד */
        .main h1, .main h2, .main h3 {
            margin-top: 0 !important;
            padding-top: 0 !important;
        }
        
        /* הסתרת התפריט העליון של streamlit */
        header[data-testid="stHeader"] {
            display: none !important;
        }
        
        /* עיצוב הכפתורים בתפריט העליון בסגנון מודרני */
        .top-menu-button {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.6rem 0.8rem;
            border: none;
            background-color: transparent;
            color: #9197B3;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s;
            border-radius: 8px;
            font-size: 14px;
            font-family: 'Outfit', sans-serif !important;
        }
        
        .top-menu-button.active {
            background-color: #1E2875;
            color: white;
        }
        
        .top-menu-button:hover:not(.active) {
            background-color: rgba(30, 40, 117, 0.05);
        }
        
        .top-menu-button:hover {
            background-color: rgba(0,0,0,0.03);
        }
        
        .top-menu-button.active {
            background-color: #1E2875;
            color: white;
        }
        
        /* לוגו בתפריט העליון */
        .top-menu-logo {
            height: 40px;
            margin-left: 15px;
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
        
        /* הקטנת הרווח בין כותרת עמוד לתוכן */
        .main .element-container:first-child h1 {
            margin-top: 0 !important;
            padding-top: 0.5rem !important;
            margin-bottom: 0.5rem !important;
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
        
        # הוספת הכפתורים עם אייקונים חדשים
        icons = {
            "מלאי": '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>',
            "השאלות": '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
            "התראות": '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
            "מעקב ציוד": '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
            "היסטוריה": '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
            "סטטיסטיקות": '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
            "ייבוא/ייצוא": '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
            "ניהול הזמנות": '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
            "הציוד שלי": '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
            "פריטים זמינים": '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>',
            "הזמנת ציוד": '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>'
        }
        
        for page, _ in pages.items():
            active_class = "active" if st.session_state.current_page == page else ""
            page_id = page.replace(" ", "_")
            icon = icons.get(page, "")
            menu_html += f'<button id="nav_{page_id}" class="top-menu-button {active_class}">{icon} {page}</button>'
        
        # הוספת פרטי המשתמש ולחצן ההתנתקות - עיצוב מודרני יותר
        menu_html += f'<div class="user-info">'
        menu_html += f'''
          <div style="background-color: #F5F6FA; padding: 6px 12px; border-radius: 8px; display: flex; align-items: center; margin-right: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #1E2875; color: white; display: flex; align-items: center; justify-content: center; margin-left: 8px; font-weight: bold;">
              {st.session_state.user.full_name[0]}
            </div>
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 12px; color: #9197B3;">שלום,</span>
              <span style="font-size: 14px; color: #373B5C; font-weight: 500;">{st.session_state.user.full_name}</span>
            </div>
          </div>
        '''
        menu_html += f'<button id="nav_logout" class="top-menu-button"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> התנתק</button>'
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
                    const nav_btn = window.parent.document.querySelector('button[key="nav_btn_action"]');
                    
                    if (id === 'nav_logout') {
                        window.parent.Streamlit.setComponentValue({do_logout: true});
                        if (nav_btn) nav_btn.click();
                    } else {
                        const page = id.replace('nav_', '').replace(/_/g, ' ');
                        window.parent.Streamlit.setComponentValue({nav_page: page});
                        if (nav_btn) nav_btn.click();
                    }
                });
            });
        </script>
        """
        st.markdown(js, unsafe_allow_html=True)
        
        # מאזין ישירות ללחיצות - מסתיר את הכפתור
        st.markdown('<style>[data-testid="baseButton-secondary"] {visibility: hidden; height: 1px !important;}</style>', unsafe_allow_html=True)
        btn_action = st.button(".", key="nav_btn_action")
        if btn_action:
            # בדיקת התפריט החדש שלנו
            # הקוד פה יופעל רק כאשר יתקבל אירוע מהתפריט (באמצעות Streamlit.setComponentValue מה-JavaScript)
            if "nav_page" in st.session_state:
                st.session_state.current_page = st.session_state.nav_page
                del st.session_state.nav_page
                st.rerun()
            
            if "do_logout" in st.session_state and st.session_state.do_logout:
                logout()
                del st.session_state.do_logout
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
                const nav_btn = window.parent.document.querySelector('button[key="nav_btn_action"]');
                window.parent.Streamlit.setComponentValue({nav_page: "התחברות"});
                if (nav_btn) nav_btn.click();
            });
            
            document.getElementById('nav_register').addEventListener('click', function() {
                const nav_btn = window.parent.document.querySelector('button[key="nav_btn_action"]');
                window.parent.Streamlit.setComponentValue({nav_page: "הרשמה"});
                if (nav_btn) nav_btn.click();
            });
        </script>
        """
        st.markdown(js, unsafe_allow_html=True)
        
        # מאזין ישירות ללחיצות - מסתיר את הכפתור
        st.markdown('<style>[data-testid="baseButton-secondary"] {visibility: hidden; height: 1px !important;}</style>', unsafe_allow_html=True)
        btn_action = st.button(".", key="nav_btn_action")
        if btn_action:
            # בדיקת התפריט החדש שלנו
            if "nav_page" in st.session_state:
                st.session_state.current_page = st.session_state.nav_page
                del st.session_state.nav_page
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
