"""
סקריפט זה מטפל בתהליך ההרשמה למערכת.
מקבל פרטי משתמש ומנסה ליצור משתמש חדש במערכת.
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
from auth_api import register_api

# מפתח סודי ליצירת טוקן JWT - חייב להיות זהה למפתח בקובץ login.py
SECRET_KEY = "your-secret-key-cinema-equipment-management"
JWT_EXPIRATION = 24  # תוקף הטוקן בשעות

def main():
    """פונקציה ראשית שמטפלת בתהליך ההרשמה"""
    try:
        # קריאת נתוני הקלט מה-JSON שנשלח לסקריפט
        input_data = json.loads(sys.stdin.read())
        
        # חילוץ פרטי המשתמש מהקלט
        username = input_data.get('username')
        password = input_data.get('password')
        role = input_data.get('role', 'student')  # ברירת מחדל: סטודנט
        email = input_data.get('email')
        full_name = input_data.get('full_name')
        
        # בדיקות תקינות בסיסיות
        if not all([username, password, role, email, full_name]):
            raise ValueError("שם משתמש, סיסמה, תפקיד, כתובת דוא״ל ושם מלא הם שדות חובה")
        
        # ניסיון ליצור משתמש חדש עם הפונקציה החדשה המותאמת ל-API
        success, result = register_api(
            username=username,
            password=password,
            role=role,
            email=email,
            full_name=full_name
        )
        
        # אם ההרשמה הצליחה, יצירת טוקן JWT
        if success:
            user = result  # התוצאה מכילה את אובייקט המשתמש
            # מידע שיוכנס לטוקן
            payload = {
                'id': user.id,
                'username': user.username,
                'role': user.role,
                'email': user.email,
                'full_name': user.full_name,
                'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION)
            }
            
            # יצירת הטוקן
            token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
            
            # החזרת תשובה חיובית עם פרטי המשתמש והטוקן
            response = {
                'success': True,
                'id': str(user.id),  # המרה ל-string למניעת שגיאת LSP
                'username': user.username,
                'role': user.role,
                'email': user.email,
                'full_name': user.full_name,
                'token': token,
                'message': 'הרשמה הצליחה'
            }
        else:
            # במקרה של כישלון ביצירת המשתמש
            response = {
                'success': False,
                'message': result  # התוצאה מכילה את הודעת השגיאה
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
            'message': f"שגיאה בהרשמה: {str(e)}"
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()