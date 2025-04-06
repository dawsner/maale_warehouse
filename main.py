import streamlit as st
from database import init_db
from components.inventory import show_inventory
from components.loans import show_loans
from components.history import show_history
from components.alerts import show_overdue_alerts
from components.statistics import show_statistics
from components.reservations import show_reservations_page, show_reservation_management
from excel_handler import import_excel, export_to_excel
from utils import set_page_config, get_overdue_loans
from auth import init_auth, show_login_page, show_registration_page, logout
import os

def main():
    st.set_page_config(
        layout="wide", 
        initial_sidebar_state="collapsed",
        page_title="מערכת ניהול מחסן השאלות",
        page_icon="🎬"
    )
    init_db()
    init_auth()
    
    # Add base RTL CSS
    st.markdown('''
    <style>
        .stApp {
            direction: rtl;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
        
        /* Add additional styles from our custom CSS */
        /* Navigation menu */
        .nav-menu {
            display: flex;
            flex-direction: column;
            background-color: #1E3A8A;
            color: white;
            border-radius: 10px;
            margin-bottom: 2rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .nav-menu a {
            text-decoration: none;
            color: white;
            padding: 12px 20px;
            border-radius: 5px;
            margin: 3px;
            transition: background-color 0.3s;
        }

        .nav-menu a:hover {
            background-color: rgba(255,255,255,0.1);
        }

        .nav-menu a.active {
            background-color: #2196F3;
            font-weight: bold;
        }
        
        /* Title and headers */
        h1, h2, h3, h4, h5, h6 {
            color: #1E3A8A;
            margin-bottom: 1rem;
            font-weight: 600;
        }

        h1.title {
            font-size: 2.5rem;
            border-bottom: 2px solid #2196F3;
            padding-bottom: 0.5rem;
            margin-bottom: 2rem;
        }
    </style>
    ''', unsafe_allow_html=True)
    
    st.markdown('<h1 class="title">מערכת ניהול מחסן השאלות 🎬</h1>', unsafe_allow_html=True)
    
    if st.session_state.user:
        # Create a header with user info and navigation
        st.markdown("""
        <div style="display: flex; justify-content: space-between; align-items: center; 
                   background-color: white; padding: 10px 20px; border-radius: 10px; 
                   box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 20px;">
            <div style="display: flex; align-items: center;">
                <div style="background-color: #E3F2FD; border-radius: 50%; width: 40px; height: 40px; 
                           display: flex; align-items: center; justify-content: center; margin-left: 15px;">
                    <span style="font-size: 20px;">👤</span>
                </div>
                <span style="font-weight: 600; color: #1E3A8A;">שלום, {}</span>
            </div>
            <button onclick="logoutFunction()" 
                   style="background: transparent; border: 1px solid #E0E0E0; 
                          color: #666; border-radius: 5px; padding: 5px 15px; 
                          cursor: pointer; display: flex; align-items: center;">
                <span>התנתק</span>
                <span style="margin-right: 5px;">↩️</span>
            </button>
        </div>
        <script>
            function logoutFunction() {{
                window.parent.postMessage({{
                    type: "streamlit:buttonClicked",
                    label: "התנתק"
                }}, "*");
            }}
        </script>
        """.format(st.session_state.user.full_name), unsafe_allow_html=True)
        
        # Add a hidden button for the logout functionality
        if st.button("התנתק", key="logout_hidden_button", help="התנתקות מהמערכת"):
            logout()
            st.rerun()
        
        # Role-based navigation with tabs
        if st.session_state.user.role == 'warehouse':
            # Show overdue notifications
            overdue_loans = get_overdue_loans()
            if not overdue_loans.empty:
                st.warning(f"⚠️ {len(overdue_loans)} השאלות באיחור")
            
            # Create a sidebar-like navigation on the left with icons like in the image
            st.markdown("""
            <div class="nav-menu">
                <a href="#" class="active" onclick="tabFunction('מלאי')" id="inventory-tab">
                    <span style="margin-left: 10px;">📦</span> מלאי
                </a>
                <a href="#" onclick="tabFunction('השאלות')" id="loans-tab">
                    <span style="margin-left: 10px;">🔄</span> השאלות
                </a>
                <a href="#" onclick="tabFunction('התראות')" id="alerts-tab">
                    <span style="margin-left: 10px;">⚠️</span> התראות
                </a>
                <a href="#" onclick="tabFunction('היסטוריה')" id="history-tab">
                    <span style="margin-left: 10px;">📜</span> היסטוריה
                </a>
                <a href="#" onclick="tabFunction('סטטיסטיקות')" id="stats-tab">
                    <span style="margin-left: 10px;">📊</span> סטטיסטיקות
                </a>
                <a href="#" onclick="tabFunction('ייבוא_ייצוא')" id="import-export-tab">
                    <span style="margin-left: 10px;">📤</span> ייבוא/ייצוא
                </a>
                <a href="#" onclick="tabFunction('ניהול_הזמנות')" id="reservations-tab">
                    <span style="margin-left: 10px;">📋</span> ניהול הזמנות
                </a>
            </div>
            <script>
                function tabFunction(tabName) {{
                    // Map tab names to index
                    const tabMap = {{
                        'מלאי': 0,
                        'השאלות': 1,
                        'התראות': 2,
                        'היסטוריה': 3,
                        'סטטיסטיקות': 4,
                        'ייבוא_ייצוא': 5,
                        'ניהול_הזמנות': 6
                    }};
                    
                    // Get all nav items and remove active class
                    document.querySelectorAll('.nav-menu a').forEach(item => {{
                        item.classList.remove('active');
                    }});
                    
                    // Add active class to clicked item
                    document.getElementById(tabName.replace('/', '_') + '-tab').classList.add('active');
                    
                    // Simulate clicking the corresponding Streamlit tab
                    const tabIndex = tabMap[tabName.replace('/', '_')];
                    const tabElements = document.querySelectorAll('[data-baseweb="tab-list"] [role="tab"]');
                    if (tabElements && tabElements[tabIndex]) {{
                        tabElements[tabIndex].click();
                    }}
                }}
            </script>
            """, unsafe_allow_html=True)
            
            # Hide the tab UI with CSS but keep it functional
            st.markdown("""
            <style>
                [data-testid="stHorizontalBlock"] {
                    visibility: hidden;
                    height: 0;
                    position: absolute;
                }
            </style>
            """, unsafe_allow_html=True)
            
            # Warehouse staff pages - keep the original tabs for functionality
            tabs = st.tabs(["מלאי", "השאלות", "התראות", "היסטוריה", "סטטיסטיקות", "ייבוא/ייצוא", "ניהול הזמנות"])
            with tabs[0]: show_inventory()
            with tabs[1]: show_loans()
            with tabs[2]: show_overdue_alerts()
            with tabs[3]: show_history()
            with tabs[4]: show_statistics()
            with tabs[5]:
                st.header("ייבוא/ייצוא נתונים")
                
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
            with tabs[6]: show_reservation_management()
        else:  # student role
            # Create a sidebar-like navigation for students
            st.markdown("""
            <div class="nav-menu">
                <a href="#" class="active" onclick="studentTabFunction('הציוד_שלי')" id="my-equipment-tab">
                    <span style="margin-left: 10px;">🎥</span> הציוד שלי
                </a>
                <a href="#" onclick="studentTabFunction('פריטים_זמינים')" id="available-items-tab">
                    <span style="margin-left: 10px;">📋</span> פריטים זמינים
                </a>
                <a href="#" onclick="studentTabFunction('הזמנת_ציוד')" id="reserve-equipment-tab">
                    <span style="margin-left: 10px;">➕</span> הזמנת ציוד
                </a>
            </div>
            <script>
                function studentTabFunction(tabName) {{
                    // Map tab names to index
                    const tabMap = {{
                        'הציוד_שלי': 0,
                        'פריטים_זמינים': 1,
                        'הזמנת_ציוד': 2
                    }};
                    
                    // Get all nav items and remove active class
                    document.querySelectorAll('.nav-menu a').forEach(item => {{
                        item.classList.remove('active');
                    }});
                    
                    // Add active class to clicked item
                    document.getElementById(tabName.replace('_', '-') + '-tab').classList.add('active');
                    
                    // Simulate clicking the corresponding Streamlit tab
                    const tabIndex = tabMap[tabName];
                    const tabElements = document.querySelectorAll('[data-baseweb="tab-list"] [role="tab"]');
                    if (tabElements && tabElements[tabIndex]) {{
                        tabElements[tabIndex].click();
                    }}
                }}
            </script>
            """, unsafe_allow_html=True)
            
            # Student pages - keep the original tabs for functionality
            tabs = st.tabs(["הציוד שלי", "פריטים זמינים", "הזמנת ציוד"])
            with tabs[0]: show_loans(user_id=st.session_state.user.id)
            with tabs[1]: show_inventory(readonly=True)
            with tabs[2]: show_reservations_page()
        
        
    else:
        tab1, tab2 = st.tabs(["התחברות", "הרשמה"])
        with tab1:
            show_login_page()
        with tab2:
            show_registration_page()

if __name__ == "__main__":
    main()
