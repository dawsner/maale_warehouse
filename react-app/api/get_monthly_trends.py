"""
סקריפט זה מחזיר סטטיסטיקות על מגמות חודשיות בהשאלות.
"""

import json
import sys
import os
from datetime import datetime, timedelta

# הוסף את תיקיית השורש של הפרויקט ל-path כדי שנוכל לייבא את database.py
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(project_root)

from database import get_db_connection

def get_monthly_trends():
    """מחזיר נתונים על מגמות חודשיות בהשאלות"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # מקבל את 12 החודשים האחרונים
        cursor.execute("""
            SELECT 
                DATE_TRUNC('month', checkout_date) AS month,
                COUNT(*) AS loans_count,
                COUNT(DISTINCT student_id) AS unique_students
            FROM loans
            WHERE checkout_date >= NOW() - INTERVAL '1 year'
            GROUP BY month
            ORDER BY month ASC
        """)
        
        monthly_data = []
        for row in cursor.fetchall():
            month_date = row[0]
            if month_date:
                month_str = month_date.strftime('%Y-%m')
                monthly_data.append({
                    'month': month_str,
                    'loans_count': row[1],
                    'unique_students': row[2]
                })
        
        # אם אין מספיק נתונים, נשלים עם חודשים ריקים
        if len(monthly_data) < 12:
            today = datetime.now()
            for i in range(12):
                month = today.replace(day=1) - timedelta(days=i*30)
                month_str = month.strftime('%Y-%m')
                
                # בדיקה אם החודש כבר קיים בנתונים שהתקבלו
                if not any(m['month'] == month_str for m in monthly_data):
                    monthly_data.append({
                        'month': month_str,
                        'loans_count': 0,
                        'unique_students': 0
                    })
            
            # מיון לפי תאריך
            monthly_data.sort(key=lambda x: x['month'])
        
        # מקבל מידע על השאלות לפי ימים בשבוע
        cursor.execute("""
            SELECT 
                EXTRACT(DOW FROM checkout_date) AS day_of_week,
                COUNT(*) AS loans_count
            FROM loans
            WHERE checkout_date >= NOW() - INTERVAL '1 year'
            GROUP BY day_of_week
            ORDER BY day_of_week ASC
        """)
        
        weekday_data = []
        for row in cursor.fetchall():
            day_of_week = int(row[0])
            # המרה מ-0-6 (כאשר 0 הוא יום ראשון) ל-1-7 (כאשר 1 הוא יום ראשון)
            day_name = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][day_of_week]
            
            weekday_data.append({
                'day_of_week': day_of_week,
                'day_name': day_name,
                'loans_count': row[1]
            })
        
        # השלמת ימים חסרים
        days = {0, 1, 2, 3, 4, 5, 6}
        existing_days = {int(item['day_of_week']) for item in weekday_data}
        missing_days = days - existing_days
        
        for day in missing_days:
            day_name = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][day]
            weekday_data.append({
                'day_of_week': day,
                'day_name': day_name,
                'loans_count': 0
            })
        
        # מיון לפי יום בשבוע
        weekday_data.sort(key=lambda x: x['day_of_week'])
        
        conn.close()
        
        return {
            'monthly_data': monthly_data,
            'weekday_data': weekday_data
        }
    except Exception as e:
        print(f"שגיאה בקבלת נתוני מגמות חודשיות: {str(e)}", file=sys.stderr)
        return {"error": str(e)}

def main():
    """פונקציה ראשית"""
    result = get_monthly_trends()
    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    main()