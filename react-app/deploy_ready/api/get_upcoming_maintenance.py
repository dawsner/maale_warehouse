"""
סקריפט זה מחזיר רשימה של תזכורות תחזוקה קרובות.
משמש את ה-API של React לקבלת נתוני תזכורות תחזוקה.
"""

import sys
import os
import json
from datetime import datetime, date

# הוספת תיקיית האב לנתיב החיפוש כדי לייבא מודולים מהתיקייה הראשית
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
import maintenance

# עוזר להמיר אובייקטי תאריך לייצוג מחרוזת ב-JSON
class DateTimeEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, (datetime, date)):
            return o.isoformat()
        return super().default(o)

def main():
    """פונקציה ראשית שמחזירה תזכורות תחזוקה קרובות"""
    try:
        # קריאת נתוני הקלט מה-query string
        days_threshold = 30  # ברירת מחדל
        
        # בדיקה אם התקבל ערך לימים בבקשה
        if 'QUERY_STRING' in os.environ:
            query_string = os.environ['QUERY_STRING']
            for param in query_string.split('&'):
                if '=' in param:
                    key, value = param.split('=')
                    if key == 'days':
                        try:
                            days_threshold = int(value)
                        except ValueError:
                            pass
        
        # קבלת תזכורות תחזוקה קרובות
        result = maintenance.get_upcoming_maintenance_schedules(days_threshold)
        
        # בדיקה אם הערך שחזר הוא None ואז החזרת מערך ריק
        if result is None:
            result = []
            
        # החזרת התוצאה כ-JSON
        print(json.dumps(result, ensure_ascii=False, cls=DateTimeEncoder))
            
    except Exception as e:
        # שגיאות כלליות
        error_response = {
            'success': False,
            'message': f"שגיאה בקבלת תזכורות תחזוקה: {str(e)}"
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()