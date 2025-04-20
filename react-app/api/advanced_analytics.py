"""
מודול לניתוח נתונים מתקדם, מגמות שימוש והמלצות רכש חכמות.
כולל פונקציות לחיזוי ביקוש, ניתוח מגמות והמלצות רכש אוטומטיות.
"""

import os
import sys
import json
import datetime
import time
import pytz
import pandas as pd
import numpy as np

# הוספת תיקיית השורש לpath כדי לאפשר import של מודולים אחרים
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(parent_dir)

# חיבור למסד הנתונים
import database
from utils import get_israel_time

def get_db_connection():
    """יוצר חיבור למסד הנתונים"""
    return database.get_db_connection()

def analyze_usage_trends(params=None):
    """
    מנתח מגמות שימוש בציוד לאורך זמן
    חזרה: נתונים על תדירות השימוש בפריטים לפי קטגוריות, מגמות לאורך זמן
    """
    if params is None:
        params = {}
    
    months_back = int(params.get('months_back', 12))
    conn = get_db_connection()
    cur = conn.cursor()
    
    # תאריך לפני X חודשים
    cutoff_date = get_israel_time() - datetime.timedelta(days=30 * months_back)
    cutoff_date_str = cutoff_date.strftime('%Y-%m-%d')
    
    # ניתוח לפי קטגוריה
    cur.execute("""
        SELECT i.category, COUNT(l.id) as loan_count
        FROM loans l
        JOIN items i ON l.item_id = i.id
        WHERE l.loan_date >= %s
        GROUP BY i.category
        ORDER BY loan_count DESC
    """, (cutoff_date_str,))
    
    usage_by_category = {}
    for row in cur.fetchall():
        usage_by_category[row[0]] = row[1]
    
    # פריטים פופולריים ביותר
    cur.execute("""
        SELECT i.id, i.name, i.category, COUNT(l.id) as loan_count
        FROM loans l
        JOIN items i ON l.item_id = i.id
        WHERE l.loan_date >= %s
        GROUP BY i.id, i.name, i.category
        ORDER BY loan_count DESC
        LIMIT 10
    """, (cutoff_date_str,))
    
    most_popular_items = []
    for row in cur.fetchall():
        most_popular_items.append({
            'id': row[0],
            'name': row[1],
            'category': row[2],
            'loan_count': row[3]
        })
    
    # פריטים פחות פופולריים
    cur.execute("""
        SELECT i.id, i.name, i.category, COUNT(l.id) as loan_count
        FROM loans l
        JOIN items i ON l.item_id = i.id
        WHERE l.loan_date >= %s
        GROUP BY i.id, i.name, i.category
        HAVING COUNT(l.id) > 0
        ORDER BY loan_count ASC
        LIMIT 10
    """, (cutoff_date_str,))
    
    least_popular_items = []
    for row in cur.fetchall():
        least_popular_items.append({
            'id': row[0],
            'name': row[1],
            'category': row[2],
            'loan_count': row[3]
        })
    
    # מגמות שימוש לפי קטגוריה (חלוקה לתקופות)
    # מחשב מקדם גידול בין תקופה מוקדמת לתקופה מאוחרת
    half_period = months_back // 2
    mid_cutoff_date = get_israel_time() - datetime.timedelta(days=30 * half_period)
    mid_cutoff_date_str = mid_cutoff_date.strftime('%Y-%m-%d')
    
    cur.execute("""
        SELECT i.category,
            SUM(CASE WHEN l.loan_date < %s THEN 1 ELSE 0 END) as early_period,
            SUM(CASE WHEN l.loan_date >= %s THEN 1 ELSE 0 END) as later_period
        FROM loans l
        JOIN items i ON l.item_id = i.id
        WHERE l.loan_date >= %s
        GROUP BY i.category
    """, (mid_cutoff_date_str, mid_cutoff_date_str, cutoff_date_str))
    
    trend_by_category = {}
    for row in cur.fetchall():
        category, early, later = row
        # חישוב יחס גידול (אם התקופה המוקדמת היא 0, נקבע ערך יחסי גבוה)
        if early == 0:
            trend_value = 2.0 if later > 0 else 0.0
        else:
            trend_value = float(later) / early
        trend_by_category[category] = trend_value
    
    conn.close()
    
    result = {
        'usage_by_category': usage_by_category,
        'most_popular_items': most_popular_items,
        'least_popular_items': least_popular_items,
        'trend_by_category': trend_by_category,
        'time_period': {
            'months_back': months_back,
            'start_date': cutoff_date.isoformat(),
            'end_date': get_israel_time().isoformat()
        }
    }
    
    return result

