"""
סקריפט זה מייבא נתונים מאקסל למערכת.
מאפשר תצוגה מקדימה של נתוני האקסל לפני הייבוא הסופי.
גרסה משופרת עם תמיכה במיפוי גמיש של עמודות אקסל לשדות בסיס הנתונים.
"""

import json
import sys
import os
import tempfile
from datetime import datetime
import pandas as pd
import numpy as np

# הוסף את תיקיית השורש של הפרויקט ל-path כדי שנוכל לייבא את database.py
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(project_root)

from database import get_db_connection, add_item

# מיפוי ברירת מחדל של שמות עמודות אקסל לשדות DB
DEFAULT_EXCEL_MAPPING = {
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

# טבלת המרה לערכים בוליאניים
BOOLEAN_TRUE_VALUES = ['true', 'yes', 'כן', '1', 'נכון', 'true', '+', 'v', '✓']

def preview_excel(file_path):
    """קורא את הקובץ אקסל ומחזיר תצוגה מקדימה של הנתונים"""
    try:
        # נסה לקרוא את הקובץ
        df = pd.read_excel(file_path, engine='openpyxl')
        
        # מקבל את שמות העמודות
        columns = df.columns.tolist()
        
        # ניחוש מיפוי עמודות אוטומטי
        suggested_mapping = guess_column_mapping(columns)
        
        # מקבל את כל הנתונים לתצוגה מקדימה
        data = []
        for idx, row in df.iterrows():
            # מגביל ל-100 שורות ראשונות לתצוגה מקדימה
            if idx >= 100:
                break
                
            row_dict = {}
            for col in columns:
                val = row[col]
                if pd.isna(val) or val is None:
                    row_dict[col] = ""
                elif isinstance(val, (int, float)):
                    if val == int(val):  # בדיקה אם המספר שלם
                        row_dict[col] = str(int(val))
                    else:
                        row_dict[col] = str(val)
                else:
                    row_dict[col] = str(val)
            data.append(row_dict)
        
        return {
            "success": True,
            "columns": columns,
            "data": data,
            "total_rows": len(df),
            "suggested_mapping": suggested_mapping
        }
    except Exception as e:
        print(f"שגיאה בקריאת קובץ האקסל: {str(e)}", file=sys.stderr)
        return {"error": str(e)}

def guess_column_mapping(columns):
    """מנחש מיפוי עמודות אוטומטי לפי שמות העמודות"""
    suggested_mapping = {}
    
    # מילות מפתח לזיהוי שדות
    keywords = {
        'name': ['שם', 'פריט', 'מוצר', 'item', 'name', 'product', 'פריטים'],
        'category': ['קטגוריה', 'סוג', 'category', 'type', 'group', 'קבוצה'],
        'quantity': ['כמות', 'מספר', 'יחידות', 'quantity', 'amount', 'count', 'units'],
        'notes': ['הערות', 'תיאור', 'פירוט', 'notes', 'description', 'details'],
        'order_notes': ['הערות הזמנה', 'הערות על הזמנה', 'order notes'],
        'ordered': ['הוזמן', 'הזמנה', 'ordered', 'order'],
        'checked_out': ['יצא', 'הושאל', 'בחוץ', 'checked out', 'out'],
        'checked': ['נבדק', 'בדיקה', 'בדקתי', 'verified', 'checked'],
        'checkout_notes': ['הערות יציאה', 'הערות על הוצאה', 'הערות השאלה', 'checkout notes'],
        'returned': ['הוחזר', 'חזר', 'החזרה', 'returned', 'return'],
        'return_notes': ['הערות החזרה', 'הערות על החזרה', 'return notes'],
        'price_per_unit': ['מחיר ליחידה', 'מחיר יחידה', 'מחיר פריט', 'unit price', 'price per unit'],
        'total_price': ['מחיר כולל', 'סה"כ מחיר', 'מחיר סופי', 'total price', 'final price'],
        'director': ['במאי', 'במאית', 'director'],
        'producer': ['מפיק', 'מפיקה', 'producer'],
        'photographer': ['צלם', 'צלמת', 'photographer', 'cinematographer']
    }
    
    # עבור כל עמודה בקובץ האקסל
    for column in columns:
        column_lower = column.lower()
        
        # בדיקה אם העמודה מופיעה במיפוי ברירת המחדל
        if column in DEFAULT_EXCEL_MAPPING:
            suggested_mapping[column] = DEFAULT_EXCEL_MAPPING[column]
            continue
            
        # חיפוש לפי מילות מפתח
        for field, key_terms in keywords.items():
            for term in key_terms:
                if term.lower() in column_lower:
                    suggested_mapping[column] = field
                    break
            
            # אם מצאנו התאמה, נעבור לעמודה הבאה
            if column in suggested_mapping:
                break
    
    return suggested_mapping

def format_value_for_database(value, db_field):
    """מעבד ערך לפורמט המתאים לשמירה בבסיס הנתונים לפי סוג השדה"""
    if pd.isna(value) or value is None:
        # ערכי ברירת מחדל לפי סוג השדה
        if db_field in ['ordered', 'checked_out', 'checked', 'returned']:
            return False
        elif db_field in ['price_per_unit', 'total_price', 'quantity']:
            return 0
        else:
            return None
    
    # טיפול בטיפוסי נתונים שונים
    if db_field in ['ordered', 'checked_out', 'checked', 'returned']:
        # המרה לערך בוליאני
        if isinstance(value, bool):
            return value
        elif isinstance(value, (int, float)):
            return value > 0
        elif isinstance(value, str):
            return value.lower() in BOOLEAN_TRUE_VALUES
        else:
            return False
    elif db_field in ['price_per_unit', 'total_price']:
        # המרת מספרים עשרוניים
        try:
            if isinstance(value, str):
                # ניקוי סימנים מיוחדים כמו סימני מטבע
                value = value.replace('₪', '').replace('$', '').replace(',', '').strip()
            return float(value) if value is not None else 0.0
        except:
            return 0.0
    elif db_field == 'quantity':
        # המרת כמות למספר שלם
        try:
            if isinstance(value, str):
                value = value.replace(',', '').strip()
            num_value = float(value)
            return int(num_value) if num_value.is_integer() else int(num_value)
        except:
            return 1
    else:
        # טקסט רגיל
        return str(value) if value is not None else ""

def import_excel_to_database(file_path, column_mapping):
    """מייבא את נתוני האקסל לבסיס הנתונים לפי מיפוי העמודות"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # קורא את הקובץ
        df = pd.read_excel(file_path, engine='openpyxl')
        
        # יצירת מיפוי הפוך - משדות DB לעמודות האקסל
        db_field_to_column = {field: col for col, field in column_mapping.items()}
        
        # בדיקה שיש עמודה שממופה לשם פריט
        if 'name' not in db_field_to_column:
            return {"error": "חסר מיפוי לשדה שם הפריט (name). אנא בחר עמודה שמכילה את שמות הפריטים."}
        
        name_column = db_field_to_column['name']
        
        # עיבוד נתונים - עובר על כל שורה ומייבא/מעדכן בבסיס הנתונים
        items_added = 0
        items_updated = 0
        errors = []
        
        for idx, row in df.iterrows():
            try:
                # בדיקת תקינות שם פריט (חובה)
                name_value = row[name_column] if not pd.isna(row[name_column]) else None
                if name_value is None or str(name_value).strip() == "":
                    continue  # דילוג על שורות ללא שם פריט
                
                # המרת שם פריט לטקסט
                name = str(name_value).strip()
                
                # איסוף כל הנתונים מהשורה לפי המיפוי
                item_data = {'name': name}
                
                # מילוי שדות נוספים לפי המיפוי
                for db_field, excel_col in db_field_to_column.items():
                    if db_field == 'name':
                        continue  # כבר טיפלנו בשדה name
                    
                    # טיפול בהמרת ערכים לפורמט המתאים
                    raw_value = row[excel_col] if excel_col in row else None
                    item_data[db_field] = format_value_for_database(raw_value, db_field)
                
                # וידוא שיש קטגוריה
                if 'category' not in item_data or not item_data['category']:
                    item_data['category'] = 'כללי'  # קטגוריה ברירת מחדל
                
                # וידוא שיש כמות
                if 'quantity' not in item_data or item_data['quantity'] is None:
                    item_data['quantity'] = 1  # כמות ברירת מחדל
                
                # סימון כל פריט חדש כזמין
                if 'is_available' not in item_data:
                    item_data['is_available'] = True
                
                # הכנת שדות להוספה/עדכון
                fields = list(item_data.keys())
                values = [item_data[field] for field in fields]
                
                # בדיקה אם הפריט כבר קיים
                cursor.execute(
                    "SELECT id FROM items WHERE name = %s",
                    (name,)
                )
                existing_item = cursor.fetchone()
                
                if existing_item:
                    # עדכון פריט קיים
                    set_clause = ", ".join([f"{field} = %s" for field in fields])
                    update_query = f"UPDATE items SET {set_clause} WHERE id = %s"
                    cursor.execute(update_query, values + [existing_item[0]])
                    items_updated += 1
                else:
                    # הוספת פריט חדש
                    placeholders = ", ".join(["%s"] * len(fields))
                    insert_query = f"INSERT INTO items ({', '.join(fields)}) VALUES ({placeholders})"
                    cursor.execute(insert_query, values)
                    items_added += 1
                
            except Exception as row_error:
                # תיעוד שגיאה בשורה ספציפית
                error_msg = f"שגיאה בשורה {idx+1}: {str(row_error)}"
                print(error_msg, file=sys.stderr)
                errors.append(error_msg)
                continue  # המשך לשורה הבאה
        
        conn.commit()
        conn.close()
        
        result = {
            "success": True,
            "items_added": items_added,
            "items_updated": items_updated,
            "total_processed": items_added + items_updated
        }
        
        if errors:
            result["warnings"] = errors[:10]  # החזרת עד 10 שגיאות ראשונות
            result["error_count"] = len(errors)
        
        return result
    except Exception as e:
        print(f"שגיאה בייבוא נתונים לבסיס הנתונים: {str(e)}", file=sys.stderr)
        return {"error": str(e)}

def create_excel_template():
    """יוצר קובץ תבנית לייבוא נתונים"""
    try:
        # יצירת DataFrame עם כל העמודות הנדרשות
        columns = [
            'פריט', 'קטגוריה', 'כמות', 'הערות', 
            'הזמנה', 'הערות על הזמנה (מחסן באדום. סטודנט בכחול)',
            'יצא', 'בדקתי', 'הערות על הוצאה (מחסן באדום. סטודנט בכחול)',
            'חזר', 'הערות על החזרה',
            'מחיר ליחידה', 'מחיר כולל',
            'במאית', 'מפיקה', 'צלמת'
        ]
        
        # יצירת DataFrame ריק עם העמודות
        df = pd.DataFrame(columns=columns)
        
        # הוספת שורת דוגמה
        sample_row = {
            'פריט': 'לדוגמה: מצלמת Canon EOS R5',
            'קטגוריה': 'לדוגמה: מצלמות',
            'כמות': 2,
            'הערות': 'לדוגמה: כולל סוללה נוספת',
            'הזמנה': 'כן',
            'הערות על הזמנה (מחסן באדום. סטודנט בכחול)': 'מחסן: יש לוודא הגעה',
            'יצא': 'כן',
            'בדקתי': 'כן',
            'הערות על הוצאה (מחסן באדום. סטודנט בכחול)': 'סטודנט: התקבל במצב תקין',
            'חזר': 'כן',
            'הערות על החזרה': 'הוחזר במצב תקין',
            'מחיר ליחידה': 15000,
            'מחיר כולל': 30000,
            'במאית': 'ישראלה כהן',
            'מפיקה': 'רונית לוי',
            'צלמת': 'מיכל אברהם'
        }
        df = pd.concat([df, pd.DataFrame([sample_row])], ignore_index=True)
        
        # הוספת שורה ריקה כתבנית
        empty_row = {col: '' for col in columns}
        df = pd.concat([df, pd.DataFrame([empty_row])], ignore_index=True)
        
        # שמירת הקובץ בתיקייה זמנית
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
        temp_file.close()
        
        # שמירת הקובץ
        df.to_excel(temp_file.name, index=False, engine='openpyxl')
        
        return {"file_path": temp_file.name}
    except Exception as e:
        print(f"שגיאה ביצירת תבנית אקסל: {str(e)}", file=sys.stderr)
        return {"error": str(e)}

def export_inventory_to_excel(filters=None):
    """מייצא את רשימת המלאי לקובץ אקסל"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # בסיס השאילתה
        query = "SELECT * FROM items"
        params = []
        
        # הוספת פילטרים אם הוגדרו
        if filters:
            clauses = []
            
            if 'onlyAvailable' in filters and filters['onlyAvailable']:
                clauses.append("is_available = true")
            
            if 'hasQuantity' in filters and filters['hasQuantity']:
                clauses.append("quantity > 0")
            
            if 'ordered' in filters and filters['ordered'] is not None:
                clauses.append("ordered = %s")
                params.append(filters['ordered'])
            
            if 'checkedOut' in filters and filters['checkedOut'] is not None:
                clauses.append("checked_out = %s")
                params.append(filters['checkedOut'])
            
            if 'checked' in filters and filters['checked'] is not None:
                clauses.append("checked = %s")
                params.append(filters['checked'])
            
            if 'returned' in filters and filters['returned'] is not None:
                clauses.append("returned = %s")
                params.append(filters['returned'])
            
            if 'categories' in filters and filters['categories']:
                placeholders = ', '.join(['%s'] * len(filters['categories']))
                clauses.append(f"category IN ({placeholders})")
                params.extend(filters['categories'])
            
            if 'searchQuery' in filters and filters['searchQuery']:
                search_term = f"%{filters['searchQuery']}%"
                clauses.append("(name ILIKE %s OR category ILIKE %s OR notes ILIKE %s)")
                params.extend([search_term, search_term, search_term])
            
            if clauses:
                query += " WHERE " + " AND ".join(clauses)
        
        # הוספת סדר מיון
        if filters and 'orderBy' in filters and 'order' in filters:
            order_by = filters['orderBy']
            order = filters['order'].upper()
            
            # וידוא תקינות שדה המיון והכיוון
            valid_fields = ['name', 'category', 'quantity', 'price_per_unit', 'total_price']
            valid_orders = ['ASC', 'DESC']
            
            if order_by in valid_fields and order in valid_orders:
                query += f" ORDER BY {order_by} {order}"
        else:
            # מיון ברירת מחדל
            query += " ORDER BY category ASC, name ASC"
        
        # ביצוע השאילתה
        cursor.execute(query, params)
        items = cursor.fetchall()
        
        # קבלת שמות העמודות
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'items' ORDER BY ordinal_position")
        columns = [row[0] for row in cursor.fetchall()]
        
        conn.close()
        
        # המרת הנתונים ל-DataFrame
        data = []
        for item in items:
            item_dict = {}
            for i, col in enumerate(columns):
                item_dict[col] = item[i]
            data.append(item_dict)
        
        df = pd.DataFrame(data)
        
        # מיפוי שמות העמודות לעברית
        hebrew_columns = {
            'id': 'מזהה',
            'name': 'פריט',
            'category': 'קטגוריה',
            'quantity': 'כמות',
            'notes': 'הערות',
            'category_original': 'קטגוריה מקורית',
            'order_notes': 'הערות על הזמנה',
            'ordered': 'הוזמן',
            'checked_out': 'יצא',
            'checked': 'נבדק',
            'checkout_notes': 'הערות על הוצאה',
            'returned': 'חזר',
            'return_notes': 'הערות על החזרה',
            'price_per_unit': 'מחיר ליחידה',
            'total_price': 'מחיר כולל',
            'unnnamed_11': 'שדה נוסף',
            'director': 'במאית',
            'producer': 'מפיקה',
            'photographer': 'צלמת',
            'is_available': 'זמין',
            'available_quantity': 'כמות זמינה',
            'loaned_quantity': 'כמות מושאלת',
            'created_at': 'נוצר בתאריך',
            'updated_at': 'עודכן בתאריך'
        }
        
        # שינוי שמות העמודות
        df.rename(columns=lambda x: hebrew_columns.get(x, x), inplace=True)
        
        # המרת ערכים בוליאניים לכן/לא
        boolean_columns = ['הוזמן', 'יצא', 'נבדק', 'חזר', 'זמין']
        for col in boolean_columns:
            if col in df.columns:
                df[col] = df[col].apply(lambda x: 'כן' if x else 'לא')
        
        # הוספת תאריך ושעה לשם הקובץ
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # שמירת הקובץ בתיקייה זמנית
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
        temp_file.close()
        
        # שמירת הקובץ
        df.to_excel(temp_file.name, index=False, engine='openpyxl')
        
        return {"file_path": temp_file.name}
    except Exception as e:
        print(f"שגיאה בייצוא נתוני מלאי לאקסל: {str(e)}", file=sys.stderr)
        return {"error": str(e)}

def main():
    """פונקציה ראשית"""
    # קריאת נתוני קלט JSON
    input_data = json.loads(sys.stdin.read())
    
    action = input_data.get('action', 'preview')
    file_path = input_data.get('file_path')
    
    # טיפול בפעולות שלא דורשות קובץ קלט (כמו יצירת תבנית)
    if action == 'export':
        filters = input_data.get('filters')
        result = export_inventory_to_excel(filters)
        print(json.dumps(result))
        return
    elif action == 'template':
        result = create_excel_template()
        print(json.dumps(result))
        return
    
    # טיפול בפעולות שדורשות קובץ קלט
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