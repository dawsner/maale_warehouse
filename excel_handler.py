import pandas as pd
import os
from database import get_db_connection, add_item

def import_excel(file):
    try:
        df = pd.read_excel(file, engine='openpyxl')
        
        # Verify required columns exist
        required_columns = ['Unnamed: 0', 'פריט']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return False, f"הקובץ חייב להכיל את העמודות הבאות: {', '.join(missing_columns)}"
            
        # Remove irrelevant columns, keeping only what we need
        note_columns = [
            'הערות על הזמנה (מחסן באדום. סטודנט בכחול)',
            'הערות על הוצאה (מחסן באדום. סטודנט בכחול)',
            'הערות על החזרה'
        ]
        
        # Keep only the columns we need
        columns_to_keep = ['Unnamed: 0', 'פריט'] + [col for col in note_columns if col in df.columns]
        df = df[columns_to_keep]
        
        # Initialize tracking variables
        current_category = None
        success_count = 0
        error_count = 0
        import re
        
        # Process rows to identify categories and items
        for idx, row in df.iterrows():
            category_marker = row['Unnamed: 0']
            item_name = row['פריט']
            
            # If we find a value in Unnamed: 0, it's a new category
            if pd.notna(category_marker) and isinstance(category_marker, str):
                current_category = category_marker.strip()
                continue
            
            # Skip if no item name or empty
            if pd.isna(item_name) or str(item_name).strip() == '':
                continue
            
            # Collect all relevant notes
            notes = []
            for note_col in [col for col in note_columns if col in df.columns]:
                if pd.notna(row.get(note_col)):
                    notes.append(str(row[note_col]))
            
            combined_notes = ' | '.join(notes)
            
            # Process quantity (default is 1)
            quantity = 1
            
            # Try to extract quantity from item name
            quantity_match = re.search(r'\d+', str(item_name))
            if quantity_match:
                try:
                    quantity = int(quantity_match.group())
                except ValueError:
                    quantity = 1
                    
            try:
                # Add item to database
                add_item(
                    name=str(item_name).strip(),
                    category=current_category or 'כללי',
                    quantity=quantity,
                    notes=combined_notes if combined_notes else ''
                )
                success_count += 1
            except Exception as e:
                error_count += 1
                print(f"Error processing item: {e}")
        
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