def predict_future_demand(params=None):
    """
    חיזוי ביקוש עתידי לפריטים בהתבסס על נתוני העבר
    מודל פשוט מבוסס על ממוצע נע ומגמות
    """
    if params is None:
        params = {}
    
    months_ahead = int(params.get('months_ahead', 3))
    conn = get_db_connection()
    cur = conn.cursor()
    
    # ניתוח היסטוריה של 12 חודשים אחורה
    twelve_months_ago = get_israel_time() - datetime.timedelta(days=365)
    twelve_months_ago_str = twelve_months_ago.strftime('%Y-%m-%d')
    
    # ניתוח לפי חודשים
    cur.execute("""
        SELECT 
            i.id, 
            i.name, 
            i.category,
            date_trunc('month', l.loan_date) as month,
            COUNT(l.id) as loan_count
        FROM loans l
        JOIN items i ON l.item_id = i.id
        WHERE l.loan_date >= %s
        GROUP BY i.id, i.name, i.category, date_trunc('month', l.loan_date)
        ORDER BY i.id, month
    """, (twelve_months_ago_str,))
    
    # עיבוד הנתונים לפי פריט
    monthly_data = {}
    for row in cur.fetchall():
        item_id, item_name, category, month, count = row
        if item_id not in monthly_data:
            monthly_data[item_id] = {
                'id': item_id,
                'name': item_name,
                'category': category,
                'months': {}
            }
        month_str = month.strftime('%Y-%m')
        monthly_data[item_id]['months'][month_str] = count
    
    # חיזוי ביקוש עתידי בהתבסס על מגמות עבר
    predicted_demand = []
    for item_id, data in monthly_data.items():
        if len(data['months']) < 3:  # צריך לפחות 3 חודשים למגמה משמעותית
            continue
        
        # המרה לרשימה מסודרת לפי תאריך
        months_list = sorted(data['months'].keys())
        counts_list = [data['months'][m] for m in months_list]
        
        # חישוב מקדם מגמה פשוט
        if len(counts_list) >= 6:
            # השוואה בין ממוצע 3 חודשים אחרונים ל-3 חודשים שלפניהם
            recent_avg = sum(counts_list[-3:]) / 3
            previous_avg = sum(counts_list[-6:-3]) / 3
            
            if previous_avg > 0:
                trend_factor = recent_avg / previous_avg
            else:
                trend_factor = 1.0 if recent_avg == 0 else 1.5
        else:
            # שימוש במקדם מגמה בסיסי
            trend_factor = 1.1
        
        # חיזוי לפי ממוצע תקופה אחרונה + מקדם מגמה
        recent_avg = sum(counts_list[-3:]) / 3 if len(counts_list) >= 3 else sum(counts_list) / len(counts_list)
        
        # חיזוי לתקופה עתידית
        predictions = []
        for i in range(1, months_ahead + 1):
            predicted_count = recent_avg * (trend_factor ** i)
            
            # חישוב תאריך עתידי
            last_date = datetime.datetime.strptime(months_list[-1], '%Y-%m')
            future_date = last_date + datetime.timedelta(days=30 * i)
            future_month = future_date.strftime('%Y-%m')
            
            predictions.append({
                'month': future_month,
                'predicted_count': round(predicted_count, 1)
            })
        
        predicted_demand.append({
            'id': data['id'],
            'name': data['name'],
            'category': data['category'],
            'current_avg_monthly': round(recent_avg, 1),
            'trend_factor': round(trend_factor, 2),
            'predictions': predictions
        })
    
    # חיזוי לפי קטגוריות
    cur.execute("""
        SELECT 
            i.category,
            date_trunc('month', l.loan_date) as month,
            COUNT(l.id) as loan_count
        FROM loans l
        JOIN items i ON l.item_id = i.id
        WHERE l.loan_date >= %s
        GROUP BY i.category, date_trunc('month', l.loan_date)
        ORDER BY i.category, month
    """, (twelve_months_ago_str,))
    
    # עיבוד הנתונים לפי קטגוריה
    monthly_cat_data = {}
    for row in cur.fetchall():
        category, month, count = row
        if category not in monthly_cat_data:
            monthly_cat_data[category] = {'months': {}}
        month_str = month.strftime('%Y-%m')
        monthly_cat_data[category]['months'][month_str] = count
    
    # חיזוי לפי קטגוריה
    predicted_categories = {}
    for category, data in monthly_cat_data.items():
        if len(data['months']) < 3:  # צריך לפחות 3 חודשים למגמה משמעותית
            continue
        
        # המרה לרשימה מסודרת לפי תאריך
        months_list = sorted(data['months'].keys())
        counts_list = [data['months'][m] for m in months_list]
        
        # חישוב מקדם מגמה פשוט
        if len(counts_list) >= 6:
            # השוואה בין ממוצע 3 חודשים אחרונים ל-3 חודשים שלפניהם
            recent_avg = sum(counts_list[-3:]) / 3
            previous_avg = sum(counts_list[-6:-3]) / 3
            
            if previous_avg > 0:
                trend_factor = recent_avg / previous_avg
            else:
                trend_factor = 1.0 if recent_avg == 0 else 1.5
        else:
            # שימוש במקדם מגמה בסיסי
            trend_factor = 1.1
        
        # חיזוי לפי ממוצע תקופה אחרונה + מקדם מגמה
        recent_avg = sum(counts_list[-3:]) / 3 if len(counts_list) >= 3 else sum(counts_list) / len(counts_list)
        
        # חיזוי לתקופה עתידית
        predictions = []
        for i in range(1, months_ahead + 1):
            predicted_count = recent_avg * (trend_factor ** i)
            
            # חישוב תאריך עתידי
            last_date = datetime.datetime.strptime(months_list[-1], '%Y-%m')
            future_date = last_date + datetime.timedelta(days=30 * i)
            future_month = future_date.strftime('%Y-%m')
            
            predictions.append({
                'month': future_month,
                'predicted_count': round(predicted_count, 1),
                'current_avg_monthly': round(recent_avg, 1),
                'trend_factor': round(trend_factor, 2)
            })
        
        predicted_categories[category] = predictions
    
    conn.close()
    
    result = {
        'predicted_demand': predicted_demand,
        'predicted_categories': predicted_categories,
        'time_period': {
            'months_ahead': months_ahead
        }
    }
    
    return result

