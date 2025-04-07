#!/usr/bin/env python3
"""
סקריפט זה מחזיר את כל ההשאלות כ-JSON.
משמש את ה-API של React לקבלת נתוני השאלות.
"""

import json
import sys
import psycopg2
from datetime import datetime
sys.path.append(".")  # מוסיף את התיקיה הנוכחית לנתיב החיפוש של מודולים
from database import get_db_connection

def main():
    """פונקציה ראשית שמחזירה את כל ההשאלות כ-JSON"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # שליפת כל ההשאלות עם שם הפריט
        cur.execute("""
            SELECT 
                l.id, 
                l.item_id, 
                i.name AS item_name, 
                l.student_name, 
                l.student_id, 
                l.quantity, 
                l.loan_date, 
                l.due_date, 
                l.return_date, 
                l.user_id,
                l.loan_notes,
                l.checkout_notes,
                l.return_notes,
                l.director,
                l.producer,
                l.photographer,
                l.price_per_unit,
                l.total_price
            FROM loans l
            JOIN inventory i ON l.item_id = i.id
            ORDER BY l.loan_date DESC
        """)
        
        loans = cur.fetchall()
        cur.close()
        conn.close()
        
        # המרת התוצאות למבנה נתונים מתאים ל-JSON
        loans_data = []
        for loan in loans:
            # המרת התאריכים למחרוזות
            loan_date = loan[6].isoformat() if loan[6] else None
            due_date = loan[7].isoformat() if loan[7] else None
            return_date = loan[8].isoformat() if loan[8] else None
            
            loans_data.append({
                "id": loan[0],
                "item_id": loan[1],
                "item_name": loan[2],
                "student_name": loan[3],
                "student_id": loan[4],
                "quantity": loan[5],
                "loan_date": loan_date,
                "due_date": due_date,
                "return_date": return_date,
                "user_id": loan[9],
                "loan_notes": loan[10],
                "checkout_notes": loan[11],
                "return_notes": loan[12],
                "director": loan[13],
                "producer": loan[14],
                "photographer": loan[15],
                "price_per_unit": float(loan[16]) if loan[16] else 0,
                "total_price": float(loan[17]) if loan[17] else 0
            })
        
        # החזרת התוצאות כ-JSON
        print(json.dumps(loans_data, ensure_ascii=False))
        
    except Exception as e:
        error_response = {"error": f"שגיאה בקבלת נתוני השאלות: {str(e)}"}
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()
