"""
סקריפט זה מייבא נתונים מאקסל למערכת.
מאפשר תצוגה מקדימה של נתוני האקסל לפני הייבוא הסופי.
"""

import json
import sys
import os
import pandas as pd

# הוסף את תיקיית השורש של הפרויקט ל-path כדי שנוכל לייבא את database.py
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(project_root)

from database import get_db_connection, add_item

def preview_excel(file_path):
    """קורא את הקובץ אקסל ומחזיר תצוגה מקדימה של הנתונים"""
    try:
        # נסה לקרוא את הקובץ
        df = pd.read_excel(file_path)
        
        # מקבל את שמות העמודות
        columns = df.columns.tolist()
        
        # מקבל 5 שורות ראשונות לתצוגה מקדימה
        preview_rows = []
        for _, row in df.head(5).iterrows():
            row_dict = {}
            for col in columns:
                # המרה ל-string כדי לטפל בכל סוגי הנתונים
                val = row[col]
                if pd.isna(val):
                    row_dict[col] = ""
                elif isinstance(val, (int, float)):
                    row_dict[col] = str(val)
                else:
                    row_dict[col] = str(val)
            preview_rows.append(row_dict)
        
        return {
            "columns": columns,
            "preview": preview_rows,
            "total_rows": len(df)
        }
    except Exception as e:
        print(f"שגיאה בקריאת קובץ האקסל: {str(e)}", file=sys.stderr)
        return {"error": str(e)}

def import_excel_to_database(file_path, column_mapping):
    """מייבא את נתוני האקסל לבסיס הנתונים לפי מיפוי העמודות"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # קורא את הקובץ
        df = pd.read_excel(file_path)
        
        # חילוץ המיפוי
        name_column = column_mapping.get('name')
        category_column = column_mapping.get('category')
        quantity_column = column_mapping.get('quantity')
        notes_column = column_mapping.get('notes')
        
        if not name_column or not category_column or not quantity_column:
            return {"error": "חסרים שדות חובה במיפוי העמודות"}
        
        # יבוא הנתונים
        items_added = 0
        for _, row in df.iterrows():
            name = str(row[name_column]) if not pd.isna(row[name_column]) else ""
            category = str(row[category_column]) if not pd.isna(row[category_column]) else ""
            
            # טיפול בכמות - המרה למספר שלם
            quantity_val = row[quantity_column]
            if pd.isna(quantity_val):
                quantity = 0
            else:
                try:
                    quantity = int(quantity_val)
                except:
                    quantity = 0
            
            # טיפול בהערות
            notes = ""
            if notes_column and not pd.isna(row[notes_column]):
                notes = str(row[notes_column])
            
            # הוספת הפריט רק אם יש לו שם וקטגוריה
            if name and category:
                # בדיקה אם הפריט כבר קיים
                cursor.execute(
                    "SELECT id FROM items WHERE name = %s AND category = %s",
                    (name, category)
                )
                existing_item = cursor.fetchone()
                
                if existing_item:
                    # עדכון פריט קיים
                    cursor.execute(
                        "UPDATE items SET quantity = %s, notes = %s WHERE id = %s",
                        (quantity, notes, existing_item[0])
                    )
                else:
                    # הוספת פריט חדש
                    add_item(name, category, quantity, notes)
                
                items_added += 1
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "items_added": items_added
        }
    except Exception as e:
        print(f"שגיאה בייבוא נתונים לבסיס הנתונים: {str(e)}", file=sys.stderr)
        return {"error": str(e)}

def main():
    """פונקציה ראשית"""
    # קריאת נתוני קלט JSON
    input_data = json.loads(sys.stdin.read())
    
    action = input_data.get('action', 'preview')
    file_path = input_data.get('file_path')
    
    if not file_path or not os.path.exists(file_path):
        print(json.dumps({"error": "קובץ לא נמצא או לא ניתן לקריאה"}))
        return
    
    if action == 'preview':
        result = preview_excel(file_path)
        print(json.dumps(result))
    elif action == 'import':
        column_mapping = input_data.get('mapping', {})
        result = import_excel_to_database(file_path, column_mapping)
        print(json.dumps(result))
    else:
        print(json.dumps({"error": f"פעולה לא מוכרת: {action}"}))

if __name__ == "__main__":
    main()