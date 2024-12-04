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

        # Add table with actions column

        # Add actions column
        def get_action_buttons(row):
            actions = []
            if not readonly and st.session_state.user and st.session_state.user.role == 'warehouse':
                is_available = row['כמות זמינה'] > 0
                actions.append(f"⚡ {'הפוך ללא זמין' if is_available else 'הפוך לזמין'}")
                actions.append("✏️ ערוך")
                actions.append("🗑️ מחק")
            return " | ".join(actions) if actions else ""
        
        df['פעולות'] = df.apply(get_action_buttons, axis=1)
        
        # Display the table with new configuration
        st.dataframe(
            df,
            use_container_width=True,
            column_config={
                "מזהה": None,  # Hide ID column
                "פעולות": st.column_config.Column(
                    "פעולות",
                    width="small",
                    help="פעולות אפשריות"
                ),
                "שם פריט": st.column_config.TextColumn(
                    "שם פריט",
                    width="medium"
                ),
                "קטגוריה": st.column_config.TextColumn(
                    "קטגוריה",
                    width="medium"
                ),
                "כמות כוללת": st.column_config.NumberColumn(
                    "כמות כוללת",
                    width="small"
                ),
                "כמות זמינה": st.column_config.NumberColumn(
                    "כמות זמינה",
                    width="small"
                ),
                "הערות": st.column_config.TextColumn(
                    "הערות",
                    width="large"
                )
            },
            hide_index=True,
            on_click=handle_action_click
        )
    else:
        st.info("אין פריטים במלאי")

def handle_action_click(row, column):
    if column == 'פעולות':
        action = row['פעולות']
        item_id = row['מזהה']
        
        if "הפוך ל" in action:
            is_available = row['כמות זמינה'] > 0
            success, message = toggle_item_availability(item_id, not is_available)
            if success:
                st.success(message)
                st.rerun()
            else:
                st.error(message)
        
        elif "ערוך" in action:
            with st.expander("עריכת פריט", expanded=True):
                edit_name = st.text_input("שם הפריט", value=row['שם פריט'])
                edit_category = st.text_input("קטגוריה", value=row['קטגוריה'])
                edit_quantity = st.number_input("כמות", min_value=1, value=row['כמות כוללת'])
                edit_notes = st.text_area("הערות", value=row['הערות'] if row['הערות'] else "")
                
                if st.button("עדכן"):
                    success, message = update_item(
                        item_id, edit_name, edit_category,
                        edit_quantity, edit_notes
                    )
                    if success:
                        st.success(message)
                        st.rerun()
                    else:
                        st.error(message)
        
        elif "מחק" in action:
            if st.button("אישור מחיקה", type="primary"):
                success, message = delete_item(item_id)
                if success:
                    st.success(message)
                    st.rerun()
                else:
                    st.error(message)
