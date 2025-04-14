"""
סקריפט זה מחזיר התראות למשתמש:
1. התראות על השאלות שמועד החזרתן קרב או שחלף
2. התראות על פריטים שכמותם במלאי נמוכה
"""

import sys
import json
import datetime
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import pytz

# חיבור למסד הנתונים
def get_db_connection():
    """יוצר חיבור למסד הנתונים"""
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    conn.autocommit = True
    return conn

def get_israel_time():
    """מחזיר את השעה הנוכחית בישראל"""
    israel_tz = pytz.timezone('Asia/Jerusalem')
    return datetime.datetime.now(israel_tz)

def get_overdue_loans(days_threshold=1):
    """מחזיר השאלות באיחור או שמועד החזרתן קרב"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    today = get_israel_time().date()
    
    try:
        # 1. השאלות באיחור
        cursor.execute("""
            SELECT l.*, i.name as item_name, i.category
            FROM loans l
            JOIN items i ON l.item_id = i.id
            WHERE l.return_date IS NULL AND l.due_date < %s
            ORDER BY l.due_date ASC
        """, (today,))
        
        overdue_loans = []
        for loan in cursor.fetchall():
            # חישוב מספר הימים באיחור
            due_date = loan['due_date']
            days_overdue = (today - due_date).days
            
            # קביעת רמת חומרה
            severity = get_severity_level(days_overdue, 'overdue')
            
            loan_data = dict(loan)
            loan_data['days_overdue'] = days_overdue
            loan_data['severity'] = severity
            overdue_loans.append(loan_data)
        
        # 2. השאלות שמועד החזרתן קרב
        cursor.execute("""
            SELECT l.*, i.name as item_name, i.category
            FROM loans l
            JOIN items i ON l.item_id = i.id
            WHERE l.return_date IS NULL 
              AND l.due_date >= %s 
              AND l.due_date <= %s
            ORDER BY l.due_date ASC
        """, (today, today + datetime.timedelta(days=days_threshold)))
        
        upcoming_returns = []
        for loan in cursor.fetchall():
            # חישוב מספר הימים שנותרו
            due_date = loan['due_date']
            days_remaining = (due_date - today).days
            
            # קביעת רמת חומרה (הפוך מהאיחור - ככל שנשאר פחות זמן, יותר חמור)
            severity = get_severity_level(days_threshold - days_remaining, 'upcoming')
            
            loan_data = dict(loan)
            loan_data['days_remaining'] = days_remaining
            loan_data['severity'] = severity
            upcoming_returns.append(loan_data)
            
        return {
            "overdue_loans": overdue_loans,
            "upcoming_returns": upcoming_returns
        }
    
    finally:
        cursor.close()
        conn.close()

def get_low_stock_items(threshold_percent=20):
    """מחזיר פריטים שכמותם במלאי נמוכה מאחוז מסוים"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # שליפת פריטים עם כמות זמינה נמוכה
        cursor.execute("""
            SELECT i.*, 
                   (SELECT COUNT(*) FROM loans l WHERE l.item_id = i.id AND l.return_date IS NULL) AS loaned_count
            FROM items i
            WHERE i.is_available = TRUE
            ORDER BY i.category, i.name
        """)
        
        low_stock_items = []
        for item in cursor.fetchall():
            total_quantity = item['quantity']
            loaned_count = item['loaned_count']
            
            if total_quantity > 0:  # מניעת חלוקה באפס
                available_quantity = total_quantity - loaned_count
                stock_percent = (available_quantity / total_quantity) * 100
                
                if stock_percent <= threshold_percent:
                    # קביעת רמת חומרה
                    if stock_percent <= 5:
                        severity = 'high'
                    elif stock_percent <= 10:
                        severity = 'medium'
                    else:
                        severity = 'low'
                    
                    item_data = dict(item)
                    item_data['available_quantity'] = available_quantity
                    item_data['stock_percent'] = round(stock_percent)
                    item_data['severity'] = severity
                    low_stock_items.append(item_data)
        
        return low_stock_items
    
    finally:
        cursor.close()
        conn.close()

def get_severity_level(days, alert_type):
    """קובע את רמת חומרת ההתראה בהתבסס על ימים"""
    if alert_type == 'overdue':
        if days >= 7:
            return 'high'
        elif days >= 3:
            return 'medium'
        else:
            return 'low'
    else:  # upcoming
        if days == 0:
            return 'high'
        elif days == 1:
            return 'medium'
        else:
            return 'low'

def get_all_alerts(days_threshold=3, stock_threshold=20):
    """מחזיר את כל סוגי ההתראות"""
    loan_alerts = get_overdue_loans(days_threshold)
    low_stock = get_low_stock_items(stock_threshold)
    
    overdue_loans = loan_alerts.get('overdue_loans', [])
    upcoming_returns = loan_alerts.get('upcoming_returns', [])
    
    # חישוב התראות לסיכום
    total_alerts = len(overdue_loans) + len(upcoming_returns) + len(low_stock)
    high_severity_count = sum(1 for alert in overdue_loans if alert.get('severity') == 'high')
    high_severity_count += sum(1 for alert in upcoming_returns if alert.get('severity') == 'high')
    high_severity_count += sum(1 for alert in low_stock if alert.get('severity') == 'high')
    
    return {
        "overdue_loans": overdue_loans,
        "upcoming_returns": upcoming_returns,
        "low_stock": low_stock,
        "summary": {
            "total_alerts": total_alerts,
            "overdue_count": len(overdue_loans),
            "upcoming_count": len(upcoming_returns),
            "low_stock_count": len(low_stock),
            "high_severity_count": high_severity_count,
            "last_updated": get_israel_time().isoformat()
        }
    }

def main():
    """פונקציה ראשית"""
    try:
        # בדיקה אם התקבלו נתונים בקלט
        if len(sys.argv) > 1:
            input_data = json.loads(sys.argv[1])
            days_threshold = input_data.get('days_threshold', 3)
            stock_threshold = input_data.get('stock_threshold', 20)
        else:
            # ברירת מחדל
            days_threshold = 3
            stock_threshold = 20
        
        alerts = get_all_alerts(days_threshold, stock_threshold)
        print(json.dumps(alerts))
    
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()