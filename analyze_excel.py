import pandas as pd
import sys

def analyze_excel_structure(file_path):
    try:
        print("\nReading Excel file...")
        df = pd.read_excel(file_path, engine='openpyxl')
        print("\nFile read successfully!")
        
        print("\n1. כל שמות העמודות בקובץ:")
        for col in df.columns:
            print(f"- {col}")
        
        print("\n2. חמש שורות ראשונות מהקובץ:")
        print(df.head().to_string())
        
        print("\n3. ניתוח העמודות לפי קטגוריות:")
        
        # Identify column types
        category_columns = ['Unnamed: 0']  # Usually contains categories
        item_columns = ['פריט']  # Contains item names
        note_columns = [
            'הערות על הזמנה (מחסן באדום. סטודנט בכחול)',
            'הערות על הוצאה (מחסן באדום. סטודנט בכחול)',
            'הערות על החזרה'
        ]
        production_team_columns = ['במאית: ', 'מפיקה: ', 'צלמת: ']
        status_columns = ['הזמנה', 'יצא', 'בדקתי', 'חזר']
        
        print("\nעמודות קטגוריות:")
        for col in [c for c in category_columns if c in df.columns]:
            print(f"- {col}")
        
        print("\nעמודות שמות פריטים:")
        for col in [c for c in item_columns if c in df.columns]:
            print(f"- {col}")
        
        print("\nעמודות הערות:")
        for col in [c for c in note_columns if c in df.columns]:
            print(f"- {col}")
        
        print("\nעמודות מידע על צוות ההפקה:")
        for col in [c for c in production_team_columns if c in df.columns]:
            print(f"- {col}")
        
        print("\nעמודות סטטוס השאלה/החזרה:")
        for col in [c for c in status_columns if c in df.columns]:
            print(f"- {col}")
        
        # Find unmapped columns
        all_mapped_columns = (category_columns + item_columns + note_columns + 
                            production_team_columns + status_columns)
        unmapped_columns = [col for col in df.columns if col not in all_mapped_columns]
        
        if unmapped_columns:
            print("\n4. עמודות שלא מופו:")
            for col in unmapped_columns:
                print(f"- {col}")
        else:
            print("\n4. אין עמודות שלא מופו")
        
        return df
    except Exception as e:
        print(f"Error: {str(e)}")
        return None

import os
from database import get_db_connection, add_item

