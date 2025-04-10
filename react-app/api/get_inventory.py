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
    conn = None  # הגדרה מוקדמת של משתנים
    cursor = None  # שימוש בשם אחר כדי למנוע התנגשות 
    items = []
    loaned_quantities = {}
    
    try:
        # יצירת חיבור לבסיס הנתונים
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # שליפת כל פריטי המלאי עם כל העמודות
        cursor.execute('''
            SELECT id, name, category, quantity, available, notes, 
                   COALESCE(is_available, TRUE) as is_available,
                   category_original, order_notes, ordered, checked_out, 
                   checked, checkout_notes, returned, return_notes, 
                   price_per_unit, total_price, unnnamed_11, 
                   director, producer, photographer
            FROM items 
            ORDER BY category, name
        ''')
        
        items = cursor.fetchall()
        
        # שליפת כמויות פריטים שמושאלים כרגע
        cursor.execute('''
            SELECT item_id, SUM(quantity) as loaned_quantity
            FROM loans
            WHERE return_date IS NULL
            AND item_id IS NOT NULL
            GROUP BY item_id
        ''')
        
        loaned_quantities = {row[0]: row[1] for row in cursor.fetchall()}
        
        # סגירת החיבור לבסיס הנתונים
        cursor.close()
        conn.close()
        cursor = None
        conn = None
        
        # המרת התוצאה לפורמט JSON
        items_json = []
        for item in items:
            item_id = item[0]
            total_quantity = item[3]
            loaned_quantity = loaned_quantities.get(item_id, 0)
            available_quantity = max(0, total_quantity - loaned_quantity)
            
            available_from_db = item[4] if item[4] is not None else total_quantity
            
            item_dict = {
                'id': item_id,
                'name': item[1],
                'category': item[2],
                'quantity': total_quantity,
                'available_quantity': available_quantity,
                'loaned_quantity': loaned_quantity,
                'notes': item[5] or '',
                'is_available': item[6],
                'category_original': item[7] or '',
                'order_notes': item[8] or '',
                'ordered': item[9] if item[9] is not None else False,
                'checked_out': item[10] if item[10] is not None else False,
                'checked': item[11] if item[11] is not None else False,
                'checkout_notes': item[12] or '',
                'returned': item[13] if item[13] is not None else False,
                'return_notes': item[14] or '',
                'price_per_unit': float(item[15]) if item[15] is not None else 0.0,
                'total_price': float(item[16]) if item[16] is not None else 0.0,
                'unnnamed_11': item[17] or '',
                'director': item[18] or '',
                'producer': item[19] or '',
                'photographer': item[20] if len(item) > 20 and item[20] is not None else '',
                'available': available_from_db
            }
            items_json.append(item_dict)
        
        # החזרת התוצאה כ-JSON
        print(json.dumps(items_json, ensure_ascii=False))
        
    except Exception as e:
        # במקרה של שגיאה, החזרת הודעת שגיאה מפורטת
        import traceback
        error_details = traceback.format_exc()
        
        # הדפסה לצורך דיבוג
        print("Error: " + str(e), file=sys.stderr)
        print(error_details, file=sys.stderr)
        
        error_response = {
            'error': True,
            'message': str(e),
            'details': error_details
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()