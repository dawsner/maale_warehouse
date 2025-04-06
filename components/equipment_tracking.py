import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from database import get_db_connection
from components.statistics import apply_hebrew_plotly_theme

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
        autosize=True,
        height=400,
        font=dict(
            family="Arial, sans-serif",
            size=14
        ),
        margin=dict(l=50, r=50, t=80, b=50)
    )
    # Setting RTL layout for Hebrew
    fig.update_yaxes(autorange="reversed")
    fig.update_xaxes(side="top")
    apply_hebrew_plotly_theme(fig)
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
    
    # Add visual utilization column (progress bar)
    display_df['ניצולת'] = detailed_df['ניצולת'].copy()
    
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
            ),
            'ניצולת': st.column_config.ProgressColumn(
                'ניצולת',
                format='%.0f%%',
                min_value=0,
                max_value=1,
                width='medium'
            )
        }
    )
    
    # Add equipment status breakdown pie chart
    st.subheader("פילוח מצב ציוד")
    
    # Create pie chart data
    status_data = {
        'סטטוס': ['זמין', 'מושאל', 'מוזמן'],
        'כמות': [available_items, loaned_items, reserved_items]
    }
    status_df = pd.DataFrame(status_data)
    
    # Create pie chart
    fig_pie = px.pie(
        status_df, 
        values='כמות', 
        names='סטטוס',
        color='סטטוס',
        color_discrete_map={
            'זמין': '#2E86C1',
            'מושאל': '#E74C3C',
            'מוזמן': '#F39C12'
        },
        title='התפלגות מצב ציוד'
    )
    
    fig_pie.update_layout(
        autosize=True,
        height=400
    )
    
    apply_hebrew_plotly_theme(fig_pie)
    st.plotly_chart(fig_pie, use_container_width=True)
    
    # Top equipment utilization - horizontal bar chart
    st.subheader("ניצולת ציוד גבוהה")
    
    # Get top utilized equipment
    top_utilized = detailed_df.sort_values('ניצולת', ascending=False).head(10).copy()
    
    # Only show if we have items
    if not top_utilized.empty:
        # Create horizontal bar chart for utilization
        fig_util = go.Figure()
        fig_util.add_trace(go.Bar(
            y=top_utilized['name'],
            x=top_utilized['ניצולת'] * 100,  # Convert to percentage
            orientation='h',
            marker_color='#E67E22',
            text=[f"{x:.0f}%" for x in top_utilized['ניצולת'] * 100],
            textposition='auto'
        ))
        
        fig_util.update_layout(
            title='עשרת הפריטים בשימוש הגבוה ביותר',
            xaxis_title='אחוז ניצולת',
            yaxis_title='שם הפריט',
            autosize=True,
            height=500,
            xaxis=dict(
                ticksuffix='%',
                range=[0, 100]
            )
        )
        
        apply_hebrew_plotly_theme(fig_util)
        st.plotly_chart(fig_util, use_container_width=True)
    else:
        st.info("אין מספיק נתונים להצגת ניצולת ציוד")
        
    # Availability ratio by category heatmap
    st.subheader("יחס זמינות לפי קטגוריה")
    
    # Calculate availability ratio
    category_df['availability_ratio'] = (category_df['available_quantity'] / 
                                        category_df['total_quantity']).fillna(0)
    
    # Sort by availability ratio
    category_df = category_df.sort_values('availability_ratio')
    
    if not category_df.empty:
        # Create heatmap data
        heatmap_data = []
        for _, row in category_df.iterrows():
            category = row['category']
            available = row['available_quantity']
            total = row['total_quantity']
            ratio = row['availability_ratio']
            
            heatmap_data.append({
                'קטגוריה': category,
                'מדד זמינות': f"{ratio:.1%} ({available}/{total})"
            })
            
        heatmap_df = pd.DataFrame(heatmap_data)
        
        # Create custom color scale for heatmap
        custom_color_scale = [
            [0, '#E74C3C'],      # Red for 0% availability
            [0.5, '#F39C12'],    # Orange for 50% availability
            [1, '#2ECC71']       # Green for 100% availability
        ]
        
        # Create heatmap
        fig_heatmap = go.Figure(data=go.Heatmap(
            z=[list(category_df['availability_ratio'] * 100)],
            x=category_df['category'],
            colorscale=custom_color_scale,
            text=[f"{x:.1%}" for x in category_df['availability_ratio']],
            texttemplate="%{text}",
            textfont={"size":14},
            showscale=True,
            zmin=0,
            zmax=100
        ))
        
        fig_heatmap.update_layout(
            title="יחס זמינות לפי קטגוריה",
            height=200,
            margin=dict(l=20, r=20, t=60, b=20),
            coloraxis_colorbar=dict(
                title="אחוז זמינות",
                ticksuffix="%"
            )
        )
        
        apply_hebrew_plotly_theme(fig_heatmap)
        st.plotly_chart(fig_heatmap, use_container_width=True)
        
        # Show the data table as well
        st.dataframe(
            heatmap_df,
            hide_index=True,
            use_container_width=True
        )
    else:
        st.info("אין מספיק נתונים להצגת יחס זמינות לפי קטגוריה")
