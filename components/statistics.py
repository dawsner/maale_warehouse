import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from database import get_db_connection
from datetime import datetime, timedelta
import calendar

# Custom Plotly theme configuration for Hebrew font
def apply_hebrew_plotly_theme(fig):
    """Apply a consistent Hebrew-friendly theme to Plotly charts"""
    fig.update_layout(
        font_family="Heebo",
        title_font_family="Heebo",
        title_font_size=20,
        title_font_color="#262730",
        legend_title_font_family="Heebo",
        legend_title_font_color="#262730",
        legend_font_family="Heebo",
        legend_font_color="#262730",
        xaxis_title_font_family="Heebo",
        xaxis_title_font_color="#262730",
        yaxis_title_font_family="Heebo",
        yaxis_title_font_color="#262730",
        xaxis_tickfont_family="Heebo",
        yaxis_tickfont_family="Heebo",
        autosize=True,
        margin=dict(l=50, r=50, t=80, b=50),
        paper_bgcolor="white",
        plot_bgcolor="#F8F9FA",
        title_x=0.5,  # Centered title
        title_xanchor="center",
        hoverlabel=dict(
            font_family="Heebo",
            font_size=14
        )
    )
    return fig

def calculate_equipment_usage():
    with get_db_connection() as conn:
        # Get equipment usage statistics
        df = pd.read_sql_query(
            """
            SELECT 
                i.name as item_name,
                i.category,
                COUNT(l.id) as total_loans,
                SUM(l.quantity) as total_quantity_loaned,
                AVG(EXTRACT(DAY FROM (COALESCE(l.return_date, CURRENT_TIMESTAMP) - l.loan_date))) as avg_loan_duration
            FROM items i
            LEFT JOIN loans l ON i.id = l.item_id
            GROUP BY i.id, i.name, i.category
            ORDER BY total_loans DESC
            """,
            conn
        )
        return df

def calculate_student_statistics():
    with get_db_connection() as conn:
        # Get student borrowing patterns
        df = pd.read_sql_query(
            """
            SELECT 
                student_name,
                COUNT(id) as total_loans,
                COUNT(DISTINCT item_id) as unique_items,
                AVG(CASE 
                    WHEN return_date IS NOT NULL THEN 
                        EXTRACT(DAY FROM (return_date - loan_date))
                    ELSE
                        EXTRACT(DAY FROM (CURRENT_TIMESTAMP - loan_date))
                END) as avg_loan_duration,
                COUNT(CASE WHEN due_date < CURRENT_TIMESTAMP AND status = 'active' THEN 1 END) as overdue_count
            FROM loans
            GROUP BY student_name
            ORDER BY total_loans DESC
            LIMIT 10
            """,
            conn
        )
        return df

def calculate_monthly_trends():
    with get_db_connection() as conn:
        # Get monthly loan trends
        df = pd.read_sql_query(
            """
            SELECT 
                DATE_TRUNC('month', loan_date) as month,
                COUNT(*) as total_loans,
                COUNT(DISTINCT student_name) as unique_students,
                COUNT(DISTINCT item_id) as unique_items
            FROM loans
            WHERE loan_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY month
            ORDER BY month
            """,
            conn
        )
        return df

def calculate_category_analysis():
    with get_db_connection() as conn:
        # Get category-based statistics
        df = pd.read_sql_query(
            """
            SELECT 
                i.category,
                COUNT(l.id) as total_loans,
                COUNT(DISTINCT l.student_name) as unique_students,
                ROUND(AVG(l.quantity)) as avg_quantity_per_loan,
                COUNT(CASE WHEN l.status = 'active' THEN 1 END) as active_loans
            FROM items i
            LEFT JOIN loans l ON i.id = l.item_id
            GROUP BY i.category
            ORDER BY total_loans DESC
            """,
            conn
        )
        return df

def show_statistics():
    st.header("דוחות סטטיסטיים")
    
    # Add date range filter
    col1, col2 = st.columns(2)
    with col1:
        start_date = st.date_input(
            "מתאריך",
            value=datetime.now() - timedelta(days=30),
            max_value=datetime.now()
        )
    with col2:
        end_date = st.date_input(
            "עד תאריך",
            value=datetime.now(),
            max_value=datetime.now(),
            min_value=start_date
        )

    # Equipment Usage Statistics
    st.subheader("סטטיסטיקת שימוש בציוד")
    equipment_df = calculate_equipment_usage()
    
    if not equipment_df.empty:
        # Create a bar chart for equipment usage
        fig = px.bar(
            equipment_df.head(10),
            x='item_name',
            y='total_loans',
            title='הציוד המושאל ביותר',
            labels={'item_name': 'שם הפריט', 'total_loans': 'מספר השאלות'}
        )
        fig.update_layout(xaxis_tickangle=-45)
        apply_hebrew_plotly_theme(fig)
        st.plotly_chart(fig)

        # Display average loan duration
        st.metric(
            "ממוצע ימי השאלה לפריט",
            f"{equipment_df['avg_loan_duration'].mean():.1f} ימים"
        )

    # Student Statistics
    st.subheader("סטטיסטיקת סטודנטים")
    student_df = calculate_student_statistics()
    
    if not student_df.empty:
        # Create a table for top borrowers
        fig = go.Figure(data=[go.Table(
            header=dict(values=['שם סטודנט', 'סה"כ השאלות', 'פריטים ייחודיים', 'השאלות באיחור'],
                       fill_color='lightgrey',
                       align='right'),
            cells=dict(values=[student_df['student_name'],
                             student_df['total_loans'],
                             student_df['unique_items'],
                             student_df['overdue_count']],
                      align='right')
        )])
        fig.update_layout(title='סטודנטים מובילים בהשאלות')
        apply_hebrew_plotly_theme(fig)
        st.plotly_chart(fig)

    # Monthly Trends
    st.subheader("מגמות חודשיות")
    monthly_df = calculate_monthly_trends()
    
    if not monthly_df.empty:
        # Create a line chart for monthly trends
        monthly_df['month'] = pd.to_datetime(monthly_df['month'])
        fig = px.line(
            monthly_df,
            x='month',
            y=['total_loans', 'unique_students', 'unique_items'],
            title='מגמות השאלה חודשיות',
            labels={
                'month': 'חודש',
                'value': 'כמות',
                'variable': 'מדד'
            }
        )
        apply_hebrew_plotly_theme(fig)
        st.plotly_chart(fig)

    # Category Analysis
    st.subheader("ניתוח לפי קטגוריות")
    category_df = calculate_category_analysis()
    
    if not category_df.empty:
        # Create a pie chart for category distribution
        fig = px.pie(
            category_df,
            values='total_loans',
            names='category',
            title='התפלגות השאלות לפי קטגוריה'
        )
        apply_hebrew_plotly_theme(fig)
        st.plotly_chart(fig)

        # Display category metrics
        cols = st.columns(len(category_df))
        for idx, (_, row) in enumerate(category_df.iterrows()):
            with cols[idx]:
                st.metric(
                    row['category'],
                    f"{row['total_loans']} השאלות",
                    f"{row['active_loans']} פעילות"
                )
