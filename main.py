import streamlit as st
from database import init_db
from components.inventory import show_inventory
from components.loans import show_loans
from components.history import show_history
from components.alerts import show_overdue_alerts
from excel_handler import import_excel, export_to_excel
from utils import set_page_config
from auth import init_auth, show_login_page, show_registration_page, logout
import os

def main():
    set_page_config()
    init_db()
    init_auth()
    
    st.title("מערכת ניהול מחסן השאלות")
    
    # Authentication status in sidebar
    st.sidebar.title("תפריט ראשי")
    
    if st.session_state.user:
        st.sidebar.write(f"שלום, {st.session_state.user.full_name}")
        if st.sidebar.button("התנתק"):
            logout()
            st.rerun()
            
        # Role-based navigation
        # Show overdue notifications for warehouse staff
        if st.session_state.user.role == 'warehouse':
            overdue_loans = get_overdue_loans()
            if not overdue_loans.empty:
                st.sidebar.warning(f"⚠️ {len(overdue_loans)} השאלות באיחור")
        if st.session_state.user.role == 'warehouse':
            pages = ["מלאי", "השאלות", "התראות", "היסטוריה", "ייבוא/ייצוא"]
        else:  # student role
            pages = ["הציוד שלי", "פריטים זמינים"]
            
        page = st.sidebar.radio("בחר עמוד", pages)
        
        if st.session_state.user.role == 'warehouse':
            if page == "מלאי":
                show_inventory()
            elif page == "השאלות":
                show_loans()
            elif page == "התראות":
                show_overdue_alerts()
            elif page == "היסטוריה":
                show_history()
            elif page == "ייבוא/ייצוא":
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
        else:  # student role
            if page == "הציוד שלי":
                show_loans(user_id=st.session_state.user.id)
            elif page == "פריטים זמינים":
                show_inventory(readonly=True)
    else:
        tab1, tab2 = st.tabs(["התחברות", "הרשמה"])
        with tab1:
            show_login_page()
        with tab2:
            show_registration_page()

if __name__ == "__main__":
    main()
