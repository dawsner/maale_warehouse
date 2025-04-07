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
        conn = get_db_connection()
        cur = conn.cursor()
        
        # שליפת כל פריטי המלאי (אם is_available לא קיים, נחשיב כtrue)
        cur.execute('''
            SELECT id, name, category, quantity, notes, 
                   CASE WHEN pg_typeof(is_available) = 'boolean'::regtype 
                        THEN is_available 
                        ELSE TRUE 
                   END as is_available
            FROM items 
            ORDER BY category, name
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
                'notes': item[4],
                'is_available': item[5]
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