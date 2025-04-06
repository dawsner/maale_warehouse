import streamlit as st
import pandas as pd
from utils import get_overdue_loans
from datetime import datetime
from auth import require_role
from database import return_loan, get_db_connection

def show_overdue_alerts():
    st.markdown('<h1 class="title">השאלות באיחור</h1>', unsafe_allow_html=True)
    
    # Add filters in a nice card
    st.markdown("""
    <div style="display: flex; gap: 15px; margin-bottom: 20px;">
        <div style="background-color: white; padding: 10px 15px; border-radius: 6px; 
                   display: flex; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <span style="margin-left: 10px; font-weight: 500;">חומרה</span>
            <span style="color: #2196F3;">▼</span>
        </div>
        <div style="background-color: white; padding: 10px 15px; border-radius: 6px; 
                   display: flex; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <span style="margin-left: 10px; font-weight: 500;">שבוע 1</span>
            <span style="color: #2196F3;">▼</span>
        </div>
        <div style="background-color: white; padding: 10px 15px; border-radius: 6px; 
                   display: flex; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <span style="margin-left: 10px; font-weight: 500;">שבועיים</span>
            <span style="color: #2196F3;">▼</span>
        </div>
        <div style="background-color: white; padding: 10px 15px; border-radius: 6px; 
                   display: flex; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <span style="margin-left: 10px; font-weight: 500;">+3 שבועות</span>
            <span style="color: #2196F3;">▼</span>
        </div>
        <div style="background-color: white; padding: 10px 15px; border-radius: 6px; 
                   display: flex; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <span style="margin-left: 10px; font-weight: 500;">הכל</span>
            <span style="color: #2196F3;">▼</span>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Hidden filters but still functional
    with st.container():
        st.markdown('<div style="display: none">', unsafe_allow_html=True)
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
        st.markdown('</div>', unsafe_allow_html=True)
    
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
    
    # Prepare the table data
    table_data = []
    for _, loan in overdue_df.iterrows():
        days_overdue = int(loan['days_overdue'])
        due_date_str = loan['due_date'].strftime('%d %b, %Y')
        return_date_str = (loan['due_date'] + pd.Timedelta(days=days_overdue)).strftime('%d %b, %Y')
        
        status_weeks = "3 שבועות"
        if days_overdue <= 7:
            status_weeks = "שבוע 1"
        elif days_overdue <= 14:
            status_weeks = "שבועיים"
        
        table_data.append({
            "borrower": loan['student_name'],
            "item": loan['item_name'],
            "due": due_date_str,
            "return": return_date_str,
            "status": status_weeks,
            "id": loan['id'],
            "student_id": loan['student_id'],
            "quantity": loan['quantity'],
            "loan_date": loan['loan_date'].strftime('%Y-%m-%d %H:%M'),
            "due_date": loan['due_date'].strftime('%Y-%m-%d %H:%M'),
            "loan_notes": loan.get('loan_notes', '')
        })
    
    # Create a custom HTML table
    st.markdown("""
    <div style="background-color: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background-color: #f8f9fa; text-align: right;">
                    <th style="padding: 12px 16px; border-bottom: 1px solid #eee; font-weight: 600; color: #555;">שואל</th>
                    <th style="padding: 12px 16px; border-bottom: 1px solid #eee; font-weight: 600; color: #555;">פריט</th>
                    <th style="padding: 12px 16px; border-bottom: 1px solid #eee; font-weight: 600; color: #555;">יוחזר</th>
                    <th style="padding: 12px 16px; border-bottom: 1px solid #eee; font-weight: 600; color: #555;">הוחזר</th>
                    <th style="padding: 12px 16px; border-bottom: 1px solid #eee; font-weight: 600; color: #555;">סטטוס</th>
                    <th style="padding: 12px 16px; border-bottom: 1px solid #eee; font-weight: 600; color: #555;">פעולה</th>
                </tr>
            </thead>
            <tbody>
    """, unsafe_allow_html=True)
    
    for idx, loan in enumerate(table_data):
        # Status background color
        bg_color = "#e3f2fd"  # Default light blue
        if loan["status"] == "שבוע 1":
            bg_color = "#fff8e1"  # Light yellow
        elif loan["status"] == "שבועיים":
            bg_color = "#ffebee"  # Light red
        elif loan["status"] == "3 שבועות":
            bg_color = "#ffcdd2"  # Darker red
        
        st.markdown(f"""
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px 16px;">{loan['borrower']}</td>
            <td style="padding: 12px 16px;">{loan['item']}</td>
            <td style="padding: 12px 16px;">{loan['due']}</td>
            <td style="padding: 12px 16px;">{loan['return']}</td>
            <td style="padding: 12px 16px;">
                <span style="background-color: {bg_color}; padding: 5px 10px; border-radius: 4px; font-size: 0.9em;">
                    {loan['status']}
                </span>
            </td>
            <td style="padding: 12px 16px;">
                <div id="loan_action_{idx}" style="display: inline-block;">
                    סמן כהוחזר
                </div>
            </td>
        </tr>
        """, unsafe_allow_html=True)
    
    st.markdown("</tbody></table></div>", unsafe_allow_html=True)
    
    # Hidden buttons for actions
    for idx, loan in enumerate(table_data):
        if st.button("סמן כהוחזר", key=f"return_alert_{loan['id']}_{idx}", type="primary"):
            if return_loan(loan['id']):
                st.success("הציוד הוחזר בהצלחה")
                st.rerun()
            else:
                st.error("שגיאה בביצוע ההחזרה")
    
    # Use JavaScript to move the buttons into the table
    st.markdown("""
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Wait for Streamlit to finish rendering
            setTimeout(function() {
                const buttons = document.querySelectorAll('[data-testid="baseButton-primary"]');
                buttons.forEach((button, idx) => {
                    const target = document.getElementById(`loan_action_${idx}`);
                    if (target) {
                        target.innerHTML = '';
                        target.appendChild(button);
                    }
                });
            }, 1000);
        });
    </script>
    """, unsafe_allow_html=True)
