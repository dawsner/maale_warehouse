"""
סקריפט זה מאמת את תקפות טוקן JWT ומחזיר פרטי משתמש.
משמש לאימות התחברות בעת רענון הדף.
"""

import sys
import json
import os
import jwt
from datetime import datetime

# הוספת תיקיית הפרויקט הראשית לנתיב החיפוש
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# ייבוא פונקציות
from database import get_db_connection

# מפתח סודי לאימות טוקן JWT (זהה לזה בlogin.py)
SECRET_KEY = "your-secret-key-cinema-equipment-management"

def verify_token(token):
    """אימות טוקן JWT והחזרת פרטי משתמש"""
    try:
        # פענוח הטוקן
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        
        # בדיקת תוקף
        if datetime.utcnow().timestamp() > payload['exp']:
            return None
        
        # בדיקה שהמשתמש עדיין קיים במערכת
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, username, role, email, full_name, 
                           study_year, branch, status
                    FROM users 
                    WHERE id = %s AND status = 'active'
                """, (payload['id'],))
                
                user_data = cur.fetchone()
                
                if not user_data:
                    return None
                
                user_id, username, role, email, full_name, study_year, branch, status = user_data
                
                return {
                    'id': user_id,
                    'username': username,
                    'role': role,
                    'email': email,
                    'full_name': full_name,
                    'study_year': study_year,
                    'branch': branch,
                    'status': status
                }
                
    except jwt.ExpiredSignatureError:
        print("Token expired", file=sys.stderr)
        return None
    except jwt.InvalidTokenError:
        print("Invalid token", file=sys.stderr)
        return None
    except Exception as e:
        print(f"Token verification error: {str(e)}", file=sys.stderr)
        return None

def main():
    """פונקציה ראשית"""
    try:
        # קריאת הטוקן מהקלט
        input_data = json.loads(sys.stdin.read())
        token = input_data.get('token')
        
        if not token:
            response = {
                'success': False,
                'message': 'חסר טוקן לאימות'
            }
        else:
            user = verify_token(token)
            
            if user:
                response = {
                    'success': True,
                    'user': user
                }
            else:
                response = {
                    'success': False,
                    'message': 'טוקן לא תקף או פג תוקף'
                }
        
        print(json.dumps(response, ensure_ascii=False))
        
    except Exception as e:
        error_response = {
            'success': False,
            'message': f"שגיאה באימות הטוקן: {str(e)}"
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()