"""
סקריפט זה מוחק פריט מהמלאי.
משמש את ה-API של React למחיקת פריטים.
"""

import sys
import json
import os

# הוספת תיקיית הפרויקט הראשית לנתיב החיפוש
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# ייבוא פונקציות מבסיס הנתונים
from database import delete_item

def main():
    """פונקציה ראשית שמוחקת פריט מהמלאי"""
    try:
        # קריאת נתוני הקלט מה-JSON שנשלח לסקריפט
        input_data = json.loads(sys.stdin.read())
        
        # חילוץ מזהה הפריט מהקלט
        item_id = input_data.get('id')
        
        # בדיקות תקינות בסיסיות
        if not item_id:
            raise ValueError("מזהה פריט הוא שדה חובה")
        
        # מחיקת הפריט
        success = delete_item(item_id)
        
        if success:
            # החזרת תוצאה חיובית
            response = {
                'success': True,
                'message': f"הפריט נמחק בהצלחה"
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
            'message': f"שגיאה במחיקת פריט: {str(e)}"
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()