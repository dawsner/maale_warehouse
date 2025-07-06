"""
סקריפט זה מספק מידע על תחזוקת פריטים במחסן.
משמש את ה-API של React לקבלת נתוני תחזוקה.
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
    """פונקציה ראשית שמחזירה נתוני תחזוקה לפי בקשת המשתמש"""
    try:
        # קריאת נתוני הקלט מה-JSON שנשלח לסקריפט
        input_data = json.loads(sys.stdin.read())
        
        # הפעולה הנדרשת
        action = input_data.get('action', 'overview')
        
        if action == 'overview':
            # סקירה כללית של מצב התחזוקה במערכת
            result = maintenance.get_maintenance_overview()
            
        elif action == 'item_data':
            # נתוני תחזוקה של פריט ספציפי
            item_id = input_data.get('item_id')
            if not item_id:
                raise ValueError("מזהה פריט (item_id) נדרש לפעולה זו")
                
            result = maintenance.get_item_maintenance_data(item_id)
            
        elif action == 'status':
            # סטטוס תחזוקה של פריט ספציפי
            item_id = input_data.get('item_id')
            if not item_id:
                raise ValueError("מזהה פריט (item_id) נדרש לפעולה זו")
                
            result = maintenance.get_item_maintenance_status(item_id)
            
        elif action == 'records':
            # רשומות תחזוקה של פריט ספציפי
            item_id = input_data.get('item_id')
            if not item_id:
                raise ValueError("מזהה פריט (item_id) נדרש לפעולה זו")
                
            result = maintenance.get_item_maintenance_records(item_id)
            
        elif action == 'warranty':
            # מידע אחריות של פריט ספציפי
            item_id = input_data.get('item_id')
            if not item_id:
                raise ValueError("מזהה פריט (item_id) נדרש לפעולה זו")
                
            result = maintenance.get_item_warranty_info(item_id)
            
        elif action == 'schedules':
            # תזכורות תחזוקה של פריט ספציפי
            item_id = input_data.get('item_id')
            if not item_id:
                raise ValueError("מזהה פריט (item_id) נדרש לפעולה זו")
                
            result = maintenance.get_item_maintenance_schedules(item_id)
            
        elif action == 'upcoming_schedules':
            # תזכורות תחזוקה קרובות בכל המערכת
            days = input_data.get('days', 30)
            result = maintenance.get_upcoming_maintenance_schedules(days)
            
        else:
            raise ValueError(f"פעולה לא מוכרת: {action}")
            
        # החזרת התוצאה כ-JSON
        print(json.dumps(result, ensure_ascii=False, cls=DateTimeEncoder))
            
    except ValueError as e:
        # שגיאות תקינות קלט
        error_response = {
            'success': False,
            'message': str(e)
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)
        
    except Exception as e:
        # שגיאות כלליות
        error_response = {
            'success': False,
            'message': f"שגיאה בקבלת נתוני תחזוקה: {str(e)}"
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()