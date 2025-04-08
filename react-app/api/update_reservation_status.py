"""
סקריפט זה משנה את הסטטוס של הזמנה קיימת.
משמש את ה-API של React לעדכון סטטוס הזמנות.
"""

import json
import sys
import traceback
from database import get_db_connection

def update_reservation_status(reservation_id, status):
    """פונקציה המשנה את סטטוס ההזמנה"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # וידוא שהסטטוס תקין
                if status not in ['pending', 'approved', 'rejected', 'completed', 'cancelled']:
                    return {"success": False, "message": "סטטוס לא חוקי"}
                
                # עדכון הסטטוס
                cur.execute("""
                    UPDATE reservations 
                    SET status = %s
                    WHERE id = %s
                    RETURNING id
                """, (status, reservation_id))
                
                if cur.rowcount == 0:
                    return {"success": False, "message": "הזמנה לא נמצאה"}
                
                conn.commit()
                return {"success": True, "message": "סטטוס ההזמנה עודכן בהצלחה"}
    except Exception as e:
        print(f"Error updating reservation status: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        raise

def main():
    """פונקציה ראשית המשנה את סטטוס ההזמנה מפרמטרים בפורמט JSON"""
    try:
        # קריאת פרמטרים מ-stdin בפורמט JSON
        input_data = json.loads(sys.stdin.read())
        
        # חילוץ פרמטרים
        reservation_id = input_data.get('reservationId')
        status = input_data.get('status')
        
        # בדיקת תקינות הפרמטרים
        if not reservation_id:
            raise ValueError("נדרש מזהה הזמנה")
        
        if not status:
            raise ValueError("נדרש סטטוס חדש")
        
        # עדכון הסטטוס
        result = update_reservation_status(reservation_id, status)
        
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "message": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()