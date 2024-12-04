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
    st.set_page_config(layout="wide", initial_sidebar_state="collapsed")
    init_db()
    init_auth()
    
    # Add RTL CSS
    st.markdown('''
    <style>
        .stApp {
            direction: rtl;
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
    </style>
    ''', unsafe_allow_html=True)
    
    st.title("מערכת ניהול מחסן השאלות")
    
    if st.session_state.user:
        # User info and logout in header
        col1, col2 = st.columns([3, 1])
        with col1:
            st.write(f"שלום, {st.session_state.user.full_name}")
        with col2:
            if st.button("התנתק"):
                logout()
                st.rerun()
        
        # Role-based navigation with tabs
        if st.session_state.user.role == 'warehouse':
            # Show overdue notifications
            overdue_loans = get_overdue_loans()
            if not overdue_loans.empty:
                st.warning(f"⚠️ {len(overdue_loans)} השאלות באיחור")
            
            # Warehouse staff pages
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
            # Student pages
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
