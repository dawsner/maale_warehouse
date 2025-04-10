"""
סקריפט זה מספק נתונים לדף הדשבורד של מנהל המחסן.
כולל סטטיסטיקות ונתונים על מצב המלאי, השאלות פעילות, והתראות.
"""
import json
import datetime
import os
import sys

# הוספת נתיב לספריית האב כדי לאפשר ייבוא מודולים
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from database import get_db_connection
from utils import get_israel_time


def get_inventory_summary():
    """מחזיר סיכום של מצב המלאי - כמות פריטים לפי קטגוריה, זמינות וכו'"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # נתוני מלאי כללי
    cursor.execute("""
        SELECT COUNT(*) AS total_items,
               SUM(quantity) AS total_quantity,
               COUNT(DISTINCT category) AS category_count
        FROM inventory
    """)
    overview = cursor.fetchone()
    if overview is None:
        overview = (0, 0, 0)
    
    # נתוני זמינות
    cursor.execute("""
        SELECT 
            SUM(CASE WHEN is_available = TRUE THEN quantity ELSE 0 END) AS available_items,
            SUM(CASE WHEN is_available = FALSE THEN quantity ELSE 0 END) AS unavailable_items
        FROM inventory
    """)
    availability = cursor.fetchone()
    if availability is None:
        availability = (0, 0)
    
    # נתונים לפי קטגוריה
    cursor.execute("""
        SELECT category, 
               COUNT(*) AS item_count, 
               SUM(quantity) AS total_quantity,
               SUM(CASE WHEN is_available = TRUE THEN quantity ELSE 0 END) AS available_quantity
        FROM inventory
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
    
    # פריטים בהשאלה
    cursor.execute("""
        SELECT COUNT(*) AS total_loans
        FROM loans
        WHERE return_date IS NULL
    """)
    loaned_items_result = cursor.fetchone()
    if loaned_items_result is not None and loaned_items_result[0] is not None:
        loaned_items = loaned_items_result[0]
    else:
        loaned_items = 0
    
    cursor.close()
    conn.close()
    
    available = availability[0] if availability[0] is not None else 0
    unavailable = availability[1] if availability[1] is not None else 0
    
    return {
        "overview": {
            "total_items": overview[0] if overview[0] is not None else 0,
            "total_quantity": overview[1] if overview[1] is not None else 0,
            "category_count": overview[2] if overview[2] is not None else 0,
            "loaned_items": loaned_items
        },
        "availability": {
            "available": available,
            "unavailable": unavailable
        },
        "categories": categories
    }


def get_active_loans():
    """מחזיר רשימה של השאלות פעילות"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT l.id, i.name, i.category, l.student_name, l.quantity, l.loan_date, l.due_date
        FROM loans l
        JOIN inventory i ON l.item_id = i.id
        WHERE l.return_date IS NULL
        ORDER BY l.due_date ASC
        LIMIT 10
    """)
    
    loans = []
    for row in cursor.fetchall():
        loans.append({
            "id": row[0],
            "item_name": row[1],
            "category": row[2],
            "student_name": row[3],
            "quantity": row[4],
            "loan_date": row[5].strftime("%Y-%m-%d") if row[5] else None,
            "due_date": row[6].strftime("%Y-%m-%d") if row[6] else None
        })
    
    cursor.close()
    conn.close()
    
    return loans


def get_upcoming_reservations():
    """מחזיר רשימה של הזמנות צפויות בקרוב"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    current_date = get_israel_time().date()
    
    cursor.execute("""
        SELECT r.id, i.name, i.category, r.student_name, r.quantity, r.start_date, r.end_date, r.status
        FROM reservations r
        JOIN inventory i ON r.item_id = i.id
        WHERE r.start_date >= %s AND r.status IN ('pending', 'approved')
        ORDER BY r.start_date ASC
        LIMIT 10
    """, (current_date,))
    
    reservations = []
    for row in cursor.fetchall():
        reservations.append({
            "id": row[0],
            "item_name": row[1],
            "category": row[2],
            "student_name": row[3],
            "quantity": row[4],
            "start_date": row[5].strftime("%Y-%m-%d") if row[5] else None,
            "end_date": row[6].strftime("%Y-%m-%d") if row[6] else None,
            "status": row[7]
        })
    
    cursor.close()
    conn.close()
    
    return reservations


def get_overdue_loans():
    """מחזיר רשימה של השאלות שחלף מועד החזרתן"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    current_date = get_israel_time().date()
    
    cursor.execute("""
        SELECT l.id, i.name, i.category, l.student_name, l.quantity, l.loan_date, l.due_date,
               (CURRENT_DATE - l.due_date) AS days_overdue
        FROM loans l
        JOIN inventory i ON l.item_id = i.id
        WHERE l.return_date IS NULL AND l.due_date < %s
        ORDER BY l.due_date ASC
    """, (current_date,))
    
    overdue = []
    for row in cursor.fetchall():
        overdue.append({
            "id": row[0],
            "item_name": row[1],
            "category": row[2],
            "student_name": row[3],
            "quantity": row[4],
            "loan_date": row[5].strftime("%Y-%m-%d") if row[5] else None,
            "due_date": row[6].strftime("%Y-%m-%d") if row[6] else None,
            "days_overdue": row[7]
        })
    
    cursor.close()
    conn.close()
    
    return overdue


def get_popular_items():
    """מחזיר רשימה של הפריטים הפופולריים ביותר (המושאלים הכי הרבה)"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT i.id, i.name, i.category, COUNT(l.id) AS loan_count
        FROM inventory i
        JOIN loans l ON i.id = l.item_id
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
    
    cursor.close()
    conn.close()
    
    return popular_items


def get_low_stock_items():
    """מחזיר רשימה של פריטים שכמותם במלאי נמוכה (פחות מ-20% מהכמות המקורית)"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # פריטים עם פחות מ-20% מהכמות המקורית
    cursor.execute("""
        SELECT id, name, category, quantity, available_quantity,
               CASE 
                   WHEN quantity > 0 THEN ROUND((available_quantity::float / quantity) * 100)
                   ELSE 0 
               END AS percent_available
        FROM inventory
        WHERE quantity > 0 
              AND (available_quantity::float / quantity) < 0.2
              AND is_available = TRUE
        ORDER BY percent_available ASC
        LIMIT 10
    """)
    
    low_stock = []
    for row in cursor.fetchall():
        low_stock.append({
            "id": row[0],
            "name": row[1],
            "category": row[2],
            "total_quantity": row[3],
            "available_quantity": row[4],
            "percent_available": row[5]
        })
    
    cursor.close()
    conn.close()
    
    return low_stock


def main():
    """פונקציה ראשית המאחדת את כל נתוני הדשבורד"""
    try:
        dashboard_data = {
            "inventory_summary": get_inventory_summary(),
            "active_loans": get_active_loans(),
            "upcoming_reservations": get_upcoming_reservations(),
            "overdue_loans": get_overdue_loans(),
            "popular_items": get_popular_items(),
            "low_stock_items": get_low_stock_items()
        }
        
        print(json.dumps(dashboard_data))
    except Exception as e:
        print(json.dumps({"error": str(e), "success": False}))


if __name__ == "__main__":
    main()