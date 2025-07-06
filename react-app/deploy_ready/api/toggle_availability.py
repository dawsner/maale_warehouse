"""
סקריפט זה משנה את מצב הזמינות של פריט.
משמש את ה-API של React לשינוי זמינות פריטים.
"""

import sys
import json
import os

# הוספת תיקיית הפרויקט הראשית לנתיב החיפוש
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# ייבוא פונקציות מבסיס הנתונים
from database import toggle_item_availability

def main():
    """פונקציה ראשית שמשנה את מצב הזמינות של פריט"""
    try:
        # קריאת נתוני הקלט מה-JSON שנשלח לסקריפט
        input_data = json.loads(sys.stdin.read())
        
        # חילוץ מזהה הפריט ומצב הזמינות מהקלט
        item_id = input_data.get('id')
        is_available = input_data.get('isAvailable')
        
        # בדיקות תקינות בסיסיות
        if item_id is None:
            raise ValueError("מזהה פריט הוא שדה חובה")
            
        if is_available is None:
            raise ValueError("מצב זמינות הוא שדה חובה")
        
        # שינוי מצב הזמינות של הפריט
        success = toggle_item_availability(item_id, is_available)
        
        if success:
            # החזרת תוצאה חיובית
            status_text = "זמין" if is_available else "לא זמין"
            response = {
                'success': True,
                'id': item_id,
                'is_available': is_available,
                'message': f"הפריט הוגדר כ{status_text} בהצלחה"
            }
        else:
            # במקרה שהפריט לא נמצא
            response = {
                'success': False,
                'message': f"הפריט עם מזהה {item_id} לא נמצא"
            }
        
        print(json.dumps(response, ensure_ascii=False))
        
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
            'message': f"שגיאה בשינוי זמינות פריט: {str(e)}"
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()