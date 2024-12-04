import streamlit as st
import pandas as pd
from datetime import datetime, timedelta
from database import get_db_connection
from auth import require_login

def create_reservation(item_id, student_name, student_id, quantity, start_date, end_date, user_id, notes=""):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Check if item has enough quantity available for the dates
            cur.execute("""
                SELECT i.quantity - COALESCE(
                    (SELECT SUM(r.quantity)
                     FROM reservations r
                     WHERE r.item_id = i.id
                     AND r.status = 'approved'
                     AND (
                         (r.start_date <= %s AND r.end_date >= %s)
                         OR (r.start_date <= %s AND r.end_date >= %s)
                         OR (r.start_date >= %s AND r.end_date <= %s)
                     )), 0) as available_quantity
                FROM items i
                WHERE i.id = %s
            """, (end_date, start_date, end_date, start_date, start_date, end_date, item_id))
            
            available = cur.fetchone()[0]
            
            if available < quantity:
                return False, "אין מספיק פריטים זמינים בתאריכים המבוקשים"
            
            # Create the reservation
            cur.execute("""
                INSERT INTO reservations 
                (user_id, item_id, student_name, student_id, quantity, start_date, end_date, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (user_id, item_id, student_name, student_id, quantity, start_date, end_date, notes))
            
            conn.commit()
            return True, "ההזמנה נוצרה בהצלחה"

def get_user_reservations(user_id):
    with get_db_connection() as conn:
        df = pd.read_sql_query("""
            SELECT r.id, i.name as item_name, r.quantity, 
                   r.start_date, r.end_date, r.status, r.notes
            FROM reservations r
            JOIN items i ON r.item_id = i.id
            WHERE r.user_id = %s
            ORDER BY r.start_date DESC
        """, conn, params=(user_id,))
    return df

def get_all_reservations():
    with get_db_connection() as conn:
        df = pd.read_sql_query("""
            SELECT r.id, i.name as item_name, r.student_name, 
                   r.student_id, r.quantity, r.start_date, r.end_date,
                   r.status, r.notes
            FROM reservations r
            JOIN items i ON r.item_id = i.id
            ORDER BY r.start_date DESC
        """, conn)
    return df

def update_reservation_status(reservation_id, status):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE reservations 
                SET status = %s
                WHERE id = %s
            """, (status, reservation_id))
            conn.commit()
            return True

