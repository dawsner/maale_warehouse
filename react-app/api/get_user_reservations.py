"""
סקריפט זה מחזיר את כל ההזמנות של משתמש מסוים כ-JSON.
משמש את ה-API של React לקבלת נתוני הזמנות של סטודנט.
"""

import json
import sys
import os
from datetime import datetime
import traceback
import psycopg2

# הוספת נתיב לתיקייה הראשית
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def get_db_connection():
    """יוצר חיבור למסד הנתונים"""
    DATABASE_URL = os.environ.get('DATABASE_URL')
    return psycopg2.connect(DATABASE_URL)

def get_user_reservations(user_id):
    """פונקציה שמחזירה את כל ההזמנות של משתמש מסוים"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT r.id, r.item_id, i.name as item_name, r.student_name, 
                   r.student_id, r.quantity, r.start_date, r.end_date,
                   r.status, r.notes, r.created_at
            FROM reservations r
            JOIN items i ON r.item_id = i.id
            WHERE r.user_id = %s
            ORDER BY 
                CASE 
                    WHEN r.status = 'pending' THEN 1
                    WHEN r.status = 'approved' THEN 2
                    ELSE 3 
                END,
                r.start_date
        """, (user_id,))
        
        reservations = []
        for row in cur.fetchall():
            reservation = {
                "id": row[0],
                "item_id": row[1],
                "item_name": row[2],
                "student_name": row[3],
                "student_id": row[4],
                "quantity": row[5],
                "start_date": row[6].strftime("%Y-%m-%d") if row[6] else None,
                "end_date": row[7].strftime("%Y-%m-%d") if row[7] else None,
                "status": row[8] or "pending",
                "notes": row[9] or "",
                "created_at": row[10].strftime("%Y-%m-%d %H:%M:%S") if row[10] else None
            }
            reservations.append(reservation)
        
        cur.close()
        conn.close()
        return reservations
    except Exception as e:
        print(f"Error getting user reservations: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        raise

def main():
    """פונקציה ראשית שמחזירה את כל ההזמנות של משתמש מסוים כ-JSON"""
    try:
        # קריאת פרמטרים מ-stdin בפורמט JSON
        input_data = json.loads(sys.stdin.read())
        user_id = input_data.get('userId')
        
        if not user_id:
            raise ValueError("נדרש מזהה משתמש")
        
        reservations = get_user_reservations(user_id)
        print(json.dumps(reservations))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()