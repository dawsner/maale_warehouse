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
        
        # קובע עמודות רלוונטיות
        note_columns = [
            'הערות על הזמנה (מחסן באדום. סטודנט בכחול)',
            'הערות על הוצאה (מחסן באדום. סטודנט בכחול)',
            'הערות על החזרה'
        ]
        status_columns = ['הזמנה', 'יצא', 'בדקתי', 'חזר']
        production_team_columns = ['במאית: ', 'מפיקה: ', 'צלמת: ']
        price_columns = ['מחיר ליחידה', 'מחיר כולל']
        
        # מאתר את העמודות שקיימות בקובץ
        available_note_columns = [col for col in note_columns if col in df.columns]
        available_status_columns = [col for col in status_columns if col in df.columns]
        available_team_columns = [col for col in production_team_columns if col in df.columns]
        available_price_columns = [col for col in price_columns if col in df.columns]
        
        print(f"Found {len(df)} rows in Excel file")
        
        # מנקה את בסיס הנתונים לפני הייבוא
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM reservations")
        cur.execute("DELETE FROM loans")
        cur.execute("DELETE FROM items")
        conn.commit()
        
        # סופר את הפריטים שנוספו
        items_added = 0
        
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
                
                # אוסף הערות
                notes = []
                
                for note_col in available_note_columns:
                    if pd.notna(row.get(note_col)):
                        note_text = str(row[note_col]).strip()
                        if note_text:
                            notes.append(f"{note_col}: {note_text}")
                
                # אוסף מידע על סטטוס
                for status_col in available_status_columns:
                    if pd.notna(row.get(status_col)):
                        status_value = str(row[status_col]).strip()
                        if status_value:
                            notes.append(f"{status_col}: {status_value}")
                
                # אוסף מידע על צוות
                for team_col in available_team_columns:
                    if pd.notna(row.get(team_col)):
                        team_member = str(row[team_col]).strip()
                        if team_member:
                            notes.append(f"{team_col}{team_member}")
                
                # אוסף מידע על מחירים
                for price_col in available_price_columns:
                    if pd.notna(row.get(price_col)):
                        try:
                            price_value = float(row[price_col])
                            notes.append(f"{price_col}: {price_value}")
                        except (ValueError, TypeError):
                            pass
                
                # מצרף את כל ההערות
                combined_notes = ' | '.join(notes)
                
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
                
                # מוסיף את הפריט לבסיס הנתונים
                try:
                    add_item(
                        name=item_name,
                        category=final_category,
                        quantity=quantity,
                        notes=combined_notes
                    )
                    items_added += 1
                    print(f"Added item #{items_added}: {item_name} in category: {final_category}")
                except Exception as e:
                    print(f"Error adding item {item_name}: {str(e)}")
        
        print(f"\nFinished importing excel file. Added {items_added} items to database.")
        
        # סוגר את החיבור
        cur.close()
        conn.close()
        
        return items_added
        
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
        items_added = import_excel_to_db(file_path)
        print(f"\nSummary: Added {items_added} items to the database.")
