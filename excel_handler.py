import pandas as pd
import os
from database import get_db_connection, add_item

def import_excel(file):
    try:
        df = pd.read_excel(file, engine='openpyxl')
        print(f"Total rows in Excel: {len(df)}")
        
        # Keep all relevant columns
        note_columns = [
            'הערות על הזמנה (מחסן באדום. סטודנט בכחול)',
            'הערות על הוצאה (מחסן באדום. סטודנט בכחול)',
            'הערות על החזרה',
            'הזמנה',
            'יצא',
            'בדקתי',
            'חזר'
        ]
        
        additional_info_columns = ['במאית: ', 'מפיקה: ', 'צלמת: ']
        
        # Keep necessary columns
        columns_to_keep = ['Unnamed: 0', 'פריט'] + \
                         [col for col in note_columns if col in df.columns] + \
                         [col for col in additional_info_columns if col in df.columns]
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
            
            # Update category if found (even if empty rows follow)
            if pd.notna(category_marker) and isinstance(category_marker, str) and category_marker.strip():
                current_category = category_marker.strip()
            
            # Process item if exists (don't skip empty notes)
            if pd.notna(item_name) and str(item_name).strip():
                # Collect all relevant notes and additional info
                notes = []
                
                # Add standard notes
                for note_col in note_columns:
                    if note_col in df.columns and pd.notna(row.get(note_col)):
                        note_value = str(row[note_col]).strip()
                        if note_value:
                            notes.append(f"{note_col}: {note_value}")
                
                # Add additional info
                for info_col in additional_info_columns:
                    if info_col in df.columns and pd.notna(row.get(info_col)):
                        info_value = str(row[info_col]).strip()
                        if info_value:
                            notes.append(f"{info_col}{info_value}")
                
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
                    
            # Handle sub-items (indented items)
                is_sub_item = isinstance(item_name, str) and item_name.startswith('    ')
                final_category = current_category or 'כללי'
                
                if is_sub_item:
                    # For sub-items, add the parent category as a prefix
                    item_name = item_name.strip()
                    if current_category:
                        final_category = f"{current_category} - אביזרים"
                
                try:
                    # Add item to database
                    add_item(
                        name=str(item_name).strip(),
                        category=final_category,
                        quantity=quantity,
                        notes=combined_notes if combined_notes else ''
                    )
                    success_count += 1
                    print(f"Added item: {item_name} in category: {final_category}")
                except Exception as e:
                    error_count += 1
                    print(f"Error processing item: {e}")
        
        print(f"Processed {success_count + error_count} items total")
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
