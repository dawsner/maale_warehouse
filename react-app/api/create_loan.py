#!/usr/bin/env python3
"""
סקריפט זה יוצר השאלה חדשה מנתונים שהתקבלו כ-JSON.
משמש את ה-API של React ליצירת השאלות חדשות.
"""

import json
import sys
from datetime import datetime
sys.path.append(".")  # מוסיף את התיקיה הנוכחית לנתיב החיפוש של מודולים
from database import create_loan, get_loan_details

def main():
    """פונקציה ראשית שיוצרת השאלה חדשה מקלט JSON"""
    try:
        # קריאת הנתונים מה-stdin
        input_data = json.loads(sys.stdin.read())
        
        # חילוץ השדות הדרושים
        item_id = input_data.get('itemId')
        student_name = input_data.get('studentName')
        student_id = input_data.get('studentId')
        quantity = input_data.get('quantity', 1)
        due_date_str = input_data.get('dueDate')
        notes = input_data.get('notes', '')
        user_id = input_data.get('userId')
        
        # פרטי הפקה
        director = input_data.get('director', '')
        producer = input_data.get('producer', '')
        photographer = input_data.get('photographer', '')
        price_per_unit = input_data.get('pricePerUnit', 0)
        total_price = input_data.get('totalPrice', 0)
        
        # המרת תאריך יעד מחרוזת לאובייקט תאריך
        due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00')) if due_date_str else None
        
        # בדיקות תקינות
        if not all([item_id, student_name, student_id, quantity, due_date]):
            raise ValueError("חסרים נתונים הכרחיים ליצירת השאלה")
        
        # יצירת ההשאלה במסד הנתונים
        loan_id = create_loan(
            item_id=item_id,
            student_name=student_name,
            student_id=student_id,
            quantity=quantity,
            due_date=due_date,
            user_id=user_id,
            loan_notes=notes,
            director=director,
            producer=producer,
            photographer=photographer,
            price_per_unit=price_per_unit,
            total_price=total_price
        )
        
        # קבלת פרטי ההשאלה שנוצרה
        loan_details = get_loan_details(loan_id)
        
        # בניית אובייקט התשובה
        response = {
            "id": loan_id,
            "message": "ההשאלה נוצרה בהצלחה",
            "loan": loan_details
        }
        
        # החזרת התשובה כ-JSON
        print(json.dumps(response, ensure_ascii=False))
        
    except ValueError as ve:
        error_response = {"error": f"שגיאת תקינות: {str(ve)}"}
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)
    except Exception as e:
        error_response = {"error": f"שגיאה ביצירת השאלה: {str(e)}"}
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()
