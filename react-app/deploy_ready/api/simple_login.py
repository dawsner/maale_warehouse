#!/usr/bin/env python3
import sys
import json
import os
import jwt
from datetime import datetime, timedelta

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from database import get_db_connection

SECRET_KEY = "your-secret-key-cinema-equipment-management"

def main():
    try:
        input_data = json.loads(sys.stdin.read())
        username = input_data.get('username')
        password = input_data.get('password')
        
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, username, password, role, email, full_name, 
                           study_year, branch, status
                    FROM users 
                    WHERE username = %s AND status = 'active'
                """, (username,))
                
                user_data = cur.fetchone()
                
                if user_data and user_data[2] == password:
                    user_id, db_username, _, role, email, full_name, study_year, branch, status = user_data
                    
                    # Create JWT token
                    payload = {
                        'id': user_id,
                        'username': db_username,
                        'role': role,
                        'email': email,
                        'full_name': full_name,
                        'study_year': study_year,
                        'branch': branch,
                        'exp': datetime.utcnow() + timedelta(hours=24)
                    }
                    
                    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
                    
                    response = {
                        'success': True,
                        'id': user_id,
                        'username': db_username,
                        'role': role,
                        'email': email,
                        'full_name': full_name,
                        'study_year': study_year,
                        'branch': branch,
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