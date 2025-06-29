"""
סקריפט זה מטפל בתהליך ההתחברות למערכת.
מקבל שם משתמש וסיסמה, ומחזיר פרטי משתמש אם האימות הצליח.
"""

import sys
import json
import os
import jwt
from datetime import datetime, timedelta

# הוספת תיקיית הפרויקט הראשית לנתיב החיפוש
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# ייבוא פונקציות אימות מהמודול החדש המותאם ל-API
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from auth_api import login_api

# מפתח סודי ליצירת טוקן JWT
SECRET_KEY = "your-secret-key-cinema-equipment-management"  # במערכת אמיתית יש לשמור זאת בקובץ .env
JWT_EXPIRATION = 24  # תוקף הטוקן בשעות

def main():
    """פונקציה ראשית שמטפלת בתהליך ההתחברות"""
    try:
        # קריאת נתוני הקלט מה-JSON שנשלח לסקריפט
        input_data = json.loads(sys.stdin.read())
        
        # חילוץ שם משתמש וסיסמה מהקלט
        username = input_data.get('username')
        password = input_data.get('password')
        
        # בדיקות תקינות בסיסיות
        if not username or not password:
            raise ValueError("שם משתמש וסיסמה הם שדות חובה")
        
        # ניסיון להתחבר עם הפונקציה החדשה המותאמת ל-API
        user = login_api(username, password)
        
        # אם ההתחברות הצליחה, יצירת טוקן JWT
        if user:
            # מידע שיוכנס לטוקן
            payload = {
                'id': user.id,
                'username': user.username,
                'role': user.role,
                'email': user.email,
                'full_name': user.full_name,
                'study_year': user.study_year,
                'branch': user.branch,
                'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION)
            }
            
            # יצירת הטוקן
            token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
            
            # החזרת תשובה חיובית עם פרטי המשתמש והטוקן
            response = {
                'success': True,
                'id': user.id,
                'username': user.username,
                'role': user.role,
                'email': user.email,
                'full_name': user.full_name,
                'study_year': user.study_year,
                'branch': user.branch,
                'token': token,
                'message': 'התחברות הצליחה'
            }
        else:
            # במקרה של שם משתמש או סיסמה שגויים
            response = {
                'success': False,
                'message': 'שם משתמש או סיסמה שגויים'
            }
        
        # החזרת התוצאה כ-JSON
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
            'message': f"שגיאה בהתחברות: {str(e)}"
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()