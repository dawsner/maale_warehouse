"""
סקריפט זה מחזיר סטטיסטיקות על השימוש של סטודנטים בציוד.
"""

import json
import sys
from database import get_db_connection

def get_student_stats():
    """מחזיר נתונים על השימוש של סטודנטים בציוד"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # שאילתה לקבלת הסטודנטים שהשאילו הכי הרבה ציוד
        cursor.execute("""
            SELECT 
                student_name,
                student_id,
                COUNT(*) AS loan_count,
                COALESCE(SUM(CASE WHEN return_date IS NULL THEN 1 ELSE 0 END), 0) AS active_loans,
                COALESCE(SUM(CASE WHEN return_date IS NOT NULL THEN 1 ELSE 0 END), 0) AS completed_loans,
                AVG(EXTRACT(EPOCH FROM (COALESCE(return_date, CURRENT_TIMESTAMP) - checkout_date)) / 86400) AS avg_loan_days
            FROM loans
            GROUP BY student_name, student_id
            ORDER BY loan_count DESC
            LIMIT 10
        """)
        
        students = []
        for row in cursor.fetchall():
            students.append({
                'student_name': row[0],
                'student_id': row[1],
                'loan_count': row[2],
                'active_loans': row[3],
                'completed_loans': row[4],
                'avg_loan_days': round(row[5], 1) if row[5] is not None else 0
            })
        
        # מידע נוסף על השאלות מאוחרות
        cursor.execute("""
            SELECT 
                student_name,
                student_id,
                COUNT(*) AS late_returns
            FROM loans
            WHERE return_date > due_date
            GROUP BY student_name, student_id
            ORDER BY late_returns DESC
            LIMIT 5
        """)
        
        late_returns = []
        for row in cursor.fetchall():
            late_returns.append({
                'student_name': row[0],
                'student_id': row[1],
                'late_returns': row[2]
            })
        
        # ממוצע ימי השאלה כללי
        cursor.execute("""
            SELECT AVG(EXTRACT(EPOCH FROM (COALESCE(return_date, CURRENT_TIMESTAMP) - checkout_date)) / 86400)
            FROM loans
        """)
        
        avg_loan_days = cursor.fetchone()[0]
        if avg_loan_days is None:
            avg_loan_days = 0
        
        conn.close()
        
        return {
            'top_borrowers': students,
            'late_returns': late_returns,
            'average_loan_days': round(avg_loan_days, 1)
        }
    except Exception as e:
        print(f"שגיאה בקבלת נתוני סטודנטים: {str(e)}", file=sys.stderr)
        return {"error": str(e)}

def main():
    """פונקציה ראשית"""
    result = get_student_stats()
    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    main()