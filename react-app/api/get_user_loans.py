"""
סקריפט זה מחזיר את כל ההשאלות של משתמש מסוים כ-JSON.
משמש את ה-API של React לקבלת נתוני השאלות של סטודנט.
"""

import sys
import json
import os
from datetime import datetime

# הוספת תיקיית הפרויקט הראשית לנתיב החיפוש
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# ייבוא פונקציות מבסיס הנתונים
from database import get_db_connection

def main():
    """פונקציה ראשית שמחזירה את כל ההשאלות של משתמש מסוים כ-JSON"""
    try:
        # קריאת נתוני הקלט מה-JSON שנשלח לסקריפט
        input_data = json.loads(sys.stdin.read())
        
        # חילוץ מזהה המשתמש מהקלט
        user_id = input_data.get('userId')
        
        # בדיקות תקינות בסיסיות
        if not user_id:
            raise ValueError("מזהה משתמש הוא שדה חובה")
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # שליפת כל ההשאלות של המשתמש עם פרטי הפריטים
        cur.execute('''
            SELECT 
                l.id, i.name, i.category, l.student_name, l.student_id, l.quantity,
                l.checkout_date, l.due_date, l.return_date, l.user_id, 
                l.checkout_notes, l.loan_notes, l.return_notes,
                l.director, l.producer, l.photographer, l.price_per_unit, l.total_price
            FROM loans l
            JOIN items i ON l.item_id = i.id
            WHERE l.user_id = %s
            ORDER BY 
                CASE WHEN l.return_date IS NULL THEN 0 ELSE 1 END,
                l.due_date ASC
        ''', (user_id,))
        
        loans = cur.fetchall()
        cur.close()
        conn.close()
        
        # המרת התוצאה לפורמט JSON
        loans_json = []
        for loan in loans:
            # המרת תאריכים לפורמט מתאים
            checkout_date = loan[6].strftime('%Y-%m-%d %H:%M:%S') if loan[6] else None
            due_date = loan[7].strftime('%Y-%m-%d %H:%M:%S') if loan[7] else None
            return_date = loan[8].strftime('%Y-%m-%d %H:%M:%S') if loan[8] else None
            
            # חישוב סטטוס ההשאלה
            status = 'returned' if loan[8] else ('overdue' if loan[7] < datetime.now() else 'active')
            
            # המרה לדיקט
            loan_dict = {
                'id': loan[0],
                'item_name': loan[1],
                'category': loan[2],
                'student_name': loan[3],
                'student_id': loan[4],
                'quantity': loan[5],
                'checkout_date': checkout_date,
                'due_date': due_date,
                'return_date': return_date,
                'user_id': loan[9],
                'checkout_notes': loan[10],
                'loan_notes': loan[11],
                'return_notes': loan[12],
                'status': status,
                'director': loan[13],
                'producer': loan[14],
                'photographer': loan[15],
                'price_per_unit': loan[16],
                'total_price': loan[17]
            }
            loans_json.append(loan_dict)
        
        # החזרת התוצאה כ-JSON
        print(json.dumps(loans_json, ensure_ascii=False))
        
    except ValueError as e:
        # שגיאות תקינות קלט
        error_response = {
            'error': True,
            'message': str(e)
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)
        
    except Exception as e:
        # שגיאות כלליות
        error_response = {
            'error': True,
            'message': str(e)
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()