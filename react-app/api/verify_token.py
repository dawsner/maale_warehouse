#!/usr/bin/env python3
"""
API token verification endpoint for React frontend
Verifies user tokens and returns user data
"""

import json
import sys
import os
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

def verify_token(user_id):
    """Verify user token (simple user ID verification for now)"""
    conn = get_db_connection()
    if not conn:
        return {"success": False, "message": "Database connection failed"}
    
    try:
        cursor = conn.cursor()
        
        # Get user data by ID
        cursor.execute("""
            SELECT id, username, role, email, full_name, 
                   study_year, branch, status, created_at, last_login
            FROM users 
            WHERE id = %s AND status = 'active'
        """, (user_id,))
        
        user_data = cursor.fetchone()
        
        if not user_data:
            return {"success": False, "message": "משתמש לא נמצא או לא פעיל"}
        
        user_id, username, role, email, full_name, study_year, branch, status, created_at, last_login = user_data
        
        # Return user data
        return {
            "success": True,
            "user": {
                "id": user_id,
                "username": username,
                "role": role,
                "email": email,
                "full_name": full_name,
                "study_year": study_year,
                "branch": branch,
                "status": status
            }
        }
        
    except Exception as e:
        print(f"Token verification error: {e}", file=sys.stderr)
        return {"success": False, "message": "שגיאה באימות טוקן"}
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
            user_id = data.get('user_id', '').strip()
            
            if not user_id:
                result = {"success": False, "message": "מזהה משתמש נדרש"}
            else:
                result = verify_token(user_id)
        else:
            result = {"success": False, "message": "נתונים לא התקבלו"}
        
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    except json.JSONDecodeError:
        print(json.dumps({"success": False, "message": "פורמט נתונים שגוי"}, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"success": False, "message": f"שגיאה: {str(e)}"}, ensure_ascii=False))

if __name__ == "__main__":
    main()