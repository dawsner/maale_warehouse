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
    
    # Create tabs for making new reservations and viewing existing ones
    tab1, tab2 = st.tabs(["הזמנה חדשה", "ההזמנות שלי"])
    
    with tab1:
        with get_db_connection() as conn:
            # Get available items
            items_df = pd.read_sql_query(
                "SELECT id, name, category, available FROM items WHERE available > 0",
                conn
            )
        
        if items_df.empty:
            st.warning("אין פריטים זמינים להזמנה")
            return
            
        # Create reservation form
        with st.form("reservation_form"):
            # Item selection
            item_id = st.selectbox(
                "בחר פריט",
                options=items_df['id'].tolist(),
                format_func=lambda x: items_df[items_df['id'] == x]['name'].iloc[0]
            )
            
            # Get max available quantity for selected item
            max_quantity = items_df[items_df['id'] == item_id]['available'].iloc[0]
            
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
            
            # Quantity selection
            quantity = st.number_input("כמות", min_value=1, max_value=max_quantity, value=1)
            
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
    
    with tab2:
        # Show user's reservations
        reservations_df = get_user_reservations(st.session_state.user.id)
        
        if reservations_df.empty:
            st.info("אין לך הזמנות")
            return
        
        # Display reservations
        for _, reservation in reservations_df.iterrows():
            with st.expander(f"{reservation['item_name']} - {reservation['start_date'].strftime('%Y-%m-%d')}"):
                st.write(f"כמות: {reservation['quantity']}")
                st.write(f"תאריך התחלה: {reservation['start_date'].strftime('%Y-%m-%d')}")
                st.write(f"תאריך סיום: {reservation['end_date'].strftime('%Y-%m-%d')}")
                st.write(f"סטטוס: {reservation['status']}")
                if reservation['notes']:
                    st.write(f"הערות: {reservation['notes']}")

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