def generate_purchase_recommendations(params=None):
    """
    יצירת המלצות לרכש פריטים חדשים בהתבסס על:
    1. ביקוש צפוי
    2. זמינות נוכחית
    3. היסטוריית מחירים
    """
    if params is None:
        params = {}
    
    # המלצות מותאמות פר קטגוריה
    threshold_percents = params.get('threshold_percents', {
        'מצלמה': 50,  # צריך לפחות 50% זמינות בקטגוריה זו
        'תאורה': 30,
        'סאונד': 40,
        'עדשות': 25,
        'default': 20  # ברירת מחדל לשאר הקטגוריות
    })
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # ביקוש עתידי
    future_demand = predict_future_demand(params)
    predicted_items = {item['id']: item for item in future_demand['predicted_demand']}
    
    # בדיקת מצב נוכחי של המלאי
    cur.execute("""
        SELECT 
            id, name, category, quantity, 
            (quantity - COALESCE((
                SELECT SUM(l.quantity) 
                FROM loans l 
                WHERE l.item_id = items.id AND l.return_date IS NULL
            ), 0)) as available_quantity,
            price_per_unit
        FROM items
    """)
    
    inventory_status = {}
    for row in cur.fetchall():
        item_id, name, category, total_qty, available_qty, price = row
        inventory_status[item_id] = {
            'id': item_id,
            'name': name,
            'category': category,
            'total_quantity': total_qty,
            'available_quantity': available_qty,
            'price_per_unit': price if price is not None else 0
        }
    
    # המלצות רכש
    recommendations = []
    
    for item_id, status in inventory_status.items():
        # קביעת סף התראה לפי קטגוריה
        category = status['category']
        threshold_percent = threshold_percents.get(category, threshold_percents['default'])
        
        # חישוב אחוז זמינות נוכחי
        if status['total_quantity'] > 0:
            availability_percent = (status['available_quantity'] / status['total_quantity']) * 100
        else:
            availability_percent = 0
        
        # בדיקה האם זמינות נמוכה מהסף
        if availability_percent < threshold_percent:
            # בדיקה אם יש חיזוי ביקוש עתידי
            future_status = predicted_items.get(item_id)
            
            if future_status:
                # חישוב כמות מומלצת לרכישה
                predicted_max = max([p['predicted_count'] for p in future_status['predictions']])
                recommended_quantity = max(1, int(predicted_max - status['available_quantity']))
                
                if recommended_quantity > 0:
                    recommendations.append({
                        'id': item_id,
                        'name': status['name'],
                        'category': status['category'],
                        'current_quantity': status['total_quantity'],
                        'available_quantity': status['available_quantity'],
                        'availability_percent': round(availability_percent, 1),
                        'predicted_demand': round(predicted_max, 1),
                        'recommended_quantity': recommended_quantity,
                        'price_per_unit': status['price_per_unit'],
                        'total_cost': round(recommended_quantity * status['price_per_unit'], 2),
                        'urgency': 'high' if availability_percent < (threshold_percent / 2) else 'medium'
                    })
            else:
                # אם אין חיזוי אבל זמינות נמוכה מאוד, עדיין ממליץ
                if availability_percent < (threshold_percent / 2):
                    recommendations.append({
                        'id': item_id,
                        'name': status['name'],
                        'category': status['category'],
                        'current_quantity': status['total_quantity'],
                        'available_quantity': status['available_quantity'],
                        'availability_percent': round(availability_percent, 1),
                        'recommended_quantity': max(1, status['total_quantity'] - status['available_quantity']),
                        'price_per_unit': status['price_per_unit'],
                        'total_cost': round(max(1, status['total_quantity'] - status['available_quantity']) * status['price_per_unit'], 2),
                        'urgency': 'medium'
                    })
    
    # מיון לפי דחיפות וקטגוריה
    recommendations.sort(key=lambda x: (0 if x['urgency'] == 'high' else 1, x['category']))
    
    # סיכום לפי קטגוריה
    category_summary = []
    category_totals = {}
    
    for rec in recommendations:
        cat = rec['category']
        if cat not in category_totals:
            category_totals[cat] = {
                'category': cat,
                'item_count': 0,
                'total_cost': 0,
                'high_urgency_count': 0
            }
        
        category_totals[cat]['item_count'] += 1
        category_totals[cat]['total_cost'] += rec['total_cost']
        if rec['urgency'] == 'high':
            category_totals[cat]['high_urgency_count'] += 1
    
    for cat, summary in category_totals.items():
        category_summary.append(summary)
    
    # מיון לפי דחיפות (כמות פריטים דחופים)
    category_summary.sort(key=lambda x: x['high_urgency_count'], reverse=True)
    
    conn.close()
    
    result = {
        'recommendations': recommendations,
        'category_summary': category_summary
    }
    
    return result

