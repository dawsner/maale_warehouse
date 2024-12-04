import streamlit as st
from datetime import datetime
import pytz

def get_israel_time():
    israel_tz = pytz.timezone('Asia/Jerusalem')
    return datetime.now(israel_tz)

def format_hebrew_date(date):
    if not date:
        return ""
    return date.strftime('%d/%m/%Y %H:%M')

def set_page_config():
    st.set_page_config(
        page_title="מערכת ניהול מחסן השאלות",
        page_icon="📦",
        layout="wide",
        initial_sidebar_state="expanded"
    )
    
    # Add custom CSS for RTL support
    st.markdown(
        """
        <style>
        .stApp {
            direction: rtl;
            text-align: right;
        }
        .stButton>button {
            float: right;
        }
        .streamlit-expanderHeader {
            direction: rtl;
            text-align: right;
        }
        div[data-testid="stMetricLabel"] {
            direction: rtl;
            text-align: right;
        }
        </style>
        """,
        unsafe_allow_html=True
    )


def get_overdue_loans():
    from database import get_db_connection
    import pandas as pd
    
    with get_db_connection() as conn:
        overdue_loans = pd.read_sql_query(
            """SELECT l.id, i.name as item_name, l.student_name, 
               l.student_id, l.quantity, l.loan_date, l.due_date,
               EXTRACT(DAY FROM (CURRENT_TIMESTAMP - l.due_date)) as days_overdue
               FROM loans l
               JOIN items i ON l.item_id = i.id
               WHERE l.status = 'active' 
               AND l.due_date < CURRENT_TIMESTAMP
               ORDER BY l.due_date ASC""",
            conn
        )
    return overdue_loans