"""
פונקציות עזר עבור מערכת ניהול ציוד קולנוע
"""

from datetime import datetime, timezone
import pytz
import psycopg2
import psycopg2.extras
from database import get_db_connection

def get_israel_time():
    """
    מחזיר את הזמן הנוכחי באזור זמן ישראל
    """
    israel_tz = pytz.timezone('Asia/Jerusalem')
    return datetime.now(israel_tz)

def format_hebrew_date(date):
    """
    מעצב תאריך בפורמט עברי ידידותי
    """
    if date is None:
        return ""
    
    if isinstance(date, str):
        try:
            date = datetime.fromisoformat(date.replace('Z', '+00:00'))
        except:
            return date
    
    # המרה לאזור זמן ישראל אם צריך
    if date.tzinfo is None:
        israel_tz = pytz.timezone('Asia/Jerusalem')
        date = israel_tz.localize(date)
    elif date.tzinfo != pytz.timezone('Asia/Jerusalem'):
        israel_tz = pytz.timezone('Asia/Jerusalem')
        date = date.astimezone(israel_tz)
    
    # פורמט עברי
    months = [
        "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
        "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
    ]
    
    return f"{date.day} {months[date.month-1]} {date.year}"

def get_overdue_loans():
    """
    מחזיר רשימת השאלות שחלף מועד החזרתן
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        cursor.execute("""
            SELECT l.*, i.name as item_name, i.category
            FROM loans l
            JOIN items i ON l.item_id = i.id
            WHERE l.is_returned = FALSE AND l.due_date < CURRENT_TIMESTAMP
            ORDER BY l.due_date
        """)
        
        loans = cursor.fetchall()
        return [dict(loan) for loan in loans]
        
    except Exception as e:
        print(f"Error getting overdue loans: {e}")
        return []
    finally:
        if conn:
            conn.close()

def set_page_config():
    """
    הגדרת תצורה בסיסית לעמוד (לשימוש עם Streamlit)
    """
    pass  # פונקציה ריקה לשמירה על תאימות