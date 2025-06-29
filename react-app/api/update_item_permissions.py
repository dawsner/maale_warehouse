#!/usr/bin/env python3
"""
סקריפט זה מעדכן הרשאות פריט לפי שנות לימוד.
משמש את ה-API של React לעדכון הרשאות פריטים.
"""

import sys
import os
import json

# הוספת הנתיב של הפרויקט
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from database import get_db_connection

def update_item_permissions(item_id, allowed_years):
    """מעדכן את רשימת השנים המורשות לפריט"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # המרת רשימה למחרוזת
        if isinstance(allowed_years, list):
            allowed_years_str = ','.join(map(str, allowed_years))
        else:
            allowed_years_str = str(allowed_years)
        
        cursor.execute(
            "UPDATE items SET allowed_years = %s WHERE id = %s",
            (allowed_years_str, item_id)
        )
        
        conn.commit()
        conn.close()
        
        return {"success": True, "message": "הרשאות הפריט עודכנו בהצלחה"}
        
    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    """פונקציה ראשית"""
    try:
        # קריאת הנתונים מ-stdin
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        
        item_id = data.get('item_id')
        allowed_years = data.get('allowed_years')
        
        if not item_id:
            print(json.dumps({"success": False, "error": "חסר מזהה פריט"}))
            return
            
        if not allowed_years:
            print(json.dumps({"success": False, "error": "חסרות שנות לימוד מורשות"}))
            return
        
        result = update_item_permissions(item_id, allowed_years)
        print(json.dumps(result))
        
    except json.JSONDecodeError:
        print(json.dumps({"success": False, "error": "שגיאה בפענוח JSON"}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()