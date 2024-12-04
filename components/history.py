import streamlit as st
import pandas as pd
import plotly.express as px
from database import get_db_connection

def show_history():
    st.header("היסטוריית השאלות")
    
    # Get loan history
    with get_db_connection() as conn:
        df = pd.read_sql_query(
            """SELECT i.name as item_name, l.student_name, 
               l.quantity, 
               l.loan_date::timestamp as loan_date,
               l.return_date::timestamp as return_date,
               l.status
               FROM loans l
               JOIN items i ON l.item_id = i.id
               ORDER BY l.loan_date DESC""",
            conn
        )
    
    if df.empty:
        st.info("אין היסטוריית השאלות")
        return
    
    # Add filters
    col1, col2 = st.columns(2)
    with col1:
        status_filter = st.multiselect(
            "סטטוס",
            options=['active', 'returned'],
            default=['active', 'returned'],
            format_func=lambda x: 'פעיל' if x == 'active' else 'הוחזר'
        )
    
    with col2:
        date_range = st.date_input(
            "טווח תאריכים",
            value=(df['loan_date'].min().date(), df['loan_date'].max().date())
        )
    
    # Apply filters
    mask = (
        (df['status'].isin(status_filter)) &
        (df['loan_date'].dt.date >= date_range[0]) &
        (df['loan_date'].dt.date <= date_range[1])
    )
    filtered_df = df[mask]
    
    # Show statistics
    st.subheader("סטטיסטיקות")
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("סה״כ השאלות", len(filtered_df))
    with col2:
        active_loans = len(filtered_df[filtered_df['status'] == 'active'])
        st.metric("השאלות פעילות", active_loans)
    with col3:
        returned_loans = len(filtered_df[filtered_df['status'] == 'returned'])
        st.metric("פריטים שהוחזרו", returned_loans)
    
    # Show visualization
    st.subheader("תרשים השאלות לפי פריט")
    fig = px.bar(
        filtered_df['item_name'].value_counts(),
        title="כמות השאלות לפי פריט",
        labels={'value': 'מספר השאלות', 'index': 'שם הפריט'}
    )
    fig.update_layout(showlegend=False)
    st.plotly_chart(fig)
    
    # Show detailed table
    st.subheader("טבלת היסטוריה")
    display_df = filtered_df.copy()
    display_df['loan_date'] = pd.to_datetime(display_df['loan_date']).dt.strftime('%Y-%m-%d %H:%M')
    display_df['return_date'] = display_df['return_date'].apply(
        lambda x: pd.to_datetime(x).strftime('%Y-%m-%d %H:%M') if pd.notna(x) else ''
    )
    display_df['status'] = display_df['status'].map({'active': 'פעיל', 'returned': 'הוחזר'})
    
    display_df.columns = ['פריט', 'שם סטודנט', 'כמות', 'תאריך השאלה', 'תאריך החזרה', 'סטטוס']
    st.dataframe(display_df)
