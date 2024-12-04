import streamlit as st
from database import (
    get_all_items, add_item, update_item, 
    delete_item, toggle_item_availability
)
from auth import require_role

def show_inventory(readonly=False):
    st.header("ניהול מלאי")
    
    # Add new item form - only for warehouse staff
    if not readonly:
        with st.expander("הוספת פריט חדש"):
            col1, col2 = st.columns(2)
            with col1:
                name = st.text_input("שם הפריט", key="new_name")
                category = st.text_input("קטגוריה", key="new_category")
            with col2:
                quantity = st.number_input("כמות", min_value=1, key="new_quantity")
                notes = st.text_area("הערות", key="new_notes")
            
            if st.button("הוסף פריט"):
                if name and category and quantity:
                    add_item(name, category, quantity, notes)
                    st.success("הפריט נוסף בהצלחה")
                    st.rerun()
                else:
                    st.error("יש למלא את כל השדות החובה")
    
    # Display inventory
    st.subheader("מלאי נוכחי")
    items = get_all_items()
    
    if items:
        # Convert to DataFrame for better display
        import pandas as pd
        df = pd.DataFrame(items)
        df.columns = ['מזהה', 'שם פריט', 'קטגוריה', 'כמות כוללת', 'כמות זמינה', 'הערות']
        
        # Add filters
        col1, col2 = st.columns(2)
        with col1:
            category_filter = st.multiselect(
                "סינון לפי קטגוריה",
                options=sorted(df['קטגוריה'].unique())
            )
        with col2:
            search = st.text_input("חיפוש פריט")
        
        # Apply filters
        if category_filter:
            df = df[df['קטגוריה'].isin(category_filter)]
        if search:
            df = df[df['שם פריט'].str.contains(search, case=False, na=False)]
        
        # Display items with management options
        for _, row in df.iterrows():
            with st.expander(f"{row['שם פריט']} ({row['קטגוריה']})"):
                col1, col2 = st.columns(2)
                with col1:
                    st.write(f"כמות כוללת: {row['כמות כוללת']}")
                    st.write(f"כמות זמינה: {row['כמות זמינה']}")
                with col2:
                    st.write(f"קטגוריה: {row['קטגוריה']}")
                    if row['הערות']:
                        st.write(f"הערות: {row['הערות']}")
                
                if not readonly and st.session_state.user and st.session_state.user.role == 'warehouse':
                    # Edit form
                    st.markdown("---")  # מפריד ויזואלי
                    st.subheader("עריכת פריט")
                    edit_name = st.text_input("שם הפריט", value=row['שם פריט'], key=f"edit_name_{row['מזהה']}")
                    edit_category = st.text_input("קטגוריה", value=row['קטגוריה'], key=f"edit_category_{row['מזהה']}")
                    edit_quantity = st.number_input("כמות", min_value=1, value=row['כמות כוללת'], key=f"edit_quantity_{row['מזהה']}")
                    edit_notes = st.text_area("הערות", value=row['הערות'] if row['הערות'] else "", key=f"edit_notes_{row['מזהה']}")
                    
                    col1, col2 = st.columns(2)
                    with col1:
                        if st.button("עדכן", key=f"update_{row['מזהה']}"):
                            success, message = update_item(
                                row['מזהה'], edit_name, edit_category,
                                edit_quantity, edit_notes
                            )
                            if success:
                                st.success(message)
                                st.rerun()
                            else:
                                st.error(message)
                    
                    with col2:
                        is_available = row['כמות זמינה'] > 0
                        if st.button(
                            "הפוך ללא זמין" if is_available else "הפוך לזמין",
                            key=f"toggle_{row['מזהה']}"
                        ):
                            success, message = toggle_item_availability(
                                row['מזהה'],
                                not is_available
                            )
                            if success:
                                st.success(message)
                                st.rerun()
                            else:
                                st.error(message)
                    
                    # Delete button with confirmation
                    if st.button("מחק פריט", key=f"delete_{row['מזהה']}", type="secondary"):
                        st.warning("האם אתה בטוח שברצונך למחוק את הפריט?")
                        col1, col2 = st.columns(2)
                        with col1:
                            if st.button("כן, מחק", key=f"confirm_delete_{row['מזהה']}", type="primary"):
                                success, message = delete_item(row['מזהה'])
                                if success:
                                    st.success(message)
                                    st.rerun()
                                else:
                                    st.error(message)
                        with col2:
                            if st.button("ביטול", key=f"cancel_delete_{row['מזהה']}"):
                                st.rerun()
    else:
        st.info("אין פריטים במלאי")
