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

# ייבוא פונקציות אימות
from database import get_db_connection

# מפתח סודי ליצירת טוקן JWT
SECRET_KEY = "your-secret-key-cinema-equipment-management"
JWT_EXPIRATION = 24  # תוקף הטוקן בשעות

def verify_scrypt_password(password_hash, password):
    """
    בדיקת סיסמה בפורמט scrypt
    """
    try:
        if password_hash.startswith("scrypt:"):
            import hashlib
            import base64
            import hmac
            
            parts = password_hash.split("$")
            if len(parts) != 3:
                return False
                
            scrypt_params = parts[0].split(":")
            if len(scrypt_params) != 4:
                return False
                
            N = int(scrypt_params[1])
            r = int(scrypt_params[2])
            p = int(scrypt_params[3])
            salt = parts[1]
            stored_hash = parts[2]
            
            salt_padding = '=' * (4 - len(salt) % 4) % 4
            salt_bytes = base64.b64decode(salt + salt_padding)
            
            derived_key = hashlib.scrypt(
                password.encode('utf-8'),
                salt=salt_bytes,
                n=N,
                r=r,
                p=p,
                dklen=64
            )
            
            stored_hash_padding = '=' * (4 - len(stored_hash) % 4) % 4
            stored_hash_bytes = base64.b64decode(stored_hash + stored_hash_padding)
            
            return hmac.compare_digest(derived_key, stored_hash_bytes)
        return False
    except Exception as e:
        print(f"Error in scrypt verification: {e}", file=sys.stderr)
        return False

def login_user(username, password):
    """התחברות משתמש"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, username, password, role, email, full_name, 
                           study_year, branch, status, created_at, last_login
                    FROM users 
                    WHERE username = %s AND status = 'active'
                """, (username,))
                
                user_data = cur.fetchone()
                
                if not user_data:
                    return None
                
                user_id, db_username, password_hash, role, email, full_name, study_year, branch, status, created_at, last_login = user_data
                
                # בדיקת הסיסמה - פשוט ועובד
                password_valid = (password_hash == password)
                
                if not password_valid:
                    return None
                
                # עדכון זמן התחברות
                cur.execute("UPDATE users SET last_login = NOW() WHERE id = %s", (user_id,))
                conn.commit()
                
                return {
                    'id': user_id,
                    'username': db_username,
                    'role': role,
                    'email': email,
                    'full_name': full_name,
                    'study_year': study_year,
                    'branch': branch,
                    'status': status
                }
                
    except Exception as e:
        print(f"Database error: {str(e)}", file=sys.stderr)
        return None

def main():
    """פונקציה ראשית"""
    try:
        input_data = json.loads(sys.stdin.read())
        username = input_data.get('username')
        password = input_data.get('password')
        
        if not username or not password:
            raise ValueError("שם משתמש וסיסמה הם שדות חובה")
        
        user = login_user(username, password)
        
        if user:
            payload = {
                'id': user['id'],
                'username': user['username'],
                'role': user['role'],
                'email': user['email'],
                'full_name': user['full_name'],
                'study_year': user['study_year'],
                'branch': user['branch'],
                'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION)
            }
            
            token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
            
            response = {
                'success': True,
                'id': user['id'],
                'username': user['username'],
                'role': user['role'],
                'email': user['email'],
                'full_name': user['full_name'],
                'study_year': user['study_year'],
                'branch': user['branch'],
                'token': token,
                'message': 'התחברות הצליחה'
            }
        else:
            response = {
                'success': False,
                'message': 'שם משתמש או סיסמה שגויים'
            }
        
        print(json.dumps(response, ensure_ascii=False))
        
    except Exception as e:
        error_response = {
            'success': False,
            'message': f"שגיאה בהתחברות: {str(e)}"
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()