def comparative_periods_analysis(params=None):
    """
    השוואה בין שתי תקופות זמן - מאפשר להשוות שימוש בין סמסטרים או שנים
    """
    if params is None:
        params = {}
    
    # פרמטרים של התקופות להשוואה
    period1_start = params.get('period1_start', '')
    period1_end = params.get('period1_end', '')
    period2_start = params.get('period2_start', '')
    period2_end = params.get('period2_end', '')
    
    # אם לא סופקו תאריכים, נשתמש בברירת מחדל של סמסטר נוכחי מול קודם
    now = get_israel_time()
    
    if not period1_start or not period1_end or not period2_start or not period2_end:
        # תקופה 2: סמסטר נוכחי
        period2_end = now.strftime('%Y-%m-%d')
        period2_start = (now - datetime.timedelta(days=180)).strftime('%Y-%m-%d')
        
        # תקופה 1: סמסטר קודם
        period1_end = (now - datetime.timedelta(days=180)).strftime('%Y-%m-%d')
        period1_start = (now - datetime.timedelta(days=360)).strftime('%Y-%m-%d')
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # השוואת הלוואות פריטים בין התקופות
    cur.execute("""
        WITH period1 AS (
            SELECT i.id, i.name, i.category, COUNT(l.id) as loan_count, SUM(l.quantity) as total_qty
            FROM loans l
            JOIN items i ON l.item_id = i.id
            WHERE l.loan_date BETWEEN %s AND %s
            GROUP BY i.id, i.name, i.category
        ), 
        period2 AS (
            SELECT i.id, i.name, i.category, COUNT(l.id) as loan_count, SUM(l.quantity) as total_qty
            FROM loans l
            JOIN items i ON l.item_id = i.id
            WHERE l.loan_date BETWEEN %s AND %s
            GROUP BY i.id, i.name, i.category
        )
        SELECT 
            COALESCE(p1.id, p2.id) as id,
            COALESCE(p1.name, p2.name) as name,
            COALESCE(p1.category, p2.category) as category,
            COALESCE(p1.loan_count, 0) as period1_loans,
            COALESCE(p1.total_qty, 0) as period1_qty,
            COALESCE(p2.loan_count, 0) as period2_loans,
            COALESCE(p2.total_qty, 0) as period2_qty
        FROM period1 p1
        FULL OUTER JOIN period2 p2 ON p1.id = p2.id
        ORDER BY 
            COALESCE(p2.loan_count, 0) - COALESCE(p1.loan_count, 0) DESC,
            COALESCE(p2.loan_count, 0) DESC
    """, (period1_start, period1_end, period2_start, period2_end))
    
    item_comparison = []
    for row in cur.fetchall():
        id, name, category, p1_loans, p1_qty, p2_loans, p2_qty = row
        
        # חישוב שינוי באחוזים
        if p1_loans > 0:
            loan_change_percent = ((p2_loans - p1_loans) / p1_loans) * 100
        else:
            loan_change_percent = float('inf') if p2_loans > 0 else 0
        
        if p1_qty > 0:
            qty_change_percent = ((p2_qty - p1_qty) / p1_qty) * 100
        else:
            qty_change_percent = float('inf') if p2_qty > 0 else 0
        
        item_comparison.append({
            'id': id,
            'name': name,
            'category': category,
            'period1_loans': p1_loans,
            'period1_quantity': p1_qty,
            'period2_loans': p2_loans,
            'period2_quantity': p2_qty,
            'loan_change': p2_loans - p1_loans,
            'loan_change_percent': round(loan_change_percent, 1) if loan_change_percent != float('inf') else None,
            'quantity_change': p2_qty - p1_qty,
            'quantity_change_percent': round(qty_change_percent, 1) if qty_change_percent != float('inf') else None
        })
    
    # השוואת קטגוריות בין התקופות
    cur.execute("""
        WITH period1 AS (
            SELECT i.category, COUNT(l.id) as loan_count, SUM(l.quantity) as total_qty,
                COUNT(DISTINCT l.student_id) as unique_students
            FROM loans l
            JOIN items i ON l.item_id = i.id
            WHERE l.loan_date BETWEEN %s AND %s
            GROUP BY i.category
        ), 
        period2 AS (
            SELECT i.category, COUNT(l.id) as loan_count, SUM(l.quantity) as total_qty,
                COUNT(DISTINCT l.student_id) as unique_students
            FROM loans l
            JOIN items i ON l.item_id = i.id
            WHERE l.loan_date BETWEEN %s AND %s
            GROUP BY i.category
        )
        SELECT 
            COALESCE(p1.category, p2.category) as category,
            COALESCE(p1.loan_count, 0) as period1_loans,
            COALESCE(p1.total_qty, 0) as period1_qty,
            COALESCE(p1.unique_students, 0) as period1_students,
            COALESCE(p2.loan_count, 0) as period2_loans,
            COALESCE(p2.total_qty, 0) as period2_qty,
            COALESCE(p2.unique_students, 0) as period2_students
        FROM period1 p1
        FULL OUTER JOIN period2 p2 ON p1.category = p2.category
        ORDER BY 
            COALESCE(p2.loan_count, 0) - COALESCE(p1.loan_count, 0) DESC,
            COALESCE(p2.loan_count, 0) DESC
    """, (period1_start, period1_end, period2_start, period2_end))
    
    category_comparison = []
    for row in cur.fetchall():
        category, p1_loans, p1_qty, p1_students, p2_loans, p2_qty, p2_students = row
        
        # חישוב שינוי באחוזים
        if p1_loans > 0:
            loan_change_percent = ((p2_loans - p1_loans) / p1_loans) * 100
        else:
            loan_change_percent = float('inf') if p2_loans > 0 else 0
        
        if p1_qty > 0:
            qty_change_percent = ((p2_qty - p1_qty) / p1_qty) * 100
        else:
            qty_change_percent = float('inf') if p2_qty > 0 else 0
        
        if p1_students > 0:
            students_change_percent = ((p2_students - p1_students) / p1_students) * 100
        else:
            students_change_percent = float('inf') if p2_students > 0 else 0
        
        category_comparison.append({
            'category': category,
            'period1_loans': p1_loans,
            'period1_quantity': p1_qty,
            'period1_students': p1_students,
            'period2_loans': p2_loans,
            'period2_quantity': p2_qty,
            'period2_students': p2_students,
            'loan_change': p2_loans - p1_loans,
            'loan_change_percent': round(loan_change_percent, 1) if loan_change_percent != float('inf') else None,
            'quantity_change': p2_qty - p1_qty,
            'quantity_change_percent': round(qty_change_percent, 1) if qty_change_percent != float('inf') else None,
            'students_change': p2_students - p1_students,
            'students_change_percent': round(students_change_percent, 1) if students_change_percent != float('inf') else None
        })
    
    # סיכום כללי
    cur.execute("""
        SELECT COUNT(*) FROM loans WHERE loan_date BETWEEN %s AND %s
    """, (period1_start, period1_end))
    period1_total_loans = cur.fetchone()[0]
    
    cur.execute("""
        SELECT COUNT(*) FROM loans WHERE loan_date BETWEEN %s AND %s
    """, (period2_start, period2_end))
    period2_total_loans = cur.fetchone()[0]
    
    conn.close()
    
    result = {
        'item_comparison': item_comparison,
        'category_comparison': category_comparison,
        'period1': {
            'start': period1_start,
            'end': period1_end,
            'total_loans': period1_total_loans
        },
        'period2': {
            'start': period2_start,
            'end': period2_end,
            'total_loans': period2_total_loans
        },
        'total_change_percent': round(((period2_total_loans - period1_total_loans) / period1_total_loans * 100), 1) if period1_total_loans > 0 else None
    }
    
    return result

