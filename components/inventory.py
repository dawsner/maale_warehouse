import streamlit as st
from database import get_all_items, add_item
from auth import require_role

def show_inventory(readonly=False):
    st.header("ניהול מלאי")
    
    # Add new item form - only for warehouse staff
    if not readonly:
        with st.expander("הוספת פריט חדש"):
            col1, col2 = st.columns(2)
            with col1:
                name = st.text_input("שם הפריט")
                category = st.text_input("קטגוריה")
            with col2:
                quantity = st.number_input("כמות", min_value=1)
                notes = st.text_area("הערות")
            
            if st.button("הוסף פריט"):
                if name and category and quantity:
                    add_item(name, category, quantity, notes)
                    st.success("הפריט נוסף בהצלחה")
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
        
        # Display table
        st.dataframe(df.set_index('מזהה'))
    else:
        st.info("אין פריטים במלאי")
