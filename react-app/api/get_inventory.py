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

def main():
    """פונקציה ראשית שמחזירה את כל פריטי המלאי כ-JSON"""
    try:
        print(f"Debug: Starting database connection...", file=sys.stderr)
        conn = get_db_connection()
        print(f"Debug: Database connection successful", file=sys.stderr)
        cur = conn.cursor()
        print(f"Debug: Got cursor", file=sys.stderr)
        
        # שליפת כל פריטי המלאי עם כל העמודות
        cur.execute('''
            SELECT id, name, category, quantity, notes, 
                   CASE WHEN pg_typeof(is_available) = 'boolean'::regtype 
                        THEN is_available 
                        ELSE TRUE 
                   END as is_available,
                   category_original, order_notes, ordered, checked_out, 
                   checked, checkout_notes, returned, return_notes, 
                   price_per_unit, total_price, unnnamed_11, 
                   director, producer, photographer
            FROM items 
            ORDER BY category, name
            LIMIT 100
        ''')
        
        items = cur.fetchall()
        
        # שליפת כמויות פריטים שמושאלים כרגע
        cur.execute('''
            SELECT item_id, SUM(quantity) as loaned_quantity
            FROM loans
            WHERE return_date IS NULL
            GROUP BY item_id
        ''')
        
        loaned_quantities = {row[0]: row[1] for row in cur.fetchall()}
        
        cur.close()
        conn.close()
        
        # המרת התוצאה לפורמט JSON
        items_json = []
        for item in items:
            item_id = item[0]
            total_quantity = item[3]
            loaned_quantity = loaned_quantities.get(item_id, 0)
            available_quantity = max(0, total_quantity - loaned_quantity)
            
            item_dict = {
                'id': item_id,
                'name': item[1],
                'category': item[2],
                'quantity': total_quantity,
                'available_quantity': available_quantity,
                'loaned_quantity': loaned_quantity,
                'notes': item[4] or '',
                'is_available': item[5],
                'category_original': item[6] or '',
                'order_notes': item[7] or '',
                'ordered': item[8] if item[8] is not None else False,
                'checked_out': item[9] if item[9] is not None else False,
                'checked': item[10] if item[10] is not None else False,
                'checkout_notes': item[11] or '',
                'returned': item[12] if item[12] is not None else False,
                'return_notes': item[13] or '',
                'price_per_unit': float(item[14]) if item[14] is not None else 0.0,
                'total_price': float(item[15]) if item[15] is not None else 0.0,
                'unnnamed_11': item[16] or '',
                'director': item[17] or '',
                'producer': item[18] or '',
                'photographer': item[19] or ''
            }
            items_json.append(item_dict)
        
        # החזרת התוצאה כ-JSON
        print(json.dumps(items_json, ensure_ascii=False))
        
    except Exception as e:
        # במקרה של שגיאה, החזרת הודעת שגיאה
        error_response = {
            'error': True,
            'message': str(e)
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()