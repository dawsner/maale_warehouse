import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from database import get_db_connection
from datetime import datetime, timedelta
import calendar

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
    
    # Add date range filter in a nicer container
    with st.container():
        st.markdown("""
        <style>
        .date-filter {
            background-color: white;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        </style>
        <div class="date-filter">
            <h3 style="margin-top: 0; margin-bottom: 1rem; font-size: 1.2rem;">סינון לפי תאריכים</h3>
        </div>
        """, unsafe_allow_html=True)
        
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

    # Summary cards at the top
    equipment_df = calculate_equipment_usage()
    student_df = calculate_student_statistics()
    category_df = calculate_category_analysis()
    
    # Create four summary cards
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        total_loans = sum(equipment_df['total_loans']) if not equipment_df.empty else 0
        st.markdown("""
        <div class="stats-card">
            <h4 style="margin-top: 0;">סה"כ השאלות</h4>
            <h2 style="margin: 0.5rem 0; color: #0095FF;">{}</h2>
            <p style="color: #666; margin: 0;">כולל כל הציוד</p>
        </div>
        """.format(total_loans), unsafe_allow_html=True)
    
    with col2:
        avg_duration = equipment_df['avg_loan_duration'].mean() if not equipment_df.empty else 0
        st.markdown("""
        <div class="stats-card">
            <h4 style="margin-top: 0;">ממוצע ימי השאלה</h4>
            <h2 style="margin: 0.5rem 0; color: #27AE60;">{:.1f}</h2>
            <p style="color: #666; margin: 0;">ימים</p>
        </div>
        """.format(avg_duration), unsafe_allow_html=True)
    
    with col3:
        unique_students = student_df['student_name'].nunique() if not student_df.empty else 0
        st.markdown("""
        <div class="stats-card">
            <h4 style="margin-top: 0;">סטודנטים פעילים</h4>
            <h2 style="margin: 0.5rem 0; color: #F2994A;">{}</h2>
            <p style="color: #666; margin: 0;">בתקופה הנבחרת</p>
        </div>
        """.format(unique_students), unsafe_allow_html=True)
    
    with col4:
        overdue_count = student_df['overdue_count'].sum() if not student_df.empty else 0
        st.markdown("""
        <div class="stats-card">
            <h4 style="margin-top: 0;">השאלות באיחור</h4>
            <h2 style="margin: 0.5rem 0; color: #EB5757;">{}</h2>
            <p style="color: #666; margin: 0;">דורשות טיפול</p>
        </div>
        """.format(overdue_count), unsafe_allow_html=True)
    
    # Add spacing
    st.markdown("<br>", unsafe_allow_html=True)

    # Equipment Usage Statistics
    with st.container():
        st.markdown("""
        <div style="background-color: white; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="margin-top: 0;">סטטיסטיקת שימוש בציוד</h3>
        </div>
        """, unsafe_allow_html=True)
        
        if not equipment_df.empty:
            # Create a bar chart for equipment usage with better styling
            fig = px.bar(
                equipment_df.head(10),
                x='item_name',
                y='total_loans',
                title='הציוד המושאל ביותר',
                labels={'item_name': 'שם הפריט', 'total_loans': 'מספר השאלות'},
                color='total_loans',
                color_continuous_scale=px.colors.sequential.Blues
            )
            fig.update_layout(
                xaxis_tickangle=-45,
                paper_bgcolor='white',
                plot_bgcolor='white',
                margin=dict(l=20, r=20, t=50, b=50),
                font=dict(family="Arial, sans-serif")
            )
            st.plotly_chart(fig, use_container_width=True)

    # Student Statistics in a nice container
    with st.container():
        st.markdown("""
        <div style="background-color: white; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="margin-top: 0;">סטטיסטיקת סטודנטים</h3>
        </div>
        """, unsafe_allow_html=True)
        
        if not student_df.empty:
            # Create a table for top borrowers with better styling
            fig = go.Figure(data=[go.Table(
                header=dict(
                    values=['שם סטודנט', 'סה"כ השאלות', 'פריטים ייחודיים', 'השאלות באיחור'],
                    fill_color='#F5F7FA',
                    align='right',
                    font=dict(color='#333', size=14)
                ),
                cells=dict(
                    values=[
                        student_df['student_name'],
                        student_df['total_loans'],
                        student_df['unique_items'],
                        student_df['overdue_count']
                    ],
                    align='right',
                    fill_color=[['white', '#F9FAFB'] * len(student_df)],
                    font=dict(color='#333', size=13),
                    height=30
                )
            )])
            fig.update_layout(
                margin=dict(l=0, r=0, t=5, b=5),
                paper_bgcolor='white',
                height=400
            )
            st.plotly_chart(fig, use_container_width=True)

    # Monthly Trends in a nice container
    with st.container():
        st.markdown("""
        <div style="background-color: white; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="margin-top: 0;">מגמות חודשיות</h3>
        </div>
        """, unsafe_allow_html=True)
        
        monthly_df = calculate_monthly_trends()
        
        if not monthly_df.empty:
            # Create a line chart for monthly trends with better styling
            monthly_df['month'] = pd.to_datetime(monthly_df['month'])
            
            # Rename columns for Hebrew display
            monthly_df = monthly_df.rename(columns={
                'total_loans': 'סה"כ השאלות',
                'unique_students': 'סטודנטים ייחודיים',
                'unique_items': 'פריטים ייחודיים'
            })
            
            fig = px.line(
                monthly_df,
                x='month',
                y=['סה"כ השאלות', 'סטודנטים ייחודיים', 'פריטים ייחודיים'],
                labels={
                    'month': 'חודש',
                    'value': 'כמות',
                    'variable': 'מדד'
                },
                line_shape='spline',
                markers=True
            )
            
            fig.update_layout(
                paper_bgcolor='white',
                plot_bgcolor='white',
                margin=dict(l=20, r=20, t=30, b=50),
                legend=dict(
                    orientation="h",
                    yanchor="bottom",
                    y=-0.2,
                    xanchor="center",
                    x=0.5
                ),
                font=dict(family="Arial, sans-serif")
            )
            
            fig.update_xaxes(
                gridcolor='#EEEEEE',
                title_font=dict(size=14)
            )
            
            fig.update_yaxes(
                gridcolor='#EEEEEE',
                title_font=dict(size=14)
            )
            
            st.plotly_chart(fig, use_container_width=True)

    # Category Analysis in a nice container
    with st.container():
        st.markdown("""
        <div style="background-color: white; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="margin-top: 0;">ניתוח לפי קטגוריות</h3>
        </div>
        """, unsafe_allow_html=True)
        
        if not category_df.empty:
            col1, col2 = st.columns([1, 1])
            
            with col1:
                # Create a pie chart for category distribution with better styling
                fig = px.pie(
                    category_df,
                    values='total_loans',
                    names='category',
                    hole=0.4,
                    color_discrete_sequence=px.colors.qualitative.Pastel
                )
                
                fig.update_layout(
                    paper_bgcolor='white',
                    margin=dict(l=20, r=20, t=30, b=30),
                    legend=dict(
                        orientation="h",
                        yanchor="bottom",
                        y=-0.3,
                        xanchor="center",
                        x=0.5
                    ),
                    font=dict(family="Arial, sans-serif")
                )
                
                fig.update_traces(textposition='inside', textinfo='percent+label')
                
                st.plotly_chart(fig, use_container_width=True)
            
            with col2:
                # Display category metrics in a more visual way
                for _, row in category_df.iterrows():
                    active_percent = 0 if row['total_loans'] == 0 else (row['active_loans'] / row['total_loans']) * 100
                    
                    st.markdown(f"""
                    <div style="background-color: #F5F7FA; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                        <h4 style="margin-top: 0; margin-bottom: 0.5rem;">{row['category']}</h4>
                        <p style="margin: 0; font-size: 0.85rem; color: #666;">סה"כ השאלות: <strong>{row['total_loans']}</strong></p>
                        <div style="display: flex; align-items: center; margin-top: 0.5rem;">
                            <div style="background-color: #DDDDDD; height: 8px; width: 100%; border-radius: 4px; overflow: hidden;">
                                <div style="background-color: #0095FF; height: 100%; width: {active_percent}%;"></div>
                            </div>
                            <span style="margin-right: 0.5rem; font-size: 0.85rem; min-width: 90px;">{row['active_loans']} פעילות</span>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
