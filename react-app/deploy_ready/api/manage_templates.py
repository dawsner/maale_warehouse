"""
API לניהול מערכי הזמנות עבור מנהלי המחסן.
מאפשר יצירה, עריכה ומחיקה של מערכים וצירופי פריטים מומלצים.
"""

import json
import sys
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import datetime

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

def get_all_templates():
    """מחזיר את כל מערכי ההזמנות הפעילים"""
    conn = get_db_connection()
    if not conn:
        return {"error": "Database connection failed"}
    
    try:
        cursor = conn.cursor()
        
        # שליפת כל המערכים
        cursor.execute("""
            SELECT * FROM production_templates 
            WHERE is_active = TRUE 
            ORDER BY created_at
        """)
        templates = cursor.fetchall()
        
        # שליפת הצירופים לכל מערך
        for template in templates:
            cursor.execute("""
                SELECT * FROM template_combinations 
                WHERE template_id = %s AND is_active = TRUE 
                ORDER BY created_at
            """, (template['template_id'],))
            template['combinations'] = cursor.fetchall()
        
        return {"templates": [dict(t) for t in templates]}
        
    except Exception as e:
        print(f"Error fetching templates: {e}", file=sys.stderr)
        return {"error": str(e)}
    finally:
        conn.close()

def create_template(template_data):
    """יוצר מערך הזמנות חדש"""
    conn = get_db_connection()
    if not conn:
        return {"error": "Database connection failed"}
    
    try:
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO production_templates 
            (template_id, name, description, icon_name, categories) 
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (
            template_data['template_id'],
            template_data['name'],
            template_data.get('description', ''),
            template_data.get('icon_name', 'CameraIcon'),
            template_data.get('categories', [])
        ))
        
        template_id = cursor.fetchone()['id']
        
        # הוספת צירופים אם קיימים
        if 'combinations' in template_data:
            for combo in template_data['combinations']:
                cursor.execute("""
                    INSERT INTO template_combinations 
                    (template_id, combination_name, item_names) 
                    VALUES (%s, %s, %s)
                """, (
                    template_data['template_id'],
                    combo['name'],
                    combo['items']
                ))
        
        conn.commit()
        return {"success": True, "id": template_id}
        
    except Exception as e:
        conn.rollback()
        print(f"Error creating template: {e}", file=sys.stderr)
        return {"error": str(e)}
    finally:
        conn.close()

def update_template(template_id, template_data):
    """מעדכן מערך הזמנות קיים"""
    conn = get_db_connection()
    if not conn:
        return {"error": "Database connection failed"}
    
    try:
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE production_templates 
            SET name = %s, description = %s, icon_name = %s, 
                categories = %s, updated_at = CURRENT_TIMESTAMP 
            WHERE template_id = %s
        """, (
            template_data['name'],
            template_data.get('description', ''),
            template_data.get('icon_name', 'CameraIcon'),
            template_data.get('categories', []),
            template_id
        ))
        
        # מחיקת צירופים קיימים ויצירת חדשים
        cursor.execute("DELETE FROM template_combinations WHERE template_id = %s", (template_id,))
        
        if 'combinations' in template_data:
            for combo in template_data['combinations']:
                cursor.execute("""
                    INSERT INTO template_combinations 
                    (template_id, combination_name, item_names) 
                    VALUES (%s, %s, %s)
                """, (
                    template_id,
                    combo['name'],
                    combo['items']
                ))
        
        conn.commit()
        return {"success": True}
        
    except Exception as e:
        conn.rollback()
        print(f"Error updating template: {e}", file=sys.stderr)
        return {"error": str(e)}
    finally:
        conn.close()

def delete_template(template_id):
    """מוחק מערך הזמנות (מסמן כלא פעיל)"""
    conn = get_db_connection()
    if not conn:
        return {"error": "Database connection failed"}
    
    try:
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE production_templates 
            SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP 
            WHERE template_id = %s
        """, (template_id,))
        
        cursor.execute("""
            UPDATE template_combinations 
            SET is_active = FALSE 
            WHERE template_id = %s
        """, (template_id,))
        
        conn.commit()
        return {"success": True}
        
    except Exception as e:
        conn.rollback()
        print(f"Error deleting template: {e}", file=sys.stderr)
        return {"error": str(e)}
    finally:
        conn.close()

def get_available_icons():
    """מחזיר רשימה של אייקונים זמינים"""
    return {
        "icons": [
            {"name": "CameraIcon", "label": "מצלמה"},
            {"name": "MicIcon", "label": "מיקרופון"},
            {"name": "LightIcon", "label": "תאורה"},
            {"name": "GripIcon", "label": "גריפ"},
            {"name": "VideoIcon", "label": "וידיאו"},
            {"name": "AudioIcon", "label": "אודיו"},
            {"name": "SettingsIcon", "label": "הגדרות"},
            {"name": "BuildIcon", "label": "כלים"}
        ]
    }

def main():
    """פונקציה ראשית"""
    try:
        # קריאת נתונים מ-stdin
        input_data = sys.stdin.read().strip()
        
        if not input_data:
            print(json.dumps({"error": "No input data provided"}))
            sys.exit(1)
        
        data = json.loads(input_data)
        action = data.get('action')
        
        if action == 'get_all':
            result = get_all_templates()
        elif action == 'create':
            result = create_template(data.get('template', {}))
        elif action == 'update':
            template_id = data.get('template_id')
            template_data = data.get('template', {})
            result = update_template(template_id, template_data)
        elif action == 'delete':
            template_id = data.get('template_id')
            result = delete_template(template_id)
        elif action == 'get_icons':
            result = get_available_icons()
        else:
            result = {"error": "Invalid action"}
        
        print(json.dumps(result, ensure_ascii=False, default=str))
        
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON input"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()