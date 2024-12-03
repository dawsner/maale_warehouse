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
