"""
סקריפט זה מוסיף פריט חדש למלאי.
משמש את ה-API של React להוספת פריטים חדשים.
"""

import sys
import json
import os

# הוספת תיקיית הפרויקט הראשית לנתיב החיפוש
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# ייבוא פונקציות מבסיס הנתונים
from database import add_item

def main():
    """פונקציה ראשית שמוסיפה פריט חדש למלאי"""
    try:
        # קריאת נתוני הקלט מה-JSON שנשלח לסקריפט
        input_data = json.loads(sys.stdin.read())
        
        # חילוץ פרטי הפריט מהקלט
        name = input_data.get('name')
        category = input_data.get('category')
        quantity = input_data.get('quantity')
        notes = input_data.get('notes', '')
        
        # בדיקות תקינות בסיסיות
        if not all([name, category, quantity]):
            raise ValueError("שם, קטגוריה וכמות הם שדות חובה")
            
        if not isinstance(quantity, int) or quantity <= 0:
            raise ValueError("כמות חייבת להיות מספר שלם חיובי")
        
        # הוספת הפריט
        item_id = add_item(
            name=name,
            category=category,
            quantity=quantity,
            notes=notes
        )
        
        # החזרת תוצאה חיובית
        response = {
            'success': True,
            'id': item_id,
            'message': f"הפריט '{name}' נוסף בהצלחה"
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
            'message': f"שגיאה בהוספת פריט: {str(e)}"
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()