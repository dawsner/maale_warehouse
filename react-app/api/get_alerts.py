"""
סקריפט זה מחזיר התראות למשתמש:
1. התראות על השאלות שמועד החזרתן קרב או שחלף
2. התראות על פריטים שכמותם במלאי נמוכה
"""
import sys
import os
import json
from datetime import datetime, timedelta
import pytz
from database import get_db_connection

def get_israel_time():
    """מחזיר את השעה הנוכחית בישראל"""
    israel_tz = pytz.timezone('Asia/Jerusalem')
    return datetime.now(israel_tz)

def get_overdue_loans(days_threshold=1):
    """מחזיר השאלות באיחור או שמועד החזרתן קרב"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # השאלות שחלף תאריך ההחזרה שלהן
        cursor.execute("""
            SELECT 
                l.id,
                i.name as item_name,
                l.student_name,
                l.student_id,
                l.quantity,
                l.loan_date,
                l.due_date,
                l.loan_notes,
                l.checkout_notes,
                l.user_id,
                EXTRACT(DAY FROM (CURRENT_TIMESTAMP - l.due_date)) as days_overdue,
                u.email,
                u.full_name as user_full_name,
                'overdue' as alert_type
            FROM loans l
            JOIN items i ON l.item_id = i.id
            LEFT JOIN users u ON l.user_id = u.id
            WHERE l.status = 'active' 
            AND l.due_date < CURRENT_TIMESTAMP
            ORDER BY days_overdue DESC
        """)
        overdue_loans = cursor.fetchall()
        
        # השאלות שקרובות למועד ההחזרה
        cursor.execute("""
            SELECT 
                l.id,
                i.name as item_name,
                l.student_name,
                l.student_id,
                l.quantity,
                l.loan_date,
                l.due_date,
                l.loan_notes,
                l.checkout_notes,
                l.user_id,
                EXTRACT(DAY FROM (l.due_date - CURRENT_TIMESTAMP)) as days_remaining,
                u.email,
                u.full_name as user_full_name,
                'upcoming' as alert_type
            FROM loans l
            JOIN items i ON l.item_id = i.id
            LEFT JOIN users u ON l.user_id = u.id
            WHERE l.status = 'active' 
            AND l.due_date > CURRENT_TIMESTAMP
            AND l.due_date <= CURRENT_TIMESTAMP + INTERVAL '%s days'
            ORDER BY days_remaining ASC
        """ % days_threshold)
        upcoming_returns = cursor.fetchall()

        # מעבד את התוצאות לפורמט JSON
        results = []
        column_names = ['id', 'item_name', 'student_name', 'student_id', 'quantity', 
                       'loan_date', 'due_date', 'loan_notes', 'checkout_notes', 'user_id',
                       'days_metric', 'email', 'user_full_name', 'alert_type']
        
        for loan in overdue_loans:
            loan_dict = dict(zip(column_names, loan))
            loan_dict['days_overdue'] = int(loan_dict.pop('days_metric'))
            loan_dict['severity'] = get_severity_level(loan_dict['days_overdue'], 'overdue')
            # המרת תאריכים למחרוזות
            loan_dict['loan_date'] = loan_dict['loan_date'].strftime('%Y-%m-%d %H:%M:%S')
            loan_dict['due_date'] = loan_dict['due_date'].strftime('%Y-%m-%d %H:%M:%S')
            results.append(loan_dict)
            
        for loan in upcoming_returns:
            loan_dict = dict(zip(column_names, loan))
            loan_dict['days_remaining'] = int(loan_dict.pop('days_metric'))
            loan_dict['severity'] = get_severity_level(loan_dict['days_remaining'], 'upcoming')
            # המרת תאריכים למחרוזות
            loan_dict['loan_date'] = loan_dict['loan_date'].strftime('%Y-%m-%d %H:%M:%S')
            loan_dict['due_date'] = loan_dict['due_date'].strftime('%Y-%m-%d %H:%M:%S')
            results.append(loan_dict)
    
    return results


def get_low_stock_items(threshold_percent=20):
    """מחזיר פריטים שכמותם במלאי נמוכה מאחוז מסוים"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                id,
                name,
                category,
                quantity,
                available_quantity,
                CASE 
                    WHEN quantity > 0 THEN (available_quantity::float / quantity::float * 100)
                    ELSE 0
                END as stock_percent
            FROM items
            WHERE is_available = true
            AND quantity > 0
            AND (available_quantity::float / quantity::float * 100) <= %s
            ORDER BY stock_percent ASC
        """, (threshold_percent,))
        
        low_stock = cursor.fetchall()
        
        results = []
        column_names = ['id', 'name', 'category', 'quantity', 'available_quantity', 'stock_percent']
        
        for item in low_stock:
            item_dict = dict(zip(column_names, item))
            item_dict['stock_percent'] = round(float(item_dict['stock_percent']), 1)
            item_dict['alert_type'] = 'low_stock'
            
            # קביעת רמת חומרה בהתאם לאחוז המלאי
            if item_dict['stock_percent'] <= 5:
                item_dict['severity'] = 'high'  # קריטי
            elif item_dict['stock_percent'] <= 10:
                item_dict['severity'] = 'medium'  # בינוני
            else:
                item_dict['severity'] = 'low'  # נמוך
                
            results.append(item_dict)
    
    return results


def get_severity_level(days, alert_type):
    """קובע את רמת חומרת ההתראה בהתבסס על ימים"""
    if alert_type == 'overdue':
        if days > 14:
            return 'high'  # קריטי
        elif days > 7:
            return 'medium'  # בינוני
        else:
            return 'low'  # נמוך
    else:  # upcoming
        if days < 1:
            return 'high'  # קריטי
        elif days < 2:
            return 'medium'  # בינוני
        else:
            return 'low'  # נמוך


def get_all_alerts(days_threshold=3, stock_threshold=20):
    """מחזיר את כל סוגי ההתראות"""
    overdue_alerts = get_overdue_loans(days_threshold)
    low_stock_alerts = get_low_stock_items(stock_threshold)
    
    all_alerts = {
        'overdue_loans': [a for a in overdue_alerts if a['alert_type'] == 'overdue'],
        'upcoming_returns': [a for a in overdue_alerts if a['alert_type'] == 'upcoming'],
        'low_stock': low_stock_alerts,
        'summary': {
            'total_alerts': len(overdue_alerts) + len(low_stock_alerts),
            'overdue_count': len([a for a in overdue_alerts if a['alert_type'] == 'overdue']),
            'upcoming_count': len([a for a in overdue_alerts if a['alert_type'] == 'upcoming']),
            'low_stock_count': len(low_stock_alerts),
            'high_severity_count': len([a for a in overdue_alerts + low_stock_alerts if a.get('severity') == 'high']),
            'last_updated': get_israel_time().strftime('%Y-%m-%d %H:%M:%S')
        }
    }
    
    return all_alerts


def main():
    """פונקציה ראשית"""
    try:
        # מקבל פרמטרים מבקשת HTTP
        if len(sys.argv) > 1:
            params = json.loads(sys.argv[1])
            days_threshold = params.get('days_threshold', 3)
            stock_threshold = params.get('stock_threshold', 20)
        else:
            days_threshold = 3
            stock_threshold = 20
        
        alerts = get_all_alerts(days_threshold, stock_threshold)
        print(json.dumps(alerts))
        
    except Exception as e:
        print(json.dumps({
            'error': str(e),
            'success': False
        }))


if __name__ == "__main__":
    main()