def export_advanced_report(report_type, params=None):
    """
    ייצוא דו"חות מתקדמים בפורמטים שונים
    """
    if params is None:
        params = {}
    
    if report_type == 'usage_trends':
        return analyze_usage_trends(params)
    elif report_type == 'future_demand':
        return predict_future_demand(params)
    elif report_type == 'purchase_recommendations':
        return generate_purchase_recommendations(params)
    elif report_type == 'comparative_periods':
        return comparative_periods_analysis(params)
    else:
        return {'error': f'סוג דו"ח לא מוכר: {report_type}'}

def main():
    """פונקציה ראשית"""
    try:
        # קריאת נתוני ה-request מה-input הסטנדרטי
        request_data = json.loads(sys.stdin.read())
        
        # שליפת הפרמטרים מהבקשה
        report_type = request_data.get('report_type', '')
        params = request_data.get('params', {})
        
        if not report_type:
            result = {
                'success': False,
                'error': 'לא סופק סוג דו"ח (report_type)'
            }
        else:
            # הפקת הדו"ח המבוקש
            result = {
                'success': True,
                'report_type': report_type,
                'data': export_advanced_report(report_type, params)
            }
        
        # החזרת התוצאה ב-JSON
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': f'שגיאה בהפקת הדו"ח: {str(e)}'
        }))

if __name__ == "__main__":
    main()