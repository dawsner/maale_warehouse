"""
סקריפט זה מאפשר עדכון נתוני תחזוקה של פריטים במחסן.
משמש את ה-API של React לעדכון מידע תחזוקה, רשומות תחזוקה, אחריות ותזכורות.
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
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)

# עוזר להמיר מחרוזות תאריך לאובייקטי תאריך
def parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except ValueError:
        # ניסיון בפורמט אחר
        formats = [
            '%Y-%m-%d',
            '%d/%m/%Y',
            '%d-%m-%Y',
            '%Y/%m/%d'
        ]
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue
        raise ValueError(f"לא ניתן לפרש תאריך: {date_str}")

def main():
    """פונקציה ראשית שמעדכנת נתוני תחזוקה לפי בקשת המשתמש"""
    try:
        # קריאת נתוני הקלט מה-JSON שנשלח לסקריפט
        input_data = json.loads(sys.stdin.read())
        
        # הפעולה הנדרשת
        action = input_data.get('action')
        if not action:
            raise ValueError("פעולה (action) נדרשת")
            
        result = None
            
        if action == 'update_status':
            # עדכון סטטוס תחזוקה של פריט
            item_id = input_data.get('item_id')
            if not item_id:
                raise ValueError("מזהה פריט (item_id) נדרש לפעולה זו")
                
            status = input_data.get('status')
            if not status:
                raise ValueError("סטטוס (status) נדרש לפעולה זו")
                
            notes = input_data.get('notes')
            user_id = input_data.get('user_id')
            
            result = {
                'id': maintenance.update_item_maintenance_status(item_id, status, notes, user_id),
                'success': True
            }
            
        elif action == 'add_record':
            # הוספת רשומת תחזוקה חדשה
            item_id = input_data.get('item_id')
            if not item_id:
                raise ValueError("מזהה פריט (item_id) נדרש לפעולה זו")
                
            maintenance_type = input_data.get('maintenance_type')
            if not maintenance_type:
                raise ValueError("סוג תחזוקה (maintenance_type) נדרש לפעולה זו")
                
            description = input_data.get('description')
            if not description:
                raise ValueError("תיאור (description) נדרש לפעולה זו")
                
            start_date_str = input_data.get('start_date')
            if not start_date_str:
                raise ValueError("תאריך התחלה (start_date) נדרש לפעולה זו")
                
            start_date = parse_date(start_date_str)
            end_date = parse_date(input_data.get('end_date')) if input_data.get('end_date') else None
            performed_by = input_data.get('performed_by')
            cost = input_data.get('cost', 0)
            receipt_url = input_data.get('receipt_url')
            notes = input_data.get('notes')
            user_id = input_data.get('user_id')
            
            result = {
                'id': maintenance.add_maintenance_record(
                    item_id, maintenance_type, description, start_date, end_date,
                    performed_by, cost, receipt_url, notes, user_id
                ),
                'success': True
            }
            
        elif action == 'update_record':
            # עדכון רשומת תחזוקה קיימת
            record_id = input_data.get('record_id')
            if not record_id:
                raise ValueError("מזהה רשומה (record_id) נדרש לפעולה זו")
                
            # שדות אופציונליים לעדכון
            update_data = {}
            
            if 'maintenance_type' in input_data:
                update_data['maintenance_type'] = input_data['maintenance_type']
            if 'description' in input_data:
                update_data['description'] = input_data['description']
            if 'start_date' in input_data:
                update_data['start_date'] = parse_date(input_data['start_date'])
            if 'end_date' in input_data:
                update_data['end_date'] = parse_date(input_data['end_date'])
            if 'performed_by' in input_data:
                update_data['performed_by'] = input_data['performed_by']
            if 'cost' in input_data:
                update_data['cost'] = input_data['cost']
            if 'receipt_url' in input_data:
                update_data['receipt_url'] = input_data['receipt_url']
            if 'notes' in input_data:
                update_data['notes'] = input_data['notes']
                
            # הוספת מזהה משתמש לעדכון סטטוס פריט אם התחזוקה הסתיימה
            if 'end_date' in update_data:
                update_data['user_id'] = input_data.get('user_id')
                
            result = {
                'id': maintenance.update_maintenance_record(record_id, **update_data),
                'success': True
            }
            
        elif action == 'delete_record':
            # מחיקת רשומת תחזוקה
            record_id = input_data.get('record_id')
            if not record_id:
                raise ValueError("מזהה רשומה (record_id) נדרש לפעולה זו")
                
            success = maintenance.delete_maintenance_record(record_id)
            result = {'success': success}
            
        elif action == 'add_warranty':
            # הוספת/עדכון מידע אחריות
            item_id = input_data.get('item_id')
            if not item_id:
                raise ValueError("מזהה פריט (item_id) נדרש לפעולה זו")
                
            warranty_provider = input_data.get('warranty_provider')
            if not warranty_provider:
                raise ValueError("ספק אחריות (warranty_provider) נדרש לפעולה זו")
                
            warranty_number = input_data.get('warranty_number')
            if not warranty_number:
                raise ValueError("מספר אחריות (warranty_number) נדרש לפעולה זו")
                
            start_date_str = input_data.get('start_date')
            if not start_date_str:
                raise ValueError("תאריך התחלת אחריות (start_date) נדרש לפעולה זו")
                
            end_date_str = input_data.get('end_date')
            if not end_date_str:
                raise ValueError("תאריך סיום אחריות (end_date) נדרש לפעולה זו")
                
            start_date = parse_date(start_date_str)
            end_date = parse_date(end_date_str)
            contact_info = input_data.get('contact_info')
            terms = input_data.get('terms')
            
            result = {
                'id': maintenance.add_warranty_info(
                    item_id, warranty_provider, warranty_number, start_date,
                    end_date, contact_info, terms
                ),
                'success': True
            }
            
        elif action == 'delete_warranty':
            # מחיקת מידע אחריות
            item_id = input_data.get('item_id')
            if not item_id:
                raise ValueError("מזהה פריט (item_id) נדרש לפעולה זו")
                
            success = maintenance.delete_warranty_info(item_id)
            result = {'success': success}
            
        elif action == 'add_schedule':
            # הוספת/עדכון תזכורת תחזוקה
            item_id = input_data.get('item_id')
            if not item_id:
                raise ValueError("מזהה פריט (item_id) נדרש לפעולה זו")
                
            maintenance_type = input_data.get('maintenance_type')
            if not maintenance_type:
                raise ValueError("סוג תחזוקה (maintenance_type) נדרש לפעולה זו")
                
            frequency_days = input_data.get('frequency_days')
            if not frequency_days:
                raise ValueError("תדירות בימים (frequency_days) נדרשת לפעולה זו")
                
            next_due_str = input_data.get('next_due')
            if not next_due_str:
                raise ValueError("תאריך יעד הבא (next_due) נדרש לפעולה זו")
                
            next_due = parse_date(next_due_str)
            description = input_data.get('description')
            last_performed = parse_date(input_data.get('last_performed')) if input_data.get('last_performed') else None
            user_id = input_data.get('user_id')
            
            result = {
                'id': maintenance.add_maintenance_schedule(
                    item_id, maintenance_type, frequency_days, next_due,
                    description, last_performed, user_id
                ),
                'success': True
            }
            
        elif action == 'delete_schedule':
            # מחיקת תזכורת תחזוקה
            schedule_id = input_data.get('schedule_id')
            if not schedule_id:
                raise ValueError("מזהה תזכורת (schedule_id) נדרש לפעולה זו")
                
            success = maintenance.delete_maintenance_schedule(schedule_id)
            result = {'success': success}
            
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
            'message': f"שגיאה בעדכון נתוני תחזוקה: {str(e)}"
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()