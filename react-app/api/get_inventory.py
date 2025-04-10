"""
סקריפט זה מחזיר את כל פריטי המלאי כ-JSON.
משמש את ה-API של React לקבלת נתוני מלאי.
"""

import sys
import json
import os
import psycopg2
import psycopg2.extras

def get_direct_db_connection():
    """יוצר חיבור ישיר למסד הנתונים"""
    db_url = os.getenv('DATABASE_URL')
    print(f"DEBUG: Connecting directly to database with URL: {db_url}", file=sys.stderr)
    return psycopg2.connect(db_url)

def main():
    """פונקציה ראשית שמחזירה את כל פריטי המלאי כ-JSON"""
    conn = None  # הגדרה מוקדמת של משתנים
    cursor = None  # שימוש בשם אחר כדי למנוע התנגשות 
    items = []
    loaned_quantities = {}
    
    # Debugging - Check items in database
    try:
        conn = get_direct_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT COUNT(*) FROM items")
        item_count = cursor.fetchone()[0]
        print(f"DEBUG: Items count in database: {item_count}", file=sys.stderr)
        
        if item_count > 0:
            cursor.execute("SELECT id, name FROM items LIMIT 3")
            for row in cursor.fetchall():
                print(f"DEBUG: Sample item - ID: {row['id']}, Name: {row['name']}", file=sys.stderr)
        
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
            
            loaned_quantities = {row['item_id']: row['loaned_quantity'] for row in cursor.fetchall()}
            
            # סגירת החיבור לבסיס הנתונים
            cursor.close()
            conn.close()
            cursor = None
            conn = None
            
            # המרת התוצאה לפורמט JSON
            items_json = []
            for item in items:
                item_id = item['id']
                total_quantity = item['quantity']
                loaned_quantity = loaned_quantities.get(item_id, 0)
                available_quantity = max(0, total_quantity - loaned_quantity)
                
                available_from_db = item['available'] if item['available'] is not None else total_quantity
                
                item_dict = {
                    'id': item_id,
                    'name': item['name'],
                    'category': item['category'],
                    'quantity': total_quantity,
                    'available_quantity': available_quantity,
                    'loaned_quantity': loaned_quantity,
                    'notes': item['notes'] or '',
                    'is_available': item['is_available'],
                    'category_original': item['category_original'] or '',
                    'order_notes': item['order_notes'] or '',
                    'ordered': item['ordered'] if item['ordered'] is not None else False,
                    'checked_out': item['checked_out'] if item['checked_out'] is not None else False,
                    'checked': item['checked'] if item['checked'] is not None else False,
                    'checkout_notes': item['checkout_notes'] or '',
                    'returned': item['returned'] if item['returned'] is not None else False,
                    'return_notes': item['return_notes'] or '',
                    'price_per_unit': float(item['price_per_unit']) if item['price_per_unit'] is not None else 0.0,
                    'total_price': float(item['total_price']) if item['total_price'] is not None else 0.0,
                    'unnnamed_11': item['unnnamed_11'] or '',
                    'director': item['director'] or '',
                    'producer': item['producer'] or '',
                    'photographer': item['photographer'] if item['photographer'] is not None else '',
                    'available': available_from_db
                }
                items_json.append(item_dict)
            
            # החזרת התוצאה כ-JSON
            print(json.dumps(items_json, ensure_ascii=False))
        else:
            # No items found
            print("[]")
            
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
