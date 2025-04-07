#!/usr/bin/env python3
"""
סקריפט זה מטפל בתהליך ההתחברות למערכת.
מקבל שם משתמש וסיסמה, ומחזיר פרטי משתמש אם האימות הצליח.
"""

import json
import sys
import jwt
import os
import datetime
sys.path.append(".")  # מוסיף את התיקיה הנוכחית לנתיב החיפוש של מודולים
from auth import login as auth_login

# מפתח סודי ליצירת טוקן JWT (במערכת אמיתית יש לקחת מסביבת העבודה)
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "cinema_equipment_management_secret_key")

def main():
    """פונקציה ראשית שמטפלת בתהליך ההתחברות"""
    try:
        # קריאת הנתונים מה-stdin
        input_data = json.loads(sys.stdin.read())
        
        # חילוץ השדות הדרושים
        username = input_data.get('username')
        password = input_data.get('password')
        
        if not username or not password:
            raise ValueError("שם משתמש וסיסמה הם שדות חובה")
        
        # ניסיון להתחבר באמצעות פונקציית האימות
        user = auth_login(username, password)
        
        if not user:
            raise ValueError("שם משתמש או סיסמה שגויים")
        
        # יצירת טוקן JWT
        token_expiry = datetime.datetime.utcnow() + datetime.timedelta(days=1)  # תוקף ל-24 שעות
        token_payload = {
            "sub": user.id,
            "username": user.username,
            "role": user.role,
            "exp": token_expiry
        }
        token = jwt.encode(token_payload, SECRET_KEY, algorithm="HS256")
        
        # בניית אובייקט המשתמש שיוחזר לקליינט
        user_data = {
            "id": user.id,
            "username": user.username,
            "fullName": user.full_name,
            "email": user.email,
            "role": user.role
        }
        
        # בניית אובייקט התשובה
        response = {
            "user": user_data,
            "token": token,
            "expiresAt": token_expiry.isoformat()
        }
        
        # החזרת התשובה כ-JSON
        print(json.dumps(response, ensure_ascii=False))
        
    except ValueError as ve:
        error_response = {"error": str(ve)}
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)
    except Exception as e:
        error_response = {"error": f"שגיאה בתהליך ההתחברות: {str(e)}"}
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()
