import streamlit as st
from database import get_all_items, create_loan, return_loan
import pandas as pd
from datetime import datetime, timedelta
from utils import get_overdue_loans

def show_loans(user_id=None):
    st.header("ניהול השאלות")
    
    if user_id:  # Student view
        handle_student_loans(user_id)
    else:  # Warehouse staff view
        tab1, tab2 = st.tabs(["השאלת ציוד", "החזרת ציוד"])
        
        with tab1:
            create_new_loan()
        
        with tab2:
            handle_returns()

def create_new_loan():
    # Show overdue warnings
    overdue_loans = get_overdue_loans()
    if not overdue_loans.empty:
        with st.expander("⚠️ השאלות באיחור", expanded=True):
            st.error(f"יש {len(overdue_loans)} השאלות באיחור:")
            for _, loan in overdue_loans.iterrows():
                st.warning(
                    f"פריט: {loan['item_name']}\n"
                    f"סטודנט: {loan['student_name']}\n"
                    f"ימים באיחור: {int(loan['days_overdue'])}"
                )

    items = get_all_items()
    if not items:
        st.warning("אין פריטים זמינים להשאלה")
        return
    
    with st.form("loan_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            student_name = st.text_input("שם הסטודנט")
            student_id = st.text_input("תעודת זהות")
        
        with col2:
            available_items = {f"{item[1]} ({item[4]} זמינים)": item
                            for item in items if item[4] > 0}
            
            selected_item_name = st.selectbox(
                "בחר פריט",
                options=list(available_items.keys())
            )
            
            if selected_item_name:
                item = available_items[selected_item_name]
                quantity = st.number_input(
                    "כמות",
                    min_value=1,
                    max_value=item[4]  # available quantity
                )
                
                # Add due date selection
                default_due_date = datetime.now() + timedelta(days=14)
                due_date = st.date_input(
                    "תאריך החזרה נדרש",
                    min_value=datetime.now().date(),
                    value=default_due_date.date()
                )
        
        submitted = st.form_submit_button("השאל")
        if submitted:
            if student_name and student_id and selected_item_name:
                item = available_items[selected_item_name]
                if create_loan(item[0], student_name, student_id, quantity, due_date):  # item[0] is id
                    st.success("הציוד הושאל בהצלחה")
                    st.rerun()
                else:
                    st.error("שגיאה בביצוע ההשאלה")
            else:
                st.error("יש למלא את כל השדות")

def handle_returns():
    from database import get_db_connection
    
    with get_db_connection() as conn:
        active_loans = pd.read_sql_query(
            """SELECT l.id, i.name as item_name, l.student_name, 
               l.student_id, l.quantity, l.loan_date
               FROM loans l
               JOIN items i ON l.item_id = i.id
               WHERE l.status = 'active'
               ORDER BY l.loan_date DESC""",
            conn
        )
        
        if active_loans.empty:
            st.info("אין השאלות פעילות")
            return
        
        st.subheader("השאלות פעילות")
        
        # Format the DataFrame for display
        display_df = active_loans.copy()
        display_df['loan_date'] = pd.to_datetime(display_df['loan_date']).dt.strftime('%Y-%m-%d %H:%M')
        display_df.columns = ['מזהה', 'פריט', 'שם סטודנט', 'ת.ז.', 'כמות', 'תאריך השאלה']
        
        # Display loans and handle returns
        for _, row in display_df.iterrows():
            with st.expander(f"{row['פריט']} - {row['שם סטודנט']}"):
                st.write(f"תאריך השאלה: {row['תאריך השאלה']}")
                st.write(f"כמות: {row['כמות']}")
                
                if st.button(f"החזר", key=f"return_{row['מזהה']}"):
                    if return_loan(row['מזהה']):
                        st.success("הציוד הוחזר בהצלחה")
                        st.rerun()
                    else:
                        st.error("שגיאה בביצוע ההחזרה")

def handle_student_loans(user_id):
    from database import get_db_connection
    
    with get_db_connection() as conn:
        active_loans = pd.read_sql_query(
            """SELECT l.id, i.name as item_name, l.quantity, 
               l.loan_date, l.due_date
               FROM loans l
               JOIN items i ON l.item_id = i.id
               WHERE l.status = 'active' AND l.user_id = %s
               ORDER BY l.loan_date DESC""",
            conn,
            params=(user_id,)
        )
    
    if active_loans.empty:
        st.info("אין לך השאלות פעילות")
        return
    
    st.subheader("ההשאלות שלי")
    
    # Format the DataFrame for display
    display_df = active_loans.copy()
    display_df['loan_date'] = pd.to_datetime(display_df['loan_date']).dt.strftime('%Y-%m-%d %H:%M')
    display_df['due_date'] = pd.to_datetime(display_df['due_date']).dt.strftime('%Y-%m-%d %H:%M')
    display_df.columns = ['מזהה', 'פריט', 'כמות', 'תאריך השאלה', 'תאריך החזרה נדרש']
    
    st.dataframe(display_df.drop(columns=['מזהה']))
