import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from database import get_db_connection

def get_equipment_status():
    """Get real-time equipment status from database"""
    with get_db_connection() as conn:
        df = pd.read_sql_query("""
            SELECT 
                i.id,
                i.name,
                i.category,
                i.quantity as total_quantity,
                i.available as available_quantity,
                COALESCE(l.loaned_quantity, 0) as loaned_quantity,
                COALESCE(r.reserved_quantity, 0) as reserved_quantity
            FROM items i
            LEFT JOIN (
                SELECT item_id, SUM(quantity) as loaned_quantity
                FROM loans
                WHERE status = 'active'
                GROUP BY item_id
            ) l ON i.id = l.item_id
            LEFT JOIN (
                SELECT item_id, SUM(quantity) as reserved_quantity
                FROM reservations
                WHERE status = 'approved'
                GROUP BY item_id
            ) r ON i.id = r.item_id
            ORDER BY i.category, i.name
        """, conn)
    return df

def show_equipment_tracking():
    st.subheader("מעקב ציוד בזמן אמת")
    
    # Get current equipment status
    df = get_equipment_status()
    if df.empty:
        st.info("אין פריטים במערכת")
        return
    
    # Calculate metrics
    total_items = df['total_quantity'].sum()
    available_items = df['available_quantity'].sum()
    loaned_items = df['loaned_quantity'].sum()
    reserved_items = df['reserved_quantity'].sum()
    
    # Display summary metrics
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("סה\"כ פריטים", f"{total_items:,}")
    with col2:
        st.metric("פריטים זמינים", f"{available_items:,}", 
                 delta=f"{available_items/total_items:.1%}")
    with col3:
        st.metric("פריטים מושאלים", f"{loaned_items:,}",
                 delta=f"{loaned_items/total_items:.1%}")
    with col4:
        st.metric("פריטים מוזמנים", f"{reserved_items:,}",
                 delta=f"{reserved_items/total_items:.1%}")
    
    # Category breakdown
    st.subheader("פילוח לפי קטגוריות")
    category_df = df.groupby('category').agg({
        'total_quantity': 'sum',
        'available_quantity': 'sum',
        'loaned_quantity': 'sum',
        'reserved_quantity': 'sum'
    }).reset_index()
    
    fig = go.Figure()
    fig.add_trace(go.Bar(
        name='זמין',
        x=category_df['category'],
        y=category_df['available_quantity'],
        marker_color='#2E86C1'
    ))
    fig.add_trace(go.Bar(
        name='מושאל',
        x=category_df['category'],
        y=category_df['loaned_quantity'],
        marker_color='#E74C3C'
    ))
    fig.add_trace(go.Bar(
        name='מוזמן',
        x=category_df['category'],
        y=category_df['reserved_quantity'],
        marker_color='#F39C12'
    ))
    
    fig.update_layout(
        barmode='stack',
        title='פילוח מלאי לפי קטגוריה',
        xaxis_title='קטגוריה',
        yaxis_title='כמות',
        direction='rtl'
    )
    st.plotly_chart(fig, use_container_width=True)
    
    # Detailed equipment table
    st.subheader("פירוט ציוד")
    detailed_df = df.copy()
    detailed_df['ניצולת'] = (detailed_df['loaned_quantity'] / 
                           detailed_df['total_quantity']).fillna(0)
    
    # Format for display
    display_df = detailed_df[[
        'name', 'category', 'total_quantity', 
        'available_quantity', 'loaned_quantity', 'reserved_quantity'
    ]].copy()
    
    display_df.columns = [
        'שם פריט', 'קטגוריה', 'כמות כוללת',
        'זמין', 'מושאל', 'מוזמן'
    ]
    
    st.dataframe(
        display_df,
        use_container_width=True,
        hide_index=True,
        column_config={
            'שם פריט': st.column_config.TextColumn(
                'שם פריט',
                width='medium'
            ),
            'קטגוריה': st.column_config.TextColumn(
                'קטגוריה',
                width='small'
            ),
            'כמות כוללת': st.column_config.NumberColumn(
                'כמות כוללת',
                format='%d',
                width='small'
            ),
            'זמין': st.column_config.NumberColumn(
                'זמין',
                format='%d',
                width='small'
            ),
            'מושאל': st.column_config.NumberColumn(
                'מושאל',
                format='%d',
                width='small'
            ),
            'מוזמן': st.column_config.NumberColumn(
                'מוזמן',
                format='%d',
                width='small'
            )
        }
    )
