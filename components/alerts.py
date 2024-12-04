import streamlit as st
import pandas as pd
from utils import get_overdue_loans
from datetime import datetime
from auth import require_role

def show_overdue_alerts():
    st.header("התראות על איחורים")
    
    # Get overdue loans
    overdue_df = get_overdue_loans()
    
    if overdue_df.empty:
        st.success("אין השאלות באיחור")
        return
    
    # Sort by days overdue
    overdue_df = overdue_df.sort_values('days_overdue', ascending=False)
    
    # Display alerts
    st.warning(f"יש {len(overdue_df)} השאלות באיחור")
    
    for _, loan in overdue_df.iterrows():
        with st.expander(f"איחור: {loan['item_name']} - {loan['student_name']}"):
            st.write(f"ת.ז. סטודנט: {loan['student_id']}")
            st.write(f"כמות: {loan['quantity']}")
            st.write(f"תאריך השאלה: {loan['loan_date'].strftime('%Y-%m-%d %H:%M')}")
            st.write(f"תאריך החזרה נדרש: {loan['due_date'].strftime('%Y-%m-%d %H:%M')}")
            st.write(f"ימי איחור: {int(loan['days_overdue'])}")
            
            # Add action buttons here if needed
            if st.button("סמן כהוחזר", key=f"return_{loan['id']}"):
                from database import return_loan
                if return_loan(loan['id']):
                    st.success("הציוד הוחזר בהצלחה")
                    st.rerun()
                else:
                    st.error("שגיאה בביצוע ההחזרה")