def import_excel_to_db(file_path):
    """
    מייבא את נתוני האקסל לבסיס הנתונים.
    """
    try:
        print(f"\nImporting Excel file {file_path} to database...")
        df = pd.read_excel(file_path, engine='openpyxl')
        
        # מיפוי עמודות של אקסל לשדות בבסיס הנתונים
        excel_to_db_mapping = {
            'Unnamed: 0': 'category_original',
            'פריט': 'name',  
            'הזמנה': 'ordered',
            'הערות על הזמנה (מחסן באדום. סטודנט בכחול)': 'order_notes',
            'יצא': 'checked_out',
            'בדקתי': 'checked',
            'הערות על הוצאה (מחסן באדום. סטודנט בכחול)': 'checkout_notes',
            'חזר': 'returned',
            'הערות על החזרה': 'return_notes',
            'מחיר ליחידה': 'price_per_unit',
            'מחיר כולל': 'total_price',
            'Unnamed: 11': 'unnnamed_11',  # שים לב שזו טעות כתיב מקורית בשם העמודה
            'במאית: ': 'director',
            'מפיקה: ': 'producer',
            'צלמת: ': 'photographer'
        }

        # מתחבר לבסיס הנתונים
        conn = get_db_connection()
        cur = conn.cursor()
        
        # לא מוחקים יותר טבלאות לפני הייבוא, אלא רק נעדכן או נוסיף פריטים
        
        # סופר את הפריטים שנוספו או עודכנו
        items_added = 0
        items_updated = 0
        items_new = 0
        
        # מעבד את הנתונים
        current_category = None
        
        for idx, row in df.iterrows():
            category_marker = row.get('Unnamed: 0')
            item_name = row.get('פריט')
            
            # מזהה קטגוריה חדשה
            if pd.notna(category_marker) and str(category_marker).strip():
                current_category = str(category_marker).strip()
                print(f"\nProcessing category: {current_category}")
            
            # מזהה פריט חדש
            if pd.notna(item_name) and str(item_name).strip():
                item_name = str(item_name).strip()
                
                # קובע כמות (ברירת מחדל 1)
                quantity = 1
                
                # מנסה לחלץ כמות מתוך השם
                import re
                quantity_match = re.search(r'\d+', str(item_name))
                if quantity_match:
                    try:
                        quantity = int(quantity_match.group())
                    except ValueError:
                        quantity = 1
                
                # האם זה תת-פריט
                is_sub_item = isinstance(item_name, str) and item_name.startswith('    ')
                
                # קובע את הקטגוריה הסופית
                final_category = current_category or 'כללי'
                
                if is_sub_item:
                    item_name = item_name.strip()
                    if current_category:
                        final_category = f"{current_category} - אביזרים"
                
                # מכין מילון עם כל הערכים לפי המיפוי
                item_data = {
                    'name': item_name,
                    'category': final_category,
                    'quantity': quantity,
                    'available': quantity,
                    'category_original': current_category
                }
                
                # מעבד את כל השדות מהאקסל ומוסיף לפי המיפוי
                for excel_col, db_field in excel_to_db_mapping.items():
                    if excel_col != 'Unnamed: 0' and excel_col != 'פריט' and excel_col in row:
                        if pd.notna(row[excel_col]):
                            # טיפול בשדות בוליאניים (סטטוס)
                            if db_field in ['ordered', 'checked_out', 'checked', 'returned']:
                                item_data[db_field] = True if str(row[excel_col]).strip() else False
                            # טיפול בשדות מספריים
                            elif db_field in ['price_per_unit', 'total_price']:
                                try:
                                    item_data[db_field] = float(row[excel_col])
                                except (ValueError, TypeError):
                                    item_data[db_field] = 0
                            # שאר השדות הם טקסט
                            else:
                                item_data[db_field] = str(row[excel_col]).strip()
                
                # בניית שאילתת SQL דינמית ומשתנים
                fields = []
                values = []
                placeholders = []
                
                for field, value in item_data.items():
                    fields.append(field)
                    values.append(value)
                    placeholders.append("%s")
                
                # בודק אם הפריט כבר קיים בבסיס הנתונים (לפי השם והקטגוריה)
                try:
                    cur.execute(
                        "SELECT id FROM items WHERE name = %s AND category = %s",
                        (item_name, final_category)
                    )
                    existing_item = cur.fetchone()
                    
                    if existing_item:
                        # הפריט קיים - מעדכן אותו
                        item_id = existing_item[0]
                        updates = []
                        update_values = []
                        
                        for field, value in item_data.items():
                            updates.append(f"{field} = %s")
                            update_values.append(value)
                        
                        # מוסיף את ה-ID לסוף הרשימה
                        update_values.append(item_id)
                        
                        update_str = ", ".join(updates)
                        cur.execute(
                            f"UPDATE items SET {update_str} WHERE id = %s",
                            update_values
                        )
                        
                        items_updated += 1
                        items_added += 1
                        print(f"Updated item #{item_id}: {item_name} in category: {final_category}")
                    else:
                        # הפריט חדש - מוסיף אותו
                        field_str = ", ".join(fields)
                        placeholder_str = ", ".join(placeholders)
                        
                        cur.execute(
                            f"INSERT INTO items ({field_str}) VALUES ({placeholder_str}) RETURNING id",
                            values
                        )
                        
                        new_id = cur.fetchone()[0]
                        items_new += 1
                        items_added += 1
                        print(f"Added new item #{new_id}: {item_name} in category: {final_category}")
                except Exception as e:
                    print(f"Error processing item {item_name}: {str(e)}")
        
        print(f"\nFinished processing excel file. Total items: {items_added} (Updated: {items_updated}, New: {items_new}).")
        conn.commit()
        
        # סוגר את החיבור
        cur.close()
        conn.close()
        
        return {'total': items_added, 'updated': items_updated, 'new': items_new}
        
    except Exception as e:
        print(f"Error importing Excel file: {str(e)}")
        return 0

if __name__ == "__main__":
    file_path = 'טופס השאלת ציוד לשלוחה החרדית  ב.xlsx'
    
    # קודם מנתח את המבנה של הקובץ
    print("=== ניתוח מבנה קובץ האקסל ===")
    df = analyze_excel_structure(file_path)
    
    if df is not None:
        # שומר את הניתוח לקובץ
        with open('excel_structure.txt', 'w', encoding='utf-8') as f:
            f.write("ניתוח מבנה קובץ האקסל\n")
            f.write("\nמספר שורות בקובץ: " + str(len(df)))
            f.write("\nמספר עמודות: " + str(len(df.columns)))
            f.write("\n\nרשימת העמודות:\n")
            for col in df.columns:
                f.write(f"- {col}\n")
            f.write("\nדוגמת נתונים (5 שורות ראשונות):\n")
            f.write(df.head().to_string())
        
        # מייבא את הנתונים לבסיס הנתונים
        print("\n\n=== ייבוא נתונים לבסיס הנתונים ===")
        result = import_excel_to_db(file_path)
        if isinstance(result, dict):
            print(f"\nSummary: Processed {result['total']} items (Updated: {result['updated']}, New: {result['new']}).")
        else:
            print(f"\nSummary: Processed {result} items.")
