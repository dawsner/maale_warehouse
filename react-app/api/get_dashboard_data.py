"""
גרסה מותנה של get_dashboard_data עם ביצועים משופרים.
מבצע את כל השאילתות בחיבור אחד למניעת timeout.
"""
import json
import datetime
import os
import sys

# הוספת נתיב לספריית האב כדי לאפשר ייבוא מודולים
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from database import get_db_connection
from utils import get_israel_time


def get_all_dashboard_data():
    """מחזיר את כל נתוני הדשבורד בשאילתה אחת מותאמת"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # נתוני מלאי כללי
        cursor.execute("""
            SELECT COUNT(*) AS total_items,
                   SUM(quantity) AS total_quantity,
                   COUNT(DISTINCT category) AS category_count,
                   SUM(CASE WHEN is_available = TRUE THEN quantity ELSE 0 END) AS available_items,
                   SUM(CASE WHEN is_available = FALSE THEN quantity ELSE 0 END) AS unavailable_items
            FROM items
        """)
        overview_data = cursor.fetchone()
        if overview_data is None:
            overview_data = (0, 0, 0, 0, 0)
        
        # נתונים לפי קטגוריה
        cursor.execute("""
            SELECT category, 
                   COUNT(*) AS item_count, 
                   SUM(quantity) AS total_quantity,
                   SUM(available) AS available_quantity
            FROM items
            GROUP BY category
            ORDER BY total_quantity DESC
        """)
        categories = []
        for row in cursor.fetchall():
            categories.append({
                "name": row[0],
                "item_count": row[1],
                "total_quantity": row[2],
                "available_quantity": row[3]
            })
        
        # מספר השאלות פעילות
        cursor.execute("""
            SELECT COUNT(*) AS total_loans
            FROM loans
            WHERE return_date IS NULL
        """)
        loaned_items_result = cursor.fetchone()
        loaned_items = loaned_items_result[0] if loaned_items_result and loaned_items_result[0] else 0
        
        # השאלות פעילות (רק 10 האחרונות)
        cursor.execute("""
            SELECT l.id, l.student_name, l.student_id, i.name AS item_name, 
                   l.quantity, l.due_date, l.loan_date
            FROM loans l
            JOIN items i ON l.item_id = i.id
            WHERE l.return_date IS NULL
            ORDER BY l.loan_date DESC
            LIMIT 10
        """)
        active_loans = []
        for row in cursor.fetchall():
            active_loans.append({
                "id": row[0],
                "student_name": row[1],
                "student_id": row[2],
                "item_name": row[3],
                "quantity": row[4],
                "due_date": row[5].isoformat() if row[5] else None,
                "loan_date": row[6].isoformat() if row[6] else None
            })
        
        # השאלות באיחור
        current_time = get_israel_time()
        cursor.execute("""
            SELECT l.id, l.student_name, l.student_id, i.name AS item_name, 
                   l.quantity, l.due_date, l.loan_date
            FROM loans l
            JOIN items i ON l.item_id = i.id
            WHERE l.return_date IS NULL AND l.due_date < %s
            ORDER BY l.due_date ASC
        """, (current_time,))
        overdue_loans = []
        for row in cursor.fetchall():
            overdue_loans.append({
                "id": row[0],
                "student_name": row[1],
                "student_id": row[2],
                "item_name": row[3],
                "quantity": row[4],
                "due_date": row[5].isoformat() if row[5] else None,
                "loan_date": row[6].isoformat() if row[6] else None
            })
        
        # הזמנות קרובות (7 הימים הקרובים)
        future_date = current_time + datetime.timedelta(days=7)
        cursor.execute("""
            SELECT r.id, r.student_name, r.student_id, i.name AS item_name, 
                   r.quantity, r.start_date, r.end_date, r.status
            FROM reservations r
            JOIN items i ON r.item_id = i.id
            WHERE r.start_date BETWEEN %s AND %s
            ORDER BY r.start_date ASC
        """, (current_time, future_date))
        upcoming_reservations = []
        for row in cursor.fetchall():
            upcoming_reservations.append({
                "id": row[0],
                "student_name": row[1],
                "student_id": row[2],
                "item_name": row[3],
                "quantity": row[4],
                "start_date": row[5].isoformat() if row[5] else None,
                "end_date": row[6].isoformat() if row[6] else None,
                "status": row[7]
            })
        
        # פריטים פופולריים (הכי מושאלים)
        cursor.execute("""
            SELECT i.id, i.name, i.category, COUNT(l.id) AS loan_count
            FROM items i
            LEFT JOIN loans l ON i.id = l.item_id
            GROUP BY i.id, i.name, i.category
            ORDER BY loan_count DESC
            LIMIT 10
        """)
        popular_items = []
        for row in cursor.fetchall():
            popular_items.append({
                "id": row[0],
                "name": row[1],
                "category": row[2],
                "loan_count": row[3]
            })
        
        # פריטים עם מלאי נמוך
        cursor.execute("""
            SELECT i.id, i.name, i.category, i.quantity, i.available,
                   CASE WHEN i.quantity > 0 THEN (i.available::float / i.quantity * 100) ELSE 0 END AS percent_available
            FROM items i
            WHERE i.quantity > 0 AND (i.available::float / i.quantity * 100) < 20
            ORDER BY percent_available ASC
            LIMIT 10
        """)
        low_stock_items = []
        for row in cursor.fetchall():
            low_stock_items.append({
                "id": row[0],
                "name": row[1],
                "category": row[2],
                "total_quantity": row[3],
                "available_quantity": row[4],
                "percent_available": row[5]
            })
        
        # הכנת התוצאה הסופית
        dashboard_data = {
            "inventory_summary": {
                "overview": {
                    "total_items": overview_data[0] if overview_data[0] else 0,
                    "total_quantity": overview_data[1] if overview_data[1] else 0,
                    "category_count": overview_data[2] if overview_data[2] else 0,
                    "loaned_items": loaned_items
                },
                "availability": {
                    "available": overview_data[3] if overview_data[3] else 0,
                    "unavailable": overview_data[4] if overview_data[4] else 0
                },
                "categories": categories
            },
            "active_loans": active_loans,
            "upcoming_reservations": upcoming_reservations,
            "overdue_loans": overdue_loans,
            "popular_items": popular_items,
            "low_stock_items": low_stock_items
        }
        
        return dashboard_data
        
    except Exception as e:
        print(f"DEBUG: Database error: {e}", file=sys.stderr)
        raise e
    finally:
        cursor.close()
        conn.close()


def main():
    """פונקציה ראשית המחזירה את כל נתוני הדשבורד"""
    try:
        dashboard_data = get_all_dashboard_data()
        print(json.dumps(dashboard_data, ensure_ascii=False, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e), "success": False}), file=sys.stderr)


if __name__ == "__main__":
    main()