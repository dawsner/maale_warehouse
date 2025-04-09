"""
סקריפט זה מחזיר את כל פריטי המלאי כ-JSON.
משמש את ה-API של React לקבלת נתוני מלאי.
"""

import sys
import json
import os

# הוספת תיקיית הפרויקט הראשית לנתיב החיפוש
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# ייבוא פונקציות מבסיס הנתונים
from database import get_db_connection

def get_table_columns(conn, table_name):
    """שליפת רשימת העמודות הקיימות בטבלה"""
    cursor = conn.cursor()
    cursor.execute(f"""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '{table_name}'
        ORDER BY ordinal_position
    """)
    columns = [col[0] for col in cursor.fetchall()]
    cursor.close()
    return columns

def main():
    """פונקציה ראשית שמחזירה את כל פריטי המלאי כ-JSON"""
    conn = None  # הגדרה מוקדמת של משתנים
    cursor = None  # שימוש בשם אחר כדי למנוע התנגשות 
    items_json = []  # מערך ריק כברירת מחדל
    
    try:
        # יצירת חיבור לבסיס הנתונים
        conn = get_db_connection()
        if not conn:
            print("[]", flush=True)
            return
            
        cursor = conn.cursor()
        
        # בדיקה שהטבלה קיימת
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'items'
            )
        """)
        result = cursor.fetchone()
        table_exists = result[0] if result else False
        
        if not table_exists:
            print("[]", flush=True)  # אם הטבלה לא קיימת, מחזירים מערך ריק
            return
        
        # שליפת רשימת העמודות
        columns = get_table_columns(conn, 'items')
        
        # בניית שאילתה דינמית עם העמודות הקיימות
        select_columns = ["id", "name", "category", "quantity"]
        
        # מיפוי של שדות נדרשים והברירות מחדל שלהם
        required_fields = {
            "available": "quantity", 
            "is_available": "TRUE",
            "notes": "''", 
            "category_original": "''",
            "order_notes": "''", 
            "ordered": "FALSE",
            "checked_out": "FALSE", 
            "checked": "FALSE",
            "checkout_notes": "''", 
            "returned": "FALSE",
            "return_notes": "''", 
            "price_per_unit": "0",
            "total_price": "0", 
            "unnnamed_11": "''",
            "director": "''", 
            "producer": "''",
            "photographer": "''"
        }
        
        # בניית השאילתה עם התחשבות בעמודות הקיימות
        for field, default in required_fields.items():
            if field in columns:
                select_columns.append(f"COALESCE({field}, {default}) as {field}")
            else:
                select_columns.append(f"{default} as {field}")
                
        query = f"""
            SELECT {', '.join(select_columns)}
            FROM items 
            ORDER BY category, name
        """
        
        # שליפת כל פריטי המלאי עם כל העמודות
        cursor.execute(query)
        items = cursor.fetchall()
        
        # שמירת מידע על העמודות לפני סגירת הקישור לטבלת items
        column_names = [desc[0] for desc in cursor.description] if cursor.description else []
        column_indexes = {}
        
        # יצירת מיפוי אינדקסים לעמודות
        for i, name in enumerate(column_names):
            column_indexes[name] = i
        
        # שליפת כמויות פריטים שמושאלים כרגע
        loaned_quantities = {}
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'loans'
            )
        """)
        result = cursor.fetchone()
        loans_table_exists = result[0] if result else False
        
        if loans_table_exists:
            try:
                cursor.execute('''
                    SELECT item_id, SUM(quantity) as loaned_quantity
                    FROM loans
                    WHERE return_date IS NULL
                    AND item_id IS NOT NULL
                    GROUP BY item_id
                ''')
                loaned_quantities = {row[0]: row[1] for row in cursor.fetchall()}
            except Exception as loans_error:
                print(f"Warning: Could not fetch loans data: {loans_error}", file=sys.stderr)
        
        # סגירת החיבור לבסיס הנתונים
        cursor.close()
        conn.close()
        
        # המרת התוצאה לפורמט JSON
        items_json = []
        
        # פונקציה לקבלת ערך בטוח ממערך (עם ברירת מחדל)
        def safe_get(arr, index, default=None):
            if isinstance(arr, (list, tuple)) and 0 <= index < len(arr):
                return arr[index] if arr[index] is not None else default
            return default
        
        # פונקציה לקבלת ערך עמודה לפי שם
        def get_column_value(item, name, default=None):
            idx = column_indexes.get(name)
            if idx is not None:
                return safe_get(item, idx, default)
            return default
        
        # פונקציה להמרה בטוחה למספר
        def safe_float(value, default=0.0):
            if value is None:
                return default
            try:
                return float(value)
            except (ValueError, TypeError):
                return default
        
        for item in items:
            if not item or len(item) < 4:  # בדיקה שהפריט תקין עם לפחות 4 עמודות בסיסיות
                continue
                
            item_id = safe_get(item, 0, 0)
            total_quantity = safe_get(item, 3, 0)  # quantity אינדקס 3
            loaned_quantity = loaned_quantities.get(item_id, 0)
            available_quantity = max(0, total_quantity - loaned_quantity)
            
            # בדיקה האם קיימת עמודה 'available'
            available_idx = column_indexes.get('available')
            available_from_db = item[available_idx] if available_idx is not None and available_idx < len(item) else total_quantity
            
            # בניית מילון עם ערכים בטוחים
            item_dict = {
                'id': item_id,
                'name': safe_get(item, 1, ''),  # name אינדקס 1
                'category': safe_get(item, 2, ''),  # category אינדקס 2
                'quantity': total_quantity,
                'available_quantity': available_quantity,
                'loaned_quantity': loaned_quantity,
                'notes': get_column_value(item, 'notes', ''),
                'is_available': get_column_value(item, 'is_available', True),
                'category_original': get_column_value(item, 'category_original', ''),
                'order_notes': get_column_value(item, 'order_notes', ''),
                'ordered': get_column_value(item, 'ordered', False),
                'checked_out': get_column_value(item, 'checked_out', False),
                'checked': get_column_value(item, 'checked', False),
                'checkout_notes': get_column_value(item, 'checkout_notes', ''),
                'returned': get_column_value(item, 'returned', False),
                'return_notes': get_column_value(item, 'return_notes', ''),
                'price_per_unit': safe_float(get_column_value(item, 'price_per_unit', 0.0)),
                'total_price': safe_float(get_column_value(item, 'total_price', 0.0)),
                'unnnamed_11': get_column_value(item, 'unnnamed_11', ''),
                'director': get_column_value(item, 'director', ''),
                'producer': get_column_value(item, 'producer', ''),
                'photographer': get_column_value(item, 'photographer', ''),
                'available': available_from_db
            }
            items_json.append(item_dict)
        
        # החזרת התוצאה כ-JSON - שימוש ב-FLUSH כדי לוודא שהפלט יישלח מיד
        print(json.dumps(items_json, ensure_ascii=False), flush=True)
        
    except Exception as e:
        # במקרה של שגיאה, החזרת הודעת שגיאה מפורטת
        import traceback
        error_details = traceback.format_exc()
        
        # הדפסה לצורך דיבוג
        print("Error: " + str(e), file=sys.stderr)
        print(error_details, file=sys.stderr)
        
        # במקום להחזיר מבנה שגיאה מורכב, נחזיר מערך ריק
        # כדי שהממשק לא יישבר
        print("[]", flush=True)

if __name__ == "__main__":
    main()