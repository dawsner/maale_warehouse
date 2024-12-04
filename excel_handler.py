import pandas as pd
import os
from database import get_db_connection, add_item

def import_excel(file):
    try:
        # Try reading with different encodings
        encodings = ['utf-8', 'cp1255', 'windows-1255']
        df = None
        
        for encoding in encodings:
            try:
                df = pd.read_excel(file, engine='openpyxl')
                break
            except UnicodeDecodeError:
                continue
                
        if df is None:
            return False, "לא הצלחתי לקרוא את הקובץ עם אף קידוד"

        # Remove irrelevant columns
        irrelevant_columns = ['במאית: ', 'מפיקה: ', 'צלמת: ', 'Unnamed: 11']
        df = df.drop(columns=[col for col in irrelevant_columns if col in df.columns])
        
        # Initialize category tracking
        current_category = None
        processed_items = []
        
        # Process rows to identify categories and items
        for idx, row in df.iterrows():
            item_name = row.get('פריט')
            
            # Skip empty rows
            if pd.isna(item_name) or str(item_name).strip() == '':
                continue
                
            # If the row starts with 'מצלמה', 'תאורה', etc., it's a category
            if isinstance(item_name, str) and ':' not in item_name and not item_name.startswith('    '):
                current_category = item_name
                continue
            
            # Collect all relevant notes
            notes = []
            if not pd.isna(row.get('הערות על הזמנה (מחסן באדום. סטודנט בכחול)')):
                notes.append(str(row['הערות על הזמנה (מחסן באדום. סטודנט בכחול)']))
            if not pd.isna(row.get('הערות על הוצאה (מחסן באדום. סטודנט בכחול)')):
                notes.append(str(row['הערות על הוצאה (מחסן באדום. סטודנט בכחול)']))
            if not pd.isna(row.get('הערות על החזרה')):
                notes.append(str(row['הערות על החזרה']))
            
            combined_notes = ' | '.join(notes)
        
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
        
        # Skip if it's not an actual item
            if pd.isna(item_name) or isinstance(item_name, str) and item_name.strip() == '':
                continue
                
            # Process quantity
            quantity = 1  # Default quantity
            
            # Attempt to extract quantity from item name if it contains numbers
            import re
            quantity_match = re.search(r'\d+', str(item_name))
            if quantity_match:
                try:
                    quantity = int(quantity_match.group())
                except ValueError:
                    quantity = 1
            
            # Add to processed items list
            processed_items.append({
                'name': str(item_name).strip(),
                'category': current_category or 'כללי',
                'quantity': quantity,
                'notes': combined_notes if combined_notes else ''
            })
        
        # Process each item and add to database
        success_count = 0
        error_count = 0
        
        for item in processed_items:
            try:
                # Add item to database
                add_item(
                    name=item['name'],
                    category=item['category'],
                    quantity=item['quantity'],
                    notes=item['notes']
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
