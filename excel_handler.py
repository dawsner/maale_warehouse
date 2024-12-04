import pandas as pd
import os
from database import get_db_connection, add_item

def import_excel(file):
    try:
        # Try reading with different encodings
        try:
            df = pd.read_excel(file, engine='openpyxl')
        except UnicodeDecodeError:
            # If UTF-8 fails, try with a different encoding
            df = pd.read_excel(file, engine='openpyxl', encoding='cp1255')

        # Map Hebrew column names to system column names
        column_mapping = {
            'שם הפריט': 'name',
            'שם פריט': 'name',
            'פריט': 'name',
            'קטגוריה': 'category',
            'סוג ציוד': 'category',
            'כמות': 'quantity',
            'מספר פריטים': 'quantity',
            'הערות': 'notes',
            'הערה': 'notes'
        }
        
        # Check if any of the required columns exist in Hebrew
        required_hebrew_columns = [
            ['שם הפריט', 'שם פריט', 'פריט'],  # Name variations
            ['קטגוריה', 'סוג ציוד'],  # Category variations
            ['כמות', 'מספר פריטים']  # Quantity variations
        ]
        
        # Verify that at least one variation of each required column exists
        missing_columns = []
        for column_variations in required_hebrew_columns:
            if not any(col in df.columns for col in column_variations):
                missing_columns.append(" או ".join(column_variations))
        
        if missing_columns:
            return False, f"הקובץ חייב להכיל את העמודות הבאות: {', '.join(missing_columns)}"
        
        # Map the first found variation of each column
        actual_mapping = {}
        for hebrew_variations, english_name in [
            (['שם הפריט', 'שם פריט', 'פריט'], 'name'),
            (['קטגוריה', 'סוג ציוד'], 'category'),
            (['כמות', 'מספר פריטים'], 'quantity'),
            (['הערות', 'הערה'], 'notes')
        ]:
            found_column = next((col for col in hebrew_variations if col in df.columns), None)
            if found_column:
                actual_mapping[found_column] = english_name
        
        # Rename columns according to mapping
        df = df.rename(columns=actual_mapping)
        
        # Process each row and add to database
        success_count = 0
        error_count = 0
        
        for _, row in df.iterrows():
            try:
                # Convert quantity to integer, using 1 as default if missing or invalid
                try:
                    quantity = int(row.get('quantity', 1))
                    if pd.isna(quantity) or quantity < 1:
                        quantity = 1
                except (ValueError, TypeError):
                    quantity = 1
                
                # Get category and notes, using defaults if missing
                category = row.get('category', 'כללי')
                notes = row.get('notes', '')
                
                if pd.isna(category):
                    category = 'כללי'
                if pd.isna(notes):
                    notes = ''
                
                # Add item to database
                add_item(
                    name=str(row['name']),
                    category=str(category),
                    quantity=quantity,
                    notes=str(notes)
                )
                success_count += 1
            except Exception as e:
                error_count += 1
                print(f"Error processing row: {e}")
        
        result_message = f"נטענו {success_count} פריטים בהצלחה"
        if error_count > 0:
            result_message += f", נכשלה טעינה של {error_count} פריטים"
        
        return True, result_message
    
    except Exception as e:
        return False, f"שגיאה בטעינת הקובץ: {str(e)}"

def export_to_excel():
    with get_db_connection() as conn:
        # Export items
        items_df = pd.read_sql_query(
            """SELECT name as שם_פריט, category as קטגוריה,
               quantity as כמות_כוללת, available as כמות_זמינה,
               notes as הערות FROM items""",
            conn
        )
        
        # Export active loans
        loans_df = pd.read_sql_query(
            """SELECT i.name as שם_פריט, l.student_name as שם_סטודנט,
               l.student_id as תז_סטודנט, l.quantity as כמות,
               l.loan_date as תאריך_השאלה, l.due_date as תאריך_החזרה_נדרש
               FROM loans l
               JOIN items i ON l.item_id = i.id
               WHERE l.status = 'active'""",
            conn
        )
        
        # Create Excel writer object
        with pd.ExcelWriter('warehouse_export.xlsx', engine='openpyxl') as writer:
            items_df.to_excel(writer, sheet_name='מלאי', index=False)
            loans_df.to_excel(writer, sheet_name='השאלות_פעילות', index=False)
            
        return 'warehouse_export.xlsx'
