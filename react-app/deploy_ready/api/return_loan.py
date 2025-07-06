"""
סקריפט זה מטפל בהחזרת פריט שהושאל.
משמש את ה-API של React לעדכון החזרות.
"""

import sys
import json
import os

# הוספת תיקיית הפרויקט הראשית לנתיב החיפוש
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# ייבוא פונקציות מבסיס הנתונים
from database import return_loan

def main():
    """פונקציה ראשית שמטפלת בהחזרת פריט שהושאל"""
    try:
        # קריאת נתוני הקלט מה-JSON שנשלח לסקריפט
        input_data = json.loads(sys.stdin.read())
        
        # חילוץ מזהה ההשאלה והערות להחזרה מהקלט
        loan_id = input_data.get('loanId')
        return_notes = input_data.get('returnNotes', '')
        
        # בדיקות תקינות בסיסיות
        if not loan_id:
            raise ValueError("מזהה השאלה הוא שדה חובה")
        
        # ביצוע החזרה
        success = return_loan(loan_id, return_notes)
        
        if success:
            # החזרת תוצאה חיובית
            response = {
                'success': True,
                'loan_id': loan_id,
                'message': f"הפריט הוחזר בהצלחה"
            }
        else:
            # במקרה שההשאלה לא נמצאה או כבר הוחזרה
            response = {
                'success': False,
                'message': f"ההשאלה עם מזהה {loan_id} לא נמצאה או שהפריט כבר הוחזר"
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
            'message': f"שגיאה בהחזרת פריט: {str(e)}"
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()