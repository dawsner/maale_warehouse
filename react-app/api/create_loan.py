"""
סקריפט זה יוצר השאלה חדשה מנתונים שהתקבלו כ-JSON.
משמש את ה-API של React ליצירת השאלות חדשות.
"""

import sys
import json
import os
from datetime import datetime

# הוספת תיקיית הפרויקט הראשית לנתיב החיפוש
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# ייבוא פונקציות מבסיס הנתונים
from database import create_loan

def main():
    """פונקציה ראשית שיוצרת השאלה חדשה מקלט JSON"""
    try:
        # קריאת נתוני הקלט מה-JSON שנשלח לסקריפט
        input_data = json.loads(sys.stdin.read())
        
        # חילוץ שדות חובה
        item_id = input_data.get('item_id')
        student_name = input_data.get('student_name')
        student_id = input_data.get('student_id')
        quantity = input_data.get('quantity')
        due_date_str = input_data.get('due_date')
        
        # בדיקות תקינות בסיסיות
        if not all([item_id, student_name, student_id, quantity, due_date_str]):
            raise ValueError("חסרים שדות חובה: מזהה פריט, שם סטודנט, ת.ז. סטודנט, כמות ותאריך החזרה הם שדות חובה")
        
        # המרת תאריך החזרה מתבנית ISO לאובייקט תאריך
        due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
        
        # שדות רשות
        user_id = input_data.get('user_id')
        loan_notes = input_data.get('loan_notes')
        checkout_notes = input_data.get('checkout_notes')
        director = input_data.get('director')
        producer = input_data.get('producer')
        photographer = input_data.get('photographer')
        price_per_unit = input_data.get('price_per_unit')
        total_price = input_data.get('total_price')
        
        # יצירת השאלה חדשה
        loan_id = create_loan(
            item_id=item_id,
            student_name=student_name,
            student_id=student_id,
            quantity=quantity,
            due_date=due_date,
            user_id=user_id,
            loan_notes=loan_notes,
            checkout_notes=checkout_notes,
            director=director,
            producer=producer,
            photographer=photographer,
            price_per_unit=price_per_unit,
            total_price=total_price
        )
        
        # החזרת תוצאה חיובית
        response = {
            'success': True,
            'loan_id': loan_id,
            'message': f"השאלה #{loan_id} נוצרה בהצלחה"
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
            'message': f"שגיאה ביצירת השאלה: {str(e)}"
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()