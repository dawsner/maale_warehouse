"""
סקריפט זה מחזיר סטטיסטיקות על השימוש בציוד.
"""

import json
import sys
from database import get_db_connection

def get_equipment_usage_stats():
    """מחזיר נתונים על השימוש בציוד"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # שאילתה לקבלת נתוני השימוש בציוד - מוחזר כמה פעמים כל פריט הושאל
        cursor.execute("""
            SELECT 
                i.name AS item_name,
                i.category,
                COUNT(l.id) AS loan_count,
                COALESCE(SUM(CASE WHEN l.return_date IS NULL THEN 1 ELSE 0 END), 0) AS active_loans,
                COALESCE(SUM(CASE WHEN l.return_date IS NOT NULL THEN 1 ELSE 0 END), 0) AS completed_loans
            FROM items i
            LEFT JOIN loans l ON i.id = l.item_id
            GROUP BY i.id, i.name, i.category
            ORDER BY loan_count DESC
            LIMIT 10
        """)
        
        items = []
        for row in cursor.fetchall():
            items.append({
                'item_name': row[0],
                'category': row[1],
                'loan_count': row[2],
                'active_loans': row[3],
                'completed_loans': row[4]
            })
        
        # סטטיסטיקה נוספת - סה"כ השאלות פעילות
        cursor.execute("""
            SELECT COUNT(*) FROM loans WHERE return_date IS NULL
        """)
        active_loans_count = cursor.fetchone()[0]
        
        # סטטיסטיקה נוספת - סה"כ פריטים במלאי
        cursor.execute("""
            SELECT COUNT(*) FROM items
        """)
        total_items = cursor.fetchone()[0]
        
        # סטטיסטיקה נוספת - סה"כ השאלות שבוצעו
        cursor.execute("""
            SELECT COUNT(*) FROM loans
        """)
        total_loans = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            'most_borrowed_items': items,
            'summary': {
                'active_loans': active_loans_count,
                'total_items': total_items,
                'total_loans': total_loans
            }
        }
    except Exception as e:
        print(f"שגיאה בקבלת נתוני השימוש בציוד: {str(e)}", file=sys.stderr)
        return {"error": str(e)}

def main():
    """פונקציה ראשית"""
    result = get_equipment_usage_stats()
    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    main()