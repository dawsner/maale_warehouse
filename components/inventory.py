import streamlit as st
from database import (
    get_all_items, add_item, update_item, 
    delete_item, toggle_item_availability
)
from auth import require_role

def show_inventory(readonly=False):
    # Add RTL CSS for data frame
    st.markdown('''
    <style>
        [data-testid="stDataFrame"] > div > div > div {
            direction: rtl;
        }
    </style>
    ''', unsafe_allow_html=True)
    
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
        
        # Display inventory table with edit capabilities for warehouse staff
        if not readonly:
            selected_item = st.data_editor(
                df,
                use_container_width=True,
                column_config={
                    "מזהה": None,
                    "שם פריט": st.column_config.TextColumn(
                        "שם פריט",
                        width="large",
                        help="לחץ לעריכת הפריט"
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
                num_rows="dynamic"
            )

            # Show edit form when a row is selected
            if selected_item is not None:
                row = selected_item.iloc[0]
                with st.popover(f"עריכת {row['שם פריט']}"):
                    with st.form(f"edit_form_{row['מזהה']}"):
                        edit_name = st.text_input("שם הפריט", value=row['שם פריט'])
                        edit_category = st.text_input("קטגוריה", value=row['קטגוריה'])
                        edit_quantity = st.number_input("כמות", min_value=1, value=row['כמות כוללת'])
                        edit_notes = st.text_area("הערות", value=row['הערות'] if row['הערות'] else "")
                        
                        col1, col2 = st.columns(2)
                        with col1:
                            if st.form_submit_button("עדכן"):
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
                            if st.form_submit_button("מחק", type="secondary"):
                                if delete_item(row['מזהה'])[0]:
                                    st.success("הפריט נמחק בהצלחה")
                                    st.rerun()
                                else:
                                    st.error("לא ניתן למחוק פריט עם השאלות פעילות")
        else:
            # Read-only view for students
            st.dataframe(
                df,
                use_container_width=True,
                column_config={
                    "מזהה": None,
                    "שם פריט": st.column_config.TextColumn(
                        "שם פריט",
                        width="large"
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
                hide_index=True
            )
    else:
        st.info("אין פריטים במלאי")
