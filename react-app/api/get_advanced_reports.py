"""
סקריפט API לניתוח מתקדם והפקת דו"חות
"""

import os
import sys
import json
import datetime
import traceback

# הוספת תיקיית השורש לpath כדי לאפשר import של מודולים אחרים
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(parent_dir)

# ייבוא המודול לניתוח מתקדם
from advanced_analytics import (
    analyze_usage_trends,
    predict_future_demand,
    generate_purchase_recommendations,
    comparative_periods_analysis,
    export_advanced_report
)

class DateTimeEncoder(json.JSONEncoder):
    """מחלקה להמרת אובייקטי תאריך ל-JSON"""
    def default(self, o):
        if isinstance(o, (datetime.datetime, datetime.date)):
            return o.isoformat()
        return super().default(o)

def main():
    """פונקציה ראשית שמחזירה דו"חות מתקדמים בהתאם לבקשת המשתמש"""
    try:
        # קריאת נתוני ה-request מה-input הסטנדרטי
        request_data = json.loads(sys.stdin.read())
        
        # שליפת הפרמטרים מהבקשה
        report_type = request_data.get('report_type', '')
        params = request_data.get('params', {})
        
        if not report_type:
            result = {
                'success': False,
                'error': 'לא סופק סוג דו"ח (report_type)'
            }
        else:
            # הפקת הדו"ח המבוקש
            report_data = export_advanced_report(report_type, params)
            
            result = {
                'success': True,
                'report_type': report_type,
                'data': report_data,
                'generated_at': datetime.datetime.now().isoformat()
            }
        
        # החזרת התוצאה ב-JSON
        print(json.dumps(result, cls=DateTimeEncoder))
        
    except Exception as e:
        error_details = traceback.format_exc()
        print(json.dumps({
            'success': False,
            'error': f'שגיאה בהפקת הדו"ח: {str(e)}',
            'details': error_details
        }, cls=DateTimeEncoder))

if __name__ == "__main__":
    main()