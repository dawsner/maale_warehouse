#!/usr/bin/env python3
"""
API login endpoint for React frontend
Handles user authentication and returns user data with JWT token
"""

import json
import sys
import os
import hashlib
import base64

# Add the parent directory to the path to import auth_api
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from auth import verify_scrypt_password
import psycopg2
from urllib.parse import urlparse

def get_db_connection():
    """Create database connection"""
    try:
        # Get database URL from environment
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            raise Exception("DATABASE_URL environment variable not set")
        
        # Parse the database URL
        parsed = urlparse(database_url)
        
        # Create connection
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port,
            database=parsed.path[1:],  # Remove leading slash
            user=parsed.username,
            password=parsed.password,
            sslmode='require'
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}", file=sys.stderr)
        return None

def verify_password(stored_password, provided_password):
    """
    Verify password against multiple formats:
    1. scrypt format: scrypt:32768:8:1$salt$hash
    2. bcrypt format: $2b$...
    3. plain text (for compatibility)
    """
    if not stored_password or not provided_password:
        return False
    
    # Try scrypt format first
    if stored_password.startswith('scrypt:'):
        try:
            return verify_scrypt_password(stored_password, provided_password)
        except:
            pass
    
    # Try bcrypt format
    if stored_password.startswith('$2b$'):
        try:
            import bcrypt
            return bcrypt.checkpw(provided_password.encode('utf-8'), stored_password.encode('utf-8'))
        except:
            pass
    
    # Try plain text comparison (for legacy compatibility)
    return stored_password == provided_password

def login_user(username, password):
    """Authenticate user and return user data"""
    conn = get_db_connection()
    if not conn:
        return {"success": False, "message": "Database connection failed"}
    
    try:
        cursor = conn.cursor()
        
        # Get user data
        cursor.execute("""
            SELECT id, username, password, role, email, full_name, 
                   study_year, branch, status, created_at, last_login
            FROM users 
            WHERE username = %s AND status = 'active'
        """, (username,))
        
        user_data = cursor.fetchone()
        
        if not user_data:
            return {"success": False, "message": "משתמש לא נמצא או לא פעיל"}
        
        user_id, db_username, password_hash, role, email, full_name, study_year, branch, status, created_at, last_login = user_data
        
        # Verify password
        if not verify_password(password_hash, password):
            return {"success": False, "message": "סיסמה שגויה"}
        
        # Update last login
        cursor.execute("UPDATE users SET last_login = NOW() WHERE id = %s", (user_id,))
        conn.commit()
        
        # Return user data
        return {
            "success": True,
            "user": {
                "id": user_id,
                "username": db_username,
                "role": role,
                "email": email,
                "full_name": full_name,
                "study_year": study_year,
                "branch": branch,
                "status": status,
                "token": str(user_id)  # Simple token for now
            }
        }
        
    except Exception as e:
        print(f"Login error: {e}", file=sys.stderr)
        return {"success": False, "message": "שגיאה בהתחברות"}
    finally:
        if conn:
            conn.close()

def main():
    """Main function"""
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        if input_data:
            data = json.loads(input_data)
            username = data.get('username', '').strip()
            password = data.get('password', '').strip()
            
            if not username or not password:
                result = {"success": False, "message": "שם משתמש וסיסמה נדרשים"}
            else:
                result = login_user(username, password)
        else:
            result = {"success": False, "message": "נתונים לא התקבלו"}
        
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    except json.JSONDecodeError:
        print(json.dumps({"success": False, "message": "פורמט נתונים שגוי"}, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"success": False, "message": f"שגיאה: {str(e)}"}, ensure_ascii=False))

if __name__ == "__main__":
    main()