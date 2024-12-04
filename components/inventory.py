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
        if not readonly and st.session_state.user and st.session_state.user.role == 'warehouse':
            edited_df = st.data_editor(
                df,
                use_container_width=True,
                column_config={
                    "מזהה": None,  # רק להסתיר את המזהה
                    "שם פריט": st.column_config.TextColumn(
                        "שם פריט",
                        width="large",
                        required=True
                    ),
                    "קטגוריה": st.column_config.TextColumn(
                        "קטגוריה",
                        width="medium",
                        required=True
                    ),
                    "כמות כוללת": st.column_config.NumberColumn(
                        "כמות כוללת",
                        width="small",
                        min_value=1,
                        required=True
                    ),
                    "כמות זמינה": st.column_config.NumberColumn(
                        "כמות זמינה",
                        width="small",
                        min_value=0
                    ),
                    "הערות": st.column_config.TextColumn(
                        "הערות",
                        width="large"
                    )
                },
                hide_index=True,
                num_rows="dynamic"
            )
            
            # Check for changes in data
            if edited_df is not None and not edited_df.equals(df):
                for idx, row in edited_df.iterrows():
                    original_row = df.loc[df['מזהה'] == row['מזהה']].iloc[0]
                    if not row.equals(original_row):
                        success, message = update_item(
                            row['מזהה'],
                            row['שם פריט'],
                            row['קטגוריה'],
                            row['כמות כוללת'],
                            row['הערות']
                        )
                        if success:
                            st.success(f"הפריט {row['שם פריט']} עודכן בהצלחה")
                            st.rerun()
                        else:
                            st.error(message)
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
