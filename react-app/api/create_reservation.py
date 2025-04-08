"""
סקריפט זה יוצר הזמנה חדשה מנתונים שהתקבלו כ-JSON.
משמש את ה-API של React ליצירת הזמנות חדשות.
"""

import json
import sys
from datetime import datetime
import traceback
from database import get_db_connection

def create_reservation(item_id, student_name, student_id, quantity, start_date, end_date, user_id, notes=""):
    """פונקציה שיוצרת הזמנה חדשה ומחזירה את תוצאת הפעולה"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # בדיקת זמינות הפריט בתאריכים המבוקשים
                cur.execute("""
                    SELECT i.quantity - COALESCE(
                        (SELECT SUM(r.quantity)
                         FROM reservations r
                         WHERE r.item_id = i.id
                         AND r.status IN ('approved', 'pending')
                         AND (
                             (r.start_date <= %s AND r.end_date >= %s)
                             OR (r.start_date <= %s AND r.end_date >= %s)
                             OR (r.start_date >= %s AND r.end_date <= %s)
                         )), 0) as available_quantity
                    FROM items i
                    WHERE i.id = %s AND i.is_available = true
                """, (end_date, start_date, end_date, start_date, start_date, end_date, item_id))
                
                result = cur.fetchone()
                available = result[0] if result else 0
                
                if available < quantity:
                    return {
                        "success": False, 
                        "message": f"אין מספיק פריטים זמינים בתאריכים המבוקשים. כמות זמינה: {available}"
                    }
                
                # יצירת ההזמנה
                cur.execute("""
                    INSERT INTO reservations 
                    (user_id, item_id, student_name, student_id, quantity, start_date, end_date, notes, status, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending', NOW())
                    RETURNING id
                """, (user_id, item_id, student_name, student_id, quantity, start_date, end_date, notes))
                
                result = cur.fetchone()
                reservation_id = result[0] if result else None
                if not reservation_id:
                    return {
                        "success": False,
                        "message": "שגיאה ביצירת ההזמנה"
                    }
                
                conn.commit()
                return {
                    "success": True, 
                    "message": "ההזמנה נוצרה בהצלחה",
                    "reservation_id": reservation_id
                }
    except Exception as e:
        print(f"Error creating reservation: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        raise

def main():
    """פונקציה ראשית שיוצרת הזמנה חדשה מקלט JSON"""
    try:
        # קריאת פרמטרים מ-stdin בפורמט JSON
        input_data = json.loads(sys.stdin.read())
        
        # חילוץ פרמטרים
        item_id = input_data.get('item_id')
        student_name = input_data.get('student_name')
        student_id = input_data.get('student_id')
        quantity = input_data.get('quantity')
        start_date_str = input_data.get('start_date')
        end_date_str = input_data.get('end_date')
        user_id = input_data.get('user_id')
        notes = input_data.get('notes', '')
        
        # בדיקת תקינות הפרמטרים
        if not all([item_id, student_name, student_id, quantity, start_date_str, end_date_str, user_id]):
            missing = []
            if not item_id: missing.append("item_id")
            if not student_name: missing.append("student_name")
            if not student_id: missing.append("student_id")
            if not quantity: missing.append("quantity")
            if not start_date_str: missing.append("start_date")
            if not end_date_str: missing.append("end_date")
            if not user_id: missing.append("user_id")
            
            raise ValueError(f"חסרים הפרמטרים הבאים: {', '.join(missing)}")
        
        # המרת תאריכים לפורמט דיסיימל
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
        
        # יצירת ההזמנה
        result = create_reservation(
            item_id=item_id,
            student_name=student_name,
            student_id=student_id,
            quantity=quantity,
            start_date=start_date,
            end_date=end_date,
            user_id=user_id,
            notes=notes
        )
        
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "message": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()