"""
סקריפט זה מייצא נתונים מבסיס הנתונים לקובץ אקסל.
מאפשר סינון הנתונים לפי קריטריונים שונים.
"""

import json
import sys
import os
import tempfile
from datetime import datetime
import pandas as pd

# הוסף את תיקיית השורש של הפרויקט ל-path כדי שנוכל לייבא את database.py
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(project_root)

from database import get_db_connection

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

def main():
    """פונקציה ראשית"""
    # קריאת נתוני קלט JSON
    input_data = json.loads(sys.stdin.read() or "{}")
    
    # בדיקה אם מדובר ביצירת תבנית או ייצוא רגיל
    if input_data.get('template'):
        result = create_excel_template()
    else:
        # ייצוא רגיל (עם פילטרים אופציונליים)
        filters = input_data.get('filters')
        result = export_inventory_to_excel(filters)
    
    print(json.dumps(result))

if __name__ == "__main__":
    main()