@require_login
def show_reservations_page():
    st.header("הזמנת ציוד מראש")
    
    # Add status summary at the top
    with get_db_connection() as conn:
        # Get reservation statistics
        stats_df = pd.read_sql_query("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
            FROM reservations 
            WHERE user_id = %s
        """, conn, params=(st.session_state.user.id,))
        
        if not stats_df.empty:
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("סה\"כ הזמנות", stats_df['total'].iloc[0])
            with col2:
                st.metric("ממתינות לאישור", stats_df['pending'].iloc[0])
            with col3:
                st.metric("מאושרות", stats_df['approved'].iloc[0])
    
    # Quick navigation links
    col1, col2 = st.columns(2)
    with col1:
        if st.button("📋 צפייה במלאי הזמין"):
            st.session_state['page'] = 'inventory'
            st.rerun()
    with col2:
        if st.button("📚 היסטוריית הזמנות"):
            st.session_state['page'] = 'history'
            st.rerun()
    
    # Main reservation section
    st.subheader("יצירת הזמנה חדשה")
    
    # Get available items and show them in a table
    with get_db_connection() as conn:
        items_df = pd.read_sql_query("""
            SELECT i.id, i.name, i.category, i.available,
                   COALESCE(r.reserved_quantity, 0) as reserved
            FROM items i
            LEFT JOIN (
                SELECT item_id, SUM(quantity) as reserved_quantity
                FROM reservations
                WHERE status = 'approved'
                GROUP BY item_id
            ) r ON i.id = r.item_id
            WHERE i.available > 0
        """, conn)
        
    if items_df.empty:
        st.warning("אין פריטים זמינים להזמנה")
        return
    
    # Show available items table
    st.markdown("### פריטים זמינים")
    display_df = items_df.copy()
    display_df['זמינות בפועל'] = display_df['available'] - display_df['reserved']
    display_df = display_df[['name', 'category', 'זמינות בפועל']]
    display_df.columns = ['שם פריט', 'קטגוריה', 'כמות זמינה']
    st.dataframe(display_df, hide_index=True)
    
    # Create reservation form
    with st.form("reservation_form"):
        # Item selection with real-time availability
        item_id = st.selectbox(
            "בחר פריט",
            options=items_df['id'].tolist(),
            format_func=lambda x: f"{items_df[items_df['id'] == x]['name'].iloc[0]} "
                                f"(זמין: {items_df[items_df['id'] == x]['available'].iloc[0] - items_df[items_df['id'] == x]['reserved'].iloc[0]})"
        )
        
        # Get max available quantity for selected item
        max_quantity = items_df[items_df['id'] == item_id]['available'].iloc[0] - \
                      items_df[items_df['id'] == item_id]['reserved'].iloc[0]
        
        # Date selection
        col1, col2 = st.columns(2)
        with col1:
            start_date = st.date_input(
                "תאריך התחלה",
                min_value=datetime.now().date(),
                value=datetime.now().date()
            )
        with col2:
            end_date = st.date_input(
                "תאריך סיום",
                min_value=start_date,
                value=start_date + timedelta(days=1)
            )
        
        # Quantity selection with real-time validation
        quantity = st.number_input(
            "כמות",
            min_value=1,
            max_value=int(max_quantity),
            value=min(1, int(max_quantity))
        )
        
        # Additional notes
        notes = st.text_area("הערות")
        
        # Submit button
        submitted = st.form_submit_button("שלח בקשה")
        
        if submitted:
            success, message = create_reservation(
                item_id=item_id,
                student_name=st.session_state.user.full_name,
                student_id=st.session_state.user.username,
                quantity=quantity,
                start_date=datetime.combine(start_date, datetime.min.time()),
                end_date=datetime.combine(end_date, datetime.max.time()),
                user_id=st.session_state.user.id,
                notes=notes
            )
            
            if success:
                st.success(message)
                st.rerun()
            else:
                st.error(message)
    
    # Show user's reservations in a table
    st.markdown("### ההזמנות שלי")
    reservations_df = get_user_reservations(st.session_state.user.id)
    
    if reservations_df.empty:
        st.info("אין לך הזמנות")
    else:
        # Format the DataFrame for display
        display_df = reservations_df.copy()
        display_df['start_date'] = pd.to_datetime(display_df['start_date']).dt.strftime('%Y-%m-%d')
        display_df['end_date'] = pd.to_datetime(display_df['end_date']).dt.strftime('%Y-%m-%d')
        
        # Add status badges
        def format_status(status):
            if status == 'approved':
                return '✅ מאושר'
            elif status == 'pending':
                return '⏳ ממתין לאישור'
            else:
                return '❌ נדחה'
        
        display_df['status'] = display_df['status'].apply(format_status)
        display_df.columns = ['מזהה', 'פריט', 'כמות', 'מתאריך', 'עד תאריך', 'סטטוס', 'הערות']
        
        # Show the table
        st.dataframe(
            display_df.drop(columns=['מזהה']),
            hide_index=True,
            column_config={
                "סטטוס": st.column_config.TextColumn(
                    width="medium",
                    help="סטטוס ההזמנה"
                ),
                "הערות": st.column_config.TextColumn(
                    width="large"
                )
            }
        )

def show_reservation_management():
    st.header("ניהול הזמנות")
    
    reservations_df = get_all_reservations()
    
    if reservations_df.empty:
        st.info("אין הזמנות ממתינות")
        return
    
    # Filter reservations
    status_filter = st.multiselect(
        "סטטוס",
        options=['pending', 'approved', 'rejected'],
        default=['pending'],
        format_func=lambda x: {
            'pending': 'ממתין',
            'approved': 'מאושר',
            'rejected': 'נדחה'
        }[x]
    )
    
    filtered_df = reservations_df[reservations_df['status'].isin(status_filter)]
    
    if filtered_df.empty:
        st.info("אין הזמנות להצגה")
        return
    
    # Display reservations
    for _, reservation in filtered_df.iterrows():
        with st.expander(
            f"{reservation['item_name']} - {reservation['student_name']} "
            f"({reservation['start_date'].strftime('%Y-%m-%d')} - {reservation['end_date'].strftime('%Y-%m-%d')})"
        ):
            col1, col2 = st.columns(2)
            
            with col1:
                st.write(f"ת.ז. סטודנט: {reservation['student_id']}")
                st.write(f"כמות: {reservation['quantity']}")
            
            with col2:
                st.write(f"סטטוס: {reservation['status']}")
                if reservation['notes']:
                    st.write(f"הערות: {reservation['notes']}")
            
            # Add approval/rejection buttons for pending reservations
            if reservation['status'] == 'pending':
                if st.button("אשר", key=f"approve_{reservation['id']}"):
                    update_reservation_status(reservation['id'], 'approved')
                    st.success("ההזמנה אושרה")
                    st.rerun()
                
                if st.button("דחה", key=f"reject_{reservation['id']}"):
                    update_reservation_status(reservation['id'], 'rejected')
                    st.success("ההזמנה נדחתה")
                    st.rerun()
