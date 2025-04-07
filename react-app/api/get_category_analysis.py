"""
סקריפט זה מחזיר ניתוח של השאלות לפי קטגוריות ציוד.
"""

import json
import sys
import os

# הוסף את תיקיית השורש של הפרויקט ל-path כדי שנוכל לייבא את database.py
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(project_root)

from database import get_db_connection

def get_category_analysis():
    """מחזיר נתונים על השימוש בציוד לפי קטגוריות"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # שאילתה לקבלת נתוני השימוש לפי קטגוריות
        cursor.execute("""
            SELECT 
                i.category,
                COUNT(l.id) AS loan_count,
                COUNT(DISTINCT student_id) AS unique_students,
                COALESCE(AVG(EXTRACT(EPOCH FROM (COALESCE(l.return_date, CURRENT_TIMESTAMP) - l.checkout_date)) / 86400), 0) AS avg_loan_days
            FROM items i
            LEFT JOIN loans l ON i.id = l.item_id
            GROUP BY i.category
            ORDER BY loan_count DESC
        """)
        
        categories = []
        for row in cursor.fetchall():
            categories.append({
                'category': row[0] or 'ללא קטגוריה',
                'loan_count': row[1],
                'unique_students': row[2],
                'avg_loan_days': round(row[3], 1) if row[3] is not None else 0
            })
        
        # מקבל את כמות הפריטים בכל קטגוריה
        cursor.execute("""
            SELECT 
                category,
                COUNT(*) AS items_count,
                SUM(quantity) AS total_quantity
            FROM items
            GROUP BY category
            ORDER BY total_quantity DESC
        """)
        
        inventory_by_category = []
        for row in cursor.fetchall():
            inventory_by_category.append({
                'category': row[0] or 'ללא קטגוריה',
                'items_count': row[1],
                'total_quantity': row[2]
            })
        
        # חישוב יחס השאלות לכמות פריטים לפי קטגוריה
        category_efficiency = []
        
        # מילון עזר לאחסון כמויות הקטגוריות
        quantities = {item['category']: item['total_quantity'] for item in inventory_by_category}
        
        for category in categories:
            category_name = category['category']
            total_quantity = quantities.get(category_name, 0)
            
            if total_quantity > 0 and category['loan_count'] > 0:
                efficiency = category['loan_count'] / total_quantity
            else:
                efficiency = 0
                
            category_efficiency.append({
                'category': category_name,
                'loan_count': category['loan_count'],
                'total_quantity': total_quantity,
                'efficiency': round(efficiency, 2)
            })
        
        # מיון לפי יעילות בסדר יורד
        category_efficiency.sort(key=lambda x: x['efficiency'], reverse=True)
        
        conn.close()
        
        return {
            'categories': categories,
            'inventory_by_category': inventory_by_category,
            'category_efficiency': category_efficiency
        }
    except Exception as e:
        print(f"שגיאה בקבלת ניתוח קטגוריות: {str(e)}", file=sys.stderr)
        return {"error": str(e)}

def main():
    """פונקציה ראשית"""
    result = get_category_analysis()
    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    main()