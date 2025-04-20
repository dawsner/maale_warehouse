"""
סקריפט זה מחזיר סקירה כללית של מצב התחזוקה במערכת.
מספק נתונים סטטיסטיים ורשימת פריטים בתחזוקה.
"""
import sys
import json
import traceback
from datetime import datetime

sys.path.append('.')
from maintenance import get_maintenance_overview
from utils import set_json_response, DateTimeEncoder

def main():
    """פונקציה ראשית שמחזירה סקירה של מצב התחזוקה במערכת"""
    try:
        # מקבלת סקירה כללית של מצב התחזוקה במערכת
        overview_data = get_maintenance_overview()
        
        # המרת תאריכים לפורמט מתאים ל-JSON
        json_data = json.dumps(overview_data, cls=DateTimeEncoder)
        overview_data = json.loads(json_data)
        
        set_json_response(overview_data)
        
    except Exception as e:
        error_details = traceback.format_exc()
        print(f"DEBUG: Error in get_maintenance_overview.py: {str(e)}", file=sys.stderr)
        print(f"DEBUG: {error_details}", file=sys.stderr)
        set_json_response({"error": str(e)}, status=500)

if __name__ == "__main__":
    main()