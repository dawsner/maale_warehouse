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
    
    # Load custom CSS file
    with open('.streamlit/style.css') as f:
        st.markdown(f'<style>{f.read()}</style>', unsafe_allow_html=True)
    
    # Add base RTL CSS and custom navigation that looks like the reference image
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
        
        /* Modern sidebar like in reference image */
        .sidebar {
            background-color: #F5F7FA;
            border-radius: 0;
            padding: 20px;
            width: 220px;
            position: fixed;
            left: 0;
            top: 0;
            height: 100vh;
            box-shadow: 1px 0 5px rgba(0,0,0,0.05);
            z-index: 1000;
            display: flex;
            flex-direction: column;
        }
        
        .sidebar-logo {
            margin-bottom: 40px;
            font-size: 20px;
            font-weight: bold;
            color: #333;
            display: flex;
            align-items: center;
        }
        
        .sidebar-nav {
            display: flex;
            flex-direction: column;
            flex-grow: 1;
        }
        
        .nav-item {
            display: flex;
            align-items: center;
            padding: 12px 15px;
            text-decoration: none;
            color: #333;
            border-radius: 4px;
            margin-bottom: 5px;
            transition: background-color 0.2s;
        }
        
        .nav-item:hover {
            background-color: rgba(0,0,0,0.03);
        }
        
        .nav-item.active {
            background-color: #E6F4FF;
            color: #0095FF;
            font-weight: 500;
        }
        
        .nav-item-icon {
            margin-left: 12px;
            width: 20px;
            text-align: center;
        }
        
        .content-wrapper {
            margin-left: 220px;
            padding: 30px;
            flex-grow: 1;
        }
        
        /* Title and headers */
        h1, h2, h3, h4, h5, h6 {
            color: #222;
            margin-bottom: 1.5rem;
            font-weight: 600;
        }

        h1.title {
            font-size: 1.8rem;
            font-weight: 600;
            color: #222;
            margin-bottom: 2rem;
        }
        
        /* Filters and action row */
        .filters-row {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .filter-dropdown {
            min-width: 150px;
        }
        
        /* Modern buttons like reference */
        .action-button {
            display: inline-flex;
            align-items: center;
            background-color: #0095FF;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 10px 20px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .action-button:hover {
            background-color: #0077cc;
        }
        
        .secondary-button {
            background-color: white;
            color: #333;
            border: 1px solid #e0e0e0;
        }
        
        .secondary-button:hover {
            background-color: #f5f5f5;
        }
        
        /* Hide streamlit branding */
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        
        /* Status pill like in reference */
        .status-pill {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 50px;
            font-size: 13px;
            font-weight: 500;
            background-color: #E6F4FF;
            color: #0095FF;
        }
        
        /* Hide the default tab UI but keep it functional */
        [data-testid="stHorizontalBlock"] {
            visibility: hidden;
            height: 0;
            position: absolute;
        }
        
        /* Make the layout more like the reference */
        .main > .block-container {
            padding-left: 260px;
            max-width: 1200px;
            margin: 0 auto;
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
            
            # Create a sidebar navigation like in the reference image
            st.markdown("""
            <div class="sidebar">
                <div class="sidebar-logo">
                    <span style="margin-left: 10px;">🎬</span> מערכת השאלות
                </div>
                <div class="sidebar-nav">
                    <div class="nav-item active" id="inventory-tab">
                        <span class="nav-item-icon">🏠</span> דשבורד
                    </div>
                    <div class="nav-item" id="loans-tab">
                        <span class="nav-item-icon">📦</span> ציוד
                    </div>
                    <div class="nav-item" id="alerts-tab">
                        <span class="nav-item-icon">🔄</span> השאלות
                    </div>
                    <div class="nav-item" id="history-tab">
                        <span class="nav-item-icon">👥</span> חברי צוות
                    </div>
                    <div class="nav-item" id="stats-tab">
                        <span class="nav-item-icon">👨‍💼</span> צוות
                    </div>
                    <div class="nav-item" id="import-export-tab">
                        <span class="nav-item-icon">📊</span> דוחות
                    </div>
                    <div class="nav-item" id="reservations-tab">
                        <span class="nav-item-icon">⚙️</span> הגדרות
                    </div>
                </div>
                <div style="margin-top: auto;">
                    <div class="nav-item" id="help-tab">
                        <span class="nav-item-icon">❓</span> עזרה
                    </div>
                    <div class="nav-item" id="logout-tab">
                        <span class="nav-item-icon">↩️</span> התנתק
                    </div>
                </div>
            </div>
            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    // Add click handler to all navigation items
                    const tabMap = {
                        'inventory-tab': 0,
                        'loans-tab': 1,
                        'alerts-tab': 2,
                        'history-tab': 3,
                        'stats-tab': 4,
                        'import-export-tab': 5,
                        'reservations-tab': 6
                    };
                    
                    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
                        item.addEventListener('click', function() {
                            // Remove active class from all items
                            document.querySelectorAll('.sidebar-nav .nav-item').forEach(i => {
                                i.classList.remove('active');
                            });
                            
                            // Add active class to clicked item
                            this.classList.add('active');
                            
                            // Get the tab index and simulate click
                            const tabId = this.id;
                            const tabIndex = tabMap[tabId];
                            const tabElements = document.querySelectorAll('[data-baseweb="tab-list"] [role="tab"]');
                            if (tabElements && tabElements[tabIndex]) {
                                tabElements[tabIndex].click();
                            }
                        });
                    });
                    
                    // Handle logout
                    document.getElementById('logout-tab').addEventListener('click', function() {
                        // Find and click the logout button
                        const logoutBtn = document.querySelector('[data-testid="baseButton-secondary"]:contains("התנתק")');
                        if (logoutBtn) {
                            logoutBtn.click();
                        }
                    });
                });
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
            # Create a sidebar navigation like in the reference image for students
            st.markdown("""
            <div class="sidebar">
                <div class="sidebar-logo">
                    <span style="margin-left: 10px;">🎬</span> מערכת השאלות
                </div>
                <div class="sidebar-nav">
                    <div class="nav-item active" id="my-equipment-tab">
                        <span class="nav-item-icon">🎥</span> הציוד שלי
                    </div>
                    <div class="nav-item" id="available-items-tab">
                        <span class="nav-item-icon">📋</span> פריטים זמינים
                    </div>
                    <div class="nav-item" id="reserve-equipment-tab">
                        <span class="nav-item-icon">➕</span> הזמנת ציוד
                    </div>
                </div>
                <div style="margin-top: auto;">
                    <div class="nav-item" id="help-tab-student">
                        <span class="nav-item-icon">❓</span> עזרה
                    </div>
                    <div class="nav-item" id="logout-tab-student">
                        <span class="nav-item-icon">↩️</span> התנתק
                    </div>
                </div>
            </div>
            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    // Add click handler to all navigation items
                    const tabMap = {
                        'my-equipment-tab': 0,
                        'available-items-tab': 1,
                        'reserve-equipment-tab': 2
                    };
                    
                    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
                        item.addEventListener('click', function() {
                            // Remove active class from all items
                            document.querySelectorAll('.sidebar-nav .nav-item').forEach(i => {
                                i.classList.remove('active');
                            });
                            
                            // Add active class to clicked item
                            this.classList.add('active');
                            
                            // Get the tab index and simulate click
                            const tabId = this.id;
                            const tabIndex = tabMap[tabId];
                            const tabElements = document.querySelectorAll('[data-baseweb="tab-list"] [role="tab"]');
                            if (tabElements && tabElements[tabIndex]) {
                                tabElements[tabIndex].click();
                            }
                        });
                    });
                    
                    // Handle logout
                    document.getElementById('logout-tab-student').addEventListener('click', function() {
                        // Find and click the logout button
                        const logoutBtn = document.querySelector('[data-testid="baseButton-secondary"]:contains("התנתק")');
                        if (logoutBtn) {
                            logoutBtn.click();
                        }
                    });
                });
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
