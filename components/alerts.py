import streamlit as st
import pandas as pd
from utils import get_overdue_loans
from datetime import datetime
from auth import require_role
from database import return_loan, get_db_connection

def show_overdue_alerts():
    st.header("התראות על איחורים")
    
    # Add filters
    col1, col2 = st.columns(2)
    with col1:
        days_filter = st.slider(
            "הצג איחורים מעל X ימים",
            min_value=1,
            max_value=30,
            value=1
        )
    
    with col2:
        sort_order = st.selectbox(
            "מיון לפי",
            ["ימי איחור", "תאריך השאלה", "שם סטודנט"],
            format_func=lambda x: {
                "ימי איחור": "ימי איחור (יורד)",
                "תאריך השאלה": "תאריך השאלה (עולה)",
                "שם סטודנט": "שם סטודנט (א-ב)"
            }[x]
        )
    
    # Get overdue loans
    overdue_df = get_overdue_loans()
    
    if overdue_df.empty:
        st.success("אין השאלות באיחור")
        return
    
    # Apply days filter
    overdue_df = overdue_df[overdue_df['days_overdue'] >= days_filter]
    
    if overdue_df.empty:
        st.info(f"אין השאלות באיחור של {days_filter} ימים או יותר")
        return
    
    # Sort based on user selection
    if sort_order == "ימי איחור":
        overdue_df = overdue_df.sort_values('days_overdue', ascending=False)
    elif sort_order == "תאריך השאלה":
        overdue_df = overdue_df.sort_values('loan_date')
    else:  # שם סטודנט
        overdue_df = overdue_df.sort_values('student_name')
    
    # Display summary statistics
    st.subheader("סיכום איחורים")
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("סה\"כ השאלות באיחור", len(overdue_df))
    with col2:
        avg_days = round(overdue_df['days_overdue'].mean(), 1)
        st.metric("ממוצע ימי איחור", avg_days)
    with col3:
        max_days = int(overdue_df['days_overdue'].max())
        st.metric("איחור מקסימלי", f"{max_days} ימים")
    
    # Display alerts with severity levels
    for _, loan in overdue_df.iterrows():
        days_overdue = int(loan['days_overdue'])
        
        # Set severity level and icon
        if days_overdue > 14:
            severity = "🔴"
            severity_class = "danger"
        elif days_overdue > 7:
            severity = "🟡"
            severity_class = "warning"
        else:
            severity = "🟠"
            severity_class = "info"
        
        with st.expander(f"{severity} איחור: {loan['item_name']} - {loan['student_name']}"):
            col1, col2 = st.columns(2)
            
            with col1:
                st.write(f"ת.ז. סטודנט: {loan['student_id']}")
                st.write(f"כמות: {loan['quantity']}")
                st.write(f"ימי איחור: {days_overdue}")
            
            with col2:
                st.write(f"תאריך השאלה: {loan['loan_date'].strftime('%Y-%m-%d %H:%M')}")
                st.write(f"תאריך החזרה נדרש: {loan['due_date'].strftime('%Y-%m-%d %H:%M')}")
                
                if hasattr(loan, 'loan_notes') and loan['loan_notes']:
                    st.write(f"הערות השאלה: {loan['loan_notes']}")
            
            # Add action buttons
            col1, col2 = st.columns(2)
            with col1:
                if st.button("סמן כהוחזר", key=f"return_alert_{loan['id']}_{idx}", type="primary"):
                    if return_loan(loan['id']):
                        st.success("הציוד הוחזר בהצלחה")
                        st.rerun()
                    else:
                        st.error("שגיאה בביצוע ההחזרה")
            
            with col2:
                if st.button("שלח תזכורת", key=f"remind_alert_{loan['id']}_{idx}", type="secondary"):
                    st.info("פונקציונליות שליחת תזכורות תתווסף בקרוב")
