"""
סקריפט זה מחזיר את כל ההשאלות כ-JSON.
משמש את ה-API של React לקבלת נתוני השאלות.
"""

import sys
import json
import os
from datetime import datetime

# הוספת תיקיית הפרויקט הראשית לנתיב החיפוש כדי לייבא מודולים
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# ייבוא פונקציות מבסיס הנתונים
from database import get_db_connection

def main():
    """פונקציה ראשית שמחזירה את כל ההשאלות כ-JSON"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # שליפת כל ההשאלות עם פרטי הפריטים
        cur.execute('''
            SELECT 
                l.id, i.name, i.category, l.student_name, l.student_id, l.quantity,
                l.checkout_date, l.due_date, l.return_date, l.user_id, 
                l.checkout_notes, l.loan_notes, l.return_notes,
                l.director, l.producer, l.photographer, l.price_per_unit, l.total_price
            FROM loans l
            JOIN items i ON l.item_id = i.id
            ORDER BY 
                CASE WHEN l.return_date IS NULL THEN 0 ELSE 1 END,
                l.due_date ASC
        ''')
        
        loans = cur.fetchall()
        cur.close()
        conn.close()
        
        # המרת התוצאה לפורמט JSON המתאים לריאקט
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
                'id': loan[0],                  # מזהה השאלה
                'item_name': loan[1],           # שם פריט
                'category': loan[2],            # קטגוריה
                'student_name': loan[3],        # שם סטודנט
                'student_id': loan[4],          # ת.ז. סטודנט
                'quantity': loan[5],            # כמות
                'checkout_date': checkout_date, # תאריך השאלה
                'due_date': due_date,           # תאריך החזרה מתוכנן
                'return_date': return_date,     # תאריך החזרה בפועל
                'user_id': loan[9],             # מזהה המשתמש שרשם את ההשאלה
                'checkout_notes': loan[10],     # הערות בעת השאלה
                'loan_notes': loan[11],         # הערות כלליות להשאלה
                'return_notes': loan[12],       # הערות בעת החזרה
                'status': status,               # סטטוס: מוחזר/פעיל/באיחור
                'director': loan[13],           # במאי
                'producer': loan[14],           # מפיק
                'photographer': loan[15],       # צלם
                'price_per_unit': loan[16],     # מחיר ליחידה
                'total_price': loan[17]         # מחיר כולל
            }
            loans_json.append(loan_dict)
        
        # החזרת התוצאה כ-JSON
        print(json.dumps(loans_json, ensure_ascii=False))
        
    except Exception as e:
        # במקרה של שגיאה, החזרת הודעת שגיאה
        error_response = {
            'error': True,
            'message': str(e)
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()