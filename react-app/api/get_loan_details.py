"""
סקריפט זה מחזיר את פרטי ההשאלה לפי מזהה.
משמש את ה-API של React לקבלת פרטי השאלה.
"""

import sys
import json
import os
from datetime import datetime

# הוספת תיקיית הפרויקט הראשית לנתיב החיפוש
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# ייבוא פונקציות מבסיס הנתונים
from database import get_loan_details

def main():
    """פונקציה ראשית שמחזירה את פרטי ההשאלה לפי מזהה"""
    try:
        # קריאת נתוני הקלט מה-JSON שנשלח לסקריפט
        input_data = json.loads(sys.stdin.read())
        
        # חילוץ מזהה ההשאלה מהקלט
        loan_id = input_data.get('loanId')
        
        # בדיקות תקינות בסיסיות
        if not loan_id:
            raise ValueError("מזהה השאלה הוא שדה חובה")
        
        # קבלת פרטי ההשאלה
        loan = get_loan_details(loan_id)
        
        if loan:
            # המרת תאריכים לפורמט מתאים לעבודה עם ג'אווהסקריפט
            checkout_date = loan['checkout_date'].strftime('%Y-%m-%d %H:%M:%S') if loan['checkout_date'] else None
            due_date = loan['due_date'].strftime('%Y-%m-%d %H:%M:%S') if loan['due_date'] else None
            return_date = loan['return_date'].strftime('%Y-%m-%d %H:%M:%S') if loan['return_date'] else None
            
            # חישוב סטטוס ההשאלה
            status = 'returned' if loan['return_date'] else ('overdue' if loan['due_date'] < datetime.now() else 'active')
            
            # יצירת אובייקט תשובה
            loan_json = {
                'id': loan['id'],
                'item_id': loan['item_id'],
                'item_name': loan['item_name'],
                'category': loan['category'],
                'student_name': loan['student_name'],
                'student_id': loan['student_id'],
                'quantity': loan['quantity'],
                'checkout_date': checkout_date,
                'due_date': due_date,
                'return_date': return_date,
                'user_id': loan['user_id'],
                'checkout_notes': loan['checkout_notes'],
                'loan_notes': loan['loan_notes'],
                'return_notes': loan['return_notes'],
                'status': status,
                'director': loan['director'],
                'producer': loan['producer'],
                'photographer': loan['photographer'],
                'price_per_unit': loan['price_per_unit'],
                'total_price': loan['total_price']
            }
            
            # החזרת תוצאה חיובית
            response = {
                'success': True,
                'loan': loan_json
            }
        else:
            # במקרה שההשאלה לא נמצאה
            response = {
                'success': False,
                'message': f"ההשאלה עם מזהה {loan_id} לא נמצאה"
            }
        
        print(json.dumps(response, ensure_ascii=False))
        
    except ValueError as e:
        # שגיאות תקינות קלט
        error_response = {
            'success': False,
            'message': str(e)
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)
        
    except Exception as e:
        # שגיאות כלליות
        error_response = {
            'success': False,
            'message': f"שגיאה בקבלת פרטי השאלה: {str(e)}"
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()