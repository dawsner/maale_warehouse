"""
סקריפט זה מחזיר סקירה כללית של מצב התחזוקה במערכת.
מספק נתונים סטטיסטיים ורשימת פריטים בתחזוקה.
"""
import sys
import json
import traceback
from datetime import datetime, date

# הוספת תיקיית האב לנתיב החיפוש כדי לייבא מודולים מהתיקייה הראשית
sys.path.append('.')
try:
    from api.maintenance import get_maintenance_overview
except ImportError:
    from maintenance import get_maintenance_overview

# עוזר להמיר אובייקטי תאריך לייצוג מחרוזת ב-JSON
class DateTimeEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, (datetime, date)):
            return o.isoformat()
        return super().default(o)

def main():
    """פונקציה ראשית שמחזירה סקירה של מצב התחזוקה במערכת"""
    try:
        # מקבלת סקירה כללית של מצב התחזוקה במערכת
        overview_data = get_maintenance_overview()
        
        # החזרת התוצאה כ-JSON
        print(json.dumps(overview_data, ensure_ascii=False, cls=DateTimeEncoder))
        
    except Exception as e:
        error_details = traceback.format_exc()
        print(f"DEBUG: Error in get_maintenance_overview.py: {str(e)}", file=sys.stderr)
        print(f"DEBUG: {error_details}", file=sys.stderr)
        
        error_response = {
            'success': False,
            'message': f"שגיאה בקבלת נתוני תחזוקה: {str(e)}"
        }
        print(json.dumps(error_response, ensure_ascii=False))

if __name__ == "__main__":
    main()