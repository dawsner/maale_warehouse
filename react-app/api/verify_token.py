"""
סקריפט זה מאמת ומפענח את טוקן ה-JWT.
משמש לאימות זהות המשתמש בצד השרת.
"""

import sys
import json
import os
import jwt
from datetime import datetime

# הוספת תיקיית הפרויקט הראשית לנתיב החיפוש
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# הוספת תיקיית ה-API לנתיב החיפוש
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from auth_api import verify_token_api

# מפתח סודי לאימות טוקן JWT - חייב להיות זהה למפתח בקובץ login.py
SECRET_KEY = "your-secret-key-cinema-equipment-management"

def main():
    """פונקציה ראשית לאימות טוקן JWT"""
    try:
        # קריאת נתוני הקלט מה-JSON שנשלח לסקריפט
        input_data = json.loads(sys.stdin.read())
        
        # קבלת הטוקן מהקלט
        token = input_data.get('token')
        
        if not token:
            raise ValueError("לא התקבל טוקן")
        
        try:
            # פענוח הטוקן ואימות תקינותו
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            
            # בדיקה שהטוקן עדיין בתוקף (בדיקה נוספת מעבר לבדיקה האוטומטית של jwt)
            exp_timestamp = payload.get('exp')
            if not exp_timestamp:
                raise jwt.InvalidTokenError("טוקן ללא תאריך תפוגה")
                
            exp_datetime = datetime.fromtimestamp(exp_timestamp)
            if exp_datetime < datetime.utcnow():
                raise jwt.ExpiredSignatureError("תוקף הטוקן פג")
            
            # אימות קיום המשתמש במערכת
            user = verify_token_api(payload.get('id'))
            if not user:
                raise jwt.InvalidTokenError("המשתמש אינו קיים במערכת")
                
            # אם הגענו לכאן, הטוקן תקין ובתוקף
            response = {
                'success': True,
                'id': payload.get('id'),
                'username': payload.get('username'),
                'role': payload.get('role'),
                'email': payload.get('email'),
                'full_name': payload.get('full_name'),
                'message': 'אימות הצליח'
            }
                
        except jwt.ExpiredSignatureError:
            # טוקן פג תוקף
            response = {
                'success': False,
                'message': 'טוקן פג תוקף, נא להתחבר מחדש'
            }
        except jwt.InvalidTokenError:
            # טוקן לא תקין
            response = {
                'success': False,
                'message': 'טוקן לא תקין, נא להתחבר מחדש'
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
            'message': f"שגיאה באימות טוקן: {str(e)}"
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()