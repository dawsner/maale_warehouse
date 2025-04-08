"""
סקריפט זה מחזיר את כל ההזמנות כ-JSON.
משמש את ה-API של React לקבלת נתוני הזמנות.
"""

import json
import sys
from datetime import datetime
import traceback
from database import get_db_connection

def get_reservations():
    """פונקציה שמחזירה את כל ההזמנות"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT r.id, r.item_id, i.name as item_name, r.student_name, 
                           r.student_id, r.quantity, r.start_date, r.end_date,
                           r.status, r.notes, r.created_at, r.user_id,
                           u.full_name as user_full_name
                    FROM reservations r
                    JOIN items i ON r.item_id = i.id
                    LEFT JOIN users u ON r.user_id = u.id
                    ORDER BY 
                        CASE 
                            WHEN r.status = 'pending' THEN 1
                            WHEN r.status = 'approved' THEN 2
                            ELSE 3 
                        END,
                        r.start_date
                """)
                
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
                        "created_at": row[10].strftime("%Y-%m-%d %H:%M:%S") if row[10] else None,
                        "user_id": row[11],
                        "user_full_name": row[12]
                    }
                    reservations.append(reservation)
                
                return reservations
    except Exception as e:
        print(f"Error getting reservations: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        raise

def main():
    """פונקציה ראשית שמחזירה את כל ההזמנות כ-JSON"""
    try:
        reservations = get_reservations()
        print(json.dumps(reservations))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()