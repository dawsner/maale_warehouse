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
        
        # חילוץ המיפוי העיקרי
        name_column = column_mapping.get('name')
        category_column = column_mapping.get('category')
        quantity_column = column_mapping.get('quantity')
        
        # מיפוי לכל השדות האפשריים בקובץ האקסל - מותאם במדויק לשמות העמודות מהאקסל
        excel_to_db_mapping = {
            'Unnamed: 0': 'category_original',  # זו העמודה שמכילה את הקטגוריות
            'פריט': 'name',                    # שם הפריט
            'הזמנה': 'ordered',                # האם הוזמן
            'הערות על הזמנה (מחסן באדום. סטודנט בכחול)': 'order_notes',  # הערות על ההזמנה
            'יצא': 'checked_out',              # מתי יצא מהמחסן
            'בדקתי': 'checked',                # האם נבדק
            'הערות על הוצאה (מחסן באדום. סטודנט בכחול)': 'checkout_notes',  # הערות על הוצאת הציוד
            'חזר': 'returned',                 # מתי חזר למחסן
            'הערות על החזרה': 'return_notes',   # הערות על ההחזרה
            'מחיר ליחידה': 'price_per_unit',    # מחיר ליחידה
            'מחיר כולל': 'total_price',         # מחיר כולל
            'Unnamed: 11': 'unnnamed_11',       # שדה ללא כותרת
            'במאית: ': 'director',             # במאית
            'מפיקה: ': 'producer',             # מפיקה
            'צלמת: ': 'photographer'           # צלמת
        }
        
        # יצירת מיפוי הפוך - מעמודות האקסל לשדות בבסיס הנתונים
        column_to_db_field = {}
        for excel_col, db_field in excel_to_db_mapping.items():
            if excel_col in df.columns:
                column_to_db_field[excel_col] = db_field
        
        if not name_column:
            return {"error": "חסר שם השדה שמכיל את שם הפריט (עמודת name)"}
        
        # יבוא הנתונים
        items_added = 0
        for _, row in df.iterrows():
            # חילוץ הנתונים הבסיסיים
            name = str(row[name_column]) if not pd.isna(row[name_column]) else ""
            
            # קביעת קטגוריה
            category = ""
            if category_column and not pd.isna(row[category_column]):
                category = str(row[category_column])
            
            # קביעת כמות
            quantity = 1  # ברירת מחדל
            if quantity_column and not pd.isna(row[quantity_column]):
                try:
                    quantity_val = row[quantity_column]
                    quantity = int(quantity_val) if not pd.isna(quantity_val) else 1
                except:
                    quantity = 1
            
            # דילוג על שורות ריקות
            if not name:
                continue
                
            # שמירת כל שדות האקסל
            item_data = {
                'name': name,
                'category': category or "כללי",  # ברירת מחדל אם אין קטגוריה
                'quantity': quantity
            }
            
            # הוספת כל השדות הנוספים מהאקסל
            for excel_col, db_field in column_to_db_field.items():
                # דילוג על השדות שכבר הוגדרו
                if db_field in ['name', 'category', 'quantity']:
                    continue
                    
                value = row[excel_col] if excel_col in row and not pd.isna(row[excel_col]) else None
                
                # טיפול בטיפוסי נתונים שונים
                if value is not None:
                    if db_field in ['ordered', 'checked_out', 'checked', 'returned']:
                        # המרה לערך בוליאני
                        if isinstance(value, bool):
                            item_data[db_field] = value
                        elif isinstance(value, (int, float)):
                            item_data[db_field] = value > 0
                        elif isinstance(value, str):
                            item_data[db_field] = value.lower() in ['true', 'yes', 'כן', '1', 'נכון']
                        else:
                            item_data[db_field] = False
                    elif db_field in ['price_per_unit', 'total_price']:
                        # המרת מספרים
                        try:
                            item_data[db_field] = float(value) if value is not None else 0.0
                        except:
                            item_data[db_field] = 0.0
                    else:
                        # טקסט רגיל
                        item_data[db_field] = str(value)
            
            # הכנת שדות להוספה/עדכון
            fields = ', '.join(item_data.keys())
            placeholders = ', '.join(['%s'] * len(item_data))
            update_set = ', '.join([f"{field} = %s" for field in item_data.keys()])
            values = list(item_data.values())
            
            # בדיקה אם הפריט כבר קיים
            cursor.execute(
                "SELECT id FROM items WHERE name = %s",
                (name,)
            )
            existing_item = cursor.fetchone()
            
            if existing_item:
                # עדכון פריט קיים
                update_query = f"UPDATE items SET {update_set} WHERE id = %s"
                cursor.execute(update_query, values + [existing_item[0]])
            else:
                # הוספת פריט חדש
                insert_query = f"INSERT INTO items ({fields}) VALUES ({placeholders})"
                cursor.execute(insert_query, values)
            
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