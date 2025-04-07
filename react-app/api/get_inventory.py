#!/usr/bin/env python3
"""
סקריפט זה מחזיר את כל פריטי המלאי כ-JSON.
משמש את ה-API של React לקבלת נתוני מלאי.
"""

import json
import sys
sys.path.append(".")  # מוסיף את התיקיה הנוכחית לנתיב החיפוש של מודולים
from database import get_all_items

def main():
    """פונקציה ראשית שמחזירה את כל פריטי המלאי כ-JSON"""
    try:
        items = get_all_items()
        
        # המרת התוצאות למבנה נתונים מתאים ל-JSON
        inventory_data = []
        for item in items:
            inventory_data.append({
                "id": item[0],
                "name": item[1],
                "category": item[2],
                "quantity": item[3],
                "notes": item[4],
                "is_available": item[5]
            })
        
        # החזרת התוצאות כ-JSON
        print(json.dumps(inventory_data))
        
    except Exception as e:
        error_response = {"error": f"שגיאה בקבלת נתוני מלאי: {str(e)}"}
        print(json.dumps(error_response))
        sys.exit(1)

if __name__ == "__main__":
    main()
