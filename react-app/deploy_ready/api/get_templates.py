"""
API לקבלת מערכי הזמנות עבור אשף ההזמנות.
מחזיר את המערכים הפעילים מבסיס הנתונים.
"""

import json
import sys
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """יוצר חיבור למסד הנתונים"""
    try:
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            raise Exception("DATABASE_URL environment variable not set")
        
        conn = psycopg2.connect(database_url, cursor_factory=RealDictCursor)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}", file=sys.stderr)
        return None

def main():
    """פונקציה ראשית שמחזירה את מערכי ההזמנות הפעילים"""
    conn = get_db_connection()
    if not conn:
        print(json.dumps({"error": "Database connection failed"}))
        sys.exit(1)
    
    try:
        cursor = conn.cursor()
        
        # שליפת כל המערכים הפעילים
        cursor.execute("""
            SELECT * FROM production_templates 
            WHERE is_active = TRUE 
            ORDER BY created_at
        """)
        templates = cursor.fetchall()
        
        # שליפת הצירופים לכל מערך
        result = {}
        for template in templates:
            cursor.execute("""
                SELECT combination_name, item_names FROM template_combinations 
                WHERE template_id = %s AND is_active = TRUE 
                ORDER BY created_at
            """, (template['template_id'],))
            combinations = cursor.fetchall()
            
            # המרה לפורמט המתאים לאשף
            template_data = {
                'id': template['template_id'],
                'name': template['name'],
                'description': template['description'],
                'icon': template['icon_name'],
                'categories': template['categories'] or [],
                'recommendedCombinations': [
                    {
                        'name': combo['combination_name'],
                        'items': combo['item_names'] or []
                    }
                    for combo in combinations
                ]
            }
            
            result[template['template_id']] = template_data
        
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    main()