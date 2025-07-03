#!/usr/bin/env python3
"""
סקריפט זה מחזיר את כל הסטודנטים במערכת כ-JSON.
משמש את ה-API של React לקבלת נתוני סטודנטים ליצירת השאלות.
"""

import sys
import os
import json
import psycopg2

def get_db_connection():
    """יוצר חיבור למסד הנתונים"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise Exception("DATABASE_URL environment variable not set")
    return psycopg2.connect(database_url)

def main():
    """פונקציה ראשית שמחזירה את כל הסטודנטים כ-JSON"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # שאילתה לקבלת כל הסטודנטים הפעילים
        cursor.execute("""
            SELECT id, username, email, full_name, study_year, branch, status, created_at, last_login
            FROM users 
            WHERE role = 'student' AND status = 'active'
            ORDER BY full_name, username
        """)
        
        students = cursor.fetchall()
        
        # המרה לפורמט JSON
        students_list = []
        for student in students:
            students_list.append({
                'id': student[0],
                'username': student[1],
                'email': student[2],
                'full_name': student[3],
                'study_year': student[4],
                'branch': student[5],
                'status': student[6],
                'created_at': student[7].isoformat() if student[7] else None,
                'last_login': student[8].isoformat() if student[8] else None,
                # שדה נוסף לתצוגה
                'display_name': f"{student[3]} ({student[1]})" if student[3] else student[1]
            })
        
        conn.close()
        
        print(json.dumps(students_list))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()