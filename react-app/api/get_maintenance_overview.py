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

# לוגים לבדיקה
print("DEBUG: Starting maintenance overview script", file=sys.stderr)

try:
    from api.maintenance import get_maintenance_overview
    print("DEBUG: Imported from api.maintenance", file=sys.stderr)
except ImportError:
    try:
        from maintenance import get_maintenance_overview
        print("DEBUG: Imported from maintenance", file=sys.stderr)
    except ImportError:
        print("DEBUG: Failed to import get_maintenance_overview", file=sys.stderr)
        sys.exit(1)

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
        print(f"DEBUG: Got overview data: {overview_data is not None}", file=sys.stderr)
        
        if overview_data is None:
            print(f"DEBUG: Overview data is None", file=sys.stderr)
            overview_data = {
                "in_maintenance_count": 0,
                "in_maintenance_items": [],
                "error": "No data returned from get_maintenance_overview"
            }
        
        # החזרת התוצאה כ-JSON - חשוב להשתמש ב-ensure_ascii=False כדי לתמוך בעברית
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