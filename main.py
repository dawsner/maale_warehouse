import streamlit as st
from database import init_db
from components.inventory import show_inventory
from components.loans import show_loans
from components.history import show_history
from excel_handler import import_excel, export_to_excel
from utils import set_page_config
import os

def main():
    set_page_config()
    
    # Initialize database
    init_db()
    
    st.title("מערכת ניהול מחסן השאלות")
    
    # Sidebar navigation
    st.sidebar.title("תפריט ראשי")
    page = st.sidebar.radio(
        "בחר עמוד",
        ["מלאי", "השאלות", "היסטוריה", "ייבוא/ייצוא"]
    )
    
    if page == "מלאי":
        show_inventory()
    
    elif page == "השאלות":
        show_loans()
    
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

if __name__ == "__main__":
    main()
