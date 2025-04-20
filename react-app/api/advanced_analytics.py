"""
מודול לניתוח נתונים מתקדם, מגמות שימוש והמלצות רכש חכמות.
כולל פונקציות לחיזוי ביקוש, ניתוח מגמות והמלצות רכש אוטומטיות.
"""

import os
import sys
import json
import datetime
from datetime import timedelta
import pandas as pd
import numpy as np
from collections import defaultdict
import pytz
from dateutil.relativedelta import relativedelta

# הוספת תיקיית השורש לpath כדי לאפשר import של מודולים אחרים
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
import database

def get_israel_time():
    """מחזיר את השעה הנוכחית בישראל"""
    israel_tz = pytz.timezone('Asia/Jerusalem')
    return datetime.datetime.now(israel_tz)

def get_db_connection():
    """יוצר חיבור למסד הנתונים"""
    return database.get_db_connection()

# -------------------------
# ניתוח מגמות שימוש בציוד
# -------------------------

def analyze_usage_trends(months_back=12):
    """
    מנתח מגמות שימוש בציוד לאורך זמן
    חזרה: נתונים על תדירות השימוש בפריטים לפי קטגוריות, מגמות לאורך זמן
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    # תאריך התחלה לניתוח - X חודשים אחורה
    start_date = (get_israel_time() - relativedelta(months=months_back)).strftime('%Y-%m-%d')
    
    # שליפת נתוני השאלות בטווח הזמן
    cur.execute("""
        SELECT l.item_id, i.name, i.category, 
               TO_CHAR(l.loan_date, 'YYYY-MM') as month,
               COUNT(*) as loan_count
        FROM loans l
        JOIN items i ON l.item_id = i.id
        WHERE l.loan_date >= %s
        GROUP BY l.item_id, i.name, i.category, month
        ORDER BY month, loan_count DESC
    """, (start_date,))
    
    loans_data = cur.fetchall()
    
    # יצירת DataFrame מהנתונים
    df = pd.DataFrame(loans_data, columns=['item_id', 'item_name', 'category', 'month', 'loan_count'])
    
    # ניתוח מגמות לאורך זמן - חישוב השינוי החודשי בשימוש
    trend_analysis = {}
    
    # אם אין מספיק נתונים, נחזיר מבנה נתונים ריק
    if df.empty:
        return {
            'usage_by_category': {},
            'usage_by_month': {},
            'trend_by_category': {},
            'most_popular_items': [],
            'least_popular_items': [],
            'growth_items': []
        }
    
    # ניתוח לפי קטגוריה
    usage_by_category = df.groupby('category')['loan_count'].sum().to_dict()
    
    # ניתוח לפי חודש
    df['month_date'] = pd.to_datetime(df['month'] + '-01')
    df = df.sort_values('month_date')
    usage_by_month = df.groupby(['month', 'category'])['loan_count'].sum().unstack().fillna(0).to_dict()
    
    # ניתוח מגמות לפי קטגוריה
    trend_by_category = {}
    for category in df['category'].unique():
        category_data = df[df['category'] == category].groupby('month')['loan_count'].sum()
        if len(category_data) > 1:
            # חישוב אחוז השינוי הממוצע בין חודשים
            pct_changes = category_data.pct_change().dropna()
            avg_change = pct_changes.mean() if not pct_changes.empty else 0
            trend_by_category[category] = avg_change
        else:
            trend_by_category[category] = 0
    
    # זיהוי פריטים פופולריים ביותר
    popular_items = df.groupby(['item_id', 'item_name', 'category'])['loan_count'].sum().reset_index().sort_values('loan_count', ascending=False).head(10)
    popular_items_list = popular_items.to_dict('records')
    
    # זיהוי פריטים פחות פופולריים
    unpopular_items = df.groupby(['item_id', 'item_name', 'category'])['loan_count'].sum().reset_index().sort_values('loan_count').head(10)
    unpopular_items_list = unpopular_items.to_dict('records')
    
    # פריטים עם הצמיחה המהירה ביותר
    growth_items = []
    
    # סגירת החיבור
    cur.close()
    conn.close()
    
    return {
        'usage_by_category': usage_by_category,
        'usage_by_month': usage_by_month,
        'trend_by_category': trend_by_category,
        'most_popular_items': popular_items_list,
        'least_popular_items': unpopular_items_list,
        'growth_items': growth_items
    }

# -------------------------
# חיזוי ביקוש עתידי
# -------------------------

def predict_future_demand(months_ahead=3):
    """
    חיזוי ביקוש עתידי לפריטים בהתבסס על נתוני העבר
    מודל פשוט מבוסס על ממוצע נע ומגמות
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    # קבלת נתוני ההשאלות לפי חודשים
    cur.execute("""
        SELECT 
            i.id as item_id, 
            i.name as item_name, 
            i.category,
            TO_CHAR(l.loan_date, 'YYYY-MM') as month,
            COUNT(*) as loan_count
        FROM loans l
        JOIN items i ON l.item_id = i.id
        WHERE l.loan_date >= NOW() - INTERVAL '12 months'
        GROUP BY i.id, i.name, i.category, month
        ORDER BY i.id, month
    """)
    
    loans_data = cur.fetchall()
    
    # יצירת DataFrame
    df = pd.DataFrame(loans_data, columns=['item_id', 'item_name', 'category', 'month', 'loan_count'])
    
    if df.empty:
        return {
            'predicted_demand': [],
            'predicted_categories': {}
        }
    
    # המרת חודש לאובייקט תאריך לצורך חישובים
    df['month_date'] = pd.to_datetime(df['month'] + '-01')
    df = df.sort_values(['item_id', 'month_date'])
    
    # חיזוי ביקוש עתידי לכל פריט
    predicted_demand = []
    
    # רשימת כל החודשים העתידיים שנרצה לחזות
    future_months = [(get_israel_time() + relativedelta(months=i)).strftime('%Y-%m') 
                    for i in range(1, months_ahead + 1)]
    
    # חיזוי לפי פריט
    for item_id in df['item_id'].unique():
        item_data = df[df['item_id'] == item_id]
        if len(item_data) <= 1:  # צריך לפחות 2 נקודות מידע לחיזוי
            continue
            
        item_name = item_data['item_name'].iloc[0]
        category = item_data['category'].iloc[0]
        
        # מודל חיזוי פשוט - ממוצע נע + מגמה
        loan_counts = item_data['loan_count'].tolist()
        
        # חישוב מגמה פשוטה (שיפוע)
        if len(loan_counts) >= 3:
            recent_trend = (loan_counts[-1] - loan_counts[-2]) + (loan_counts[-2] - loan_counts[-3]) / 2
        elif len(loan_counts) == 2:
            recent_trend = loan_counts[-1] - loan_counts[-2]
        else:
            recent_trend = 0
            
        # חיזוי לפי ממוצע + מגמה
        last_count = loan_counts[-1]
        avg_count = sum(loan_counts) / len(loan_counts)
        
        for i, future_month in enumerate(future_months):
            predicted_count = max(0, last_count + (recent_trend * (i+1)))
            weighted_prediction = (predicted_count * 0.7) + (avg_count * 0.3)  # שילוב של מגמה וממוצע
            
            predicted_demand.append({
                'item_id': item_id,
                'item_name': item_name,
                'category': category,
                'month': future_month,
                'predicted_count': round(weighted_prediction, 1)
            })
    
    # חיזוי ביקוש לפי קטגוריות
    df_category = df.groupby(['category', 'month'])['loan_count'].sum().reset_index()
    df_category['month_date'] = pd.to_datetime(df_category['month'] + '-01')
    df_category = df_category.sort_values(['category', 'month_date'])
    
    predicted_categories = {}
    
    for category in df_category['category'].unique():
        category_data = df_category[df_category['category'] == category]
        if len(category_data) <= 1:
            continue
            
        loan_counts = category_data['loan_count'].tolist()
        
        # חישוב מגמה
        if len(loan_counts) >= 3:
            recent_trend = (loan_counts[-1] - loan_counts[-2]) + (loan_counts[-2] - loan_counts[-3]) / 2
        elif len(loan_counts) == 2:
            recent_trend = loan_counts[-1] - loan_counts[-2]
        else:
            recent_trend = 0
            
        last_count = loan_counts[-1]
        avg_count = sum(loan_counts) / len(loan_counts)
        
        category_predictions = []
        for i, future_month in enumerate(future_months):
            predicted_count = max(0, last_count + (recent_trend * (i+1)))
            weighted_prediction = (predicted_count * 0.7) + (avg_count * 0.3)
            
            category_predictions.append({
                'month': future_month,
                'predicted_count': round(weighted_prediction, 1)
            })
            
        predicted_categories[category] = category_predictions
    
    # סגירת החיבור
    cur.close()
    conn.close()
    
    return {
        'predicted_demand': predicted_demand,
        'predicted_categories': predicted_categories
    }

# -------------------------
# המלצות רכש חכמות
# -------------------------

def generate_purchase_recommendations():
    """
    יצירת המלצות לרכש פריטים חדשים בהתבסס על:
    1. ביקוש צפוי
    2. זמינות נוכחית
    3. היסטוריית מחירים
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    # קבלת נתוני מלאי נוכחיים
    cur.execute("""
        SELECT 
            id, name, category, quantity, 
            COALESCE(price_per_unit, 0) as price_per_unit,
            COALESCE(loaned_quantity, 0) as loaned_quantity
        FROM items 
        WHERE quantity > 0
    """)
    
    inventory_data = cur.fetchall()
    inventory_df = pd.DataFrame(inventory_data, columns=['item_id', 'name', 'category', 'quantity', 'price_per_unit', 'loaned_quantity'])
    
    # חישוב אחוז הניצולת הנוכחי (כמה אחוזים מהמלאי מושאל כרגע)
    inventory_df['utilization'] = (inventory_df['loaned_quantity'] / inventory_df['quantity']).fillna(0)
    
    # קבלת נתוני השאלות של 3 החודשים האחרונים
    cur.execute("""
        SELECT 
            l.item_id,
            COUNT(*) as loan_count,
            MAX(l.due_date - l.loan_date) as max_loan_period
        FROM loans l
        WHERE l.loan_date >= NOW() - INTERVAL '3 months'
        GROUP BY l.item_id
    """)
    
    recent_loans = cur.fetchall()
    loans_df = pd.DataFrame(recent_loans, columns=['item_id', 'loan_count', 'max_loan_period'])
    
    # מיזוג נתוני מלאי והשאלות
    merged_df = inventory_df.merge(loans_df, on='item_id', how='left')
    merged_df['loan_count'] = merged_df['loan_count'].fillna(0)
    merged_df['max_loan_period'] = merged_df['max_loan_period'].fillna(0)
    
    # חישוב דרישה יחסית - כמה פעמים בממוצע מבקשים כל פריט ביחס לכמות במלאי
    merged_df['demand_ratio'] = merged_df['loan_count'] / merged_df['quantity']
    
    # זיהוי פריטים שכדאי לרכוש עוד מהם - בעלי ביקוש גבוה או ניצולת גבוהה
    merged_df['purchase_score'] = (0.7 * merged_df['utilization']) + (0.3 * merged_df['demand_ratio'])
    
    # סינון הפריטים המומלצים לרכישה (ציון מעל 0.5)
    recommended_items = merged_df[merged_df['purchase_score'] > 0.5].sort_values('purchase_score', ascending=False)
    
    # קביעת כמות מומלצת לרכישה
    recommended_items['suggested_quantity'] = np.ceil(recommended_items['quantity'] * 0.3)  # תוספת של 30% מהכמות הקיימת
    recommended_items['suggested_quantity'] = recommended_items['suggested_quantity'].astype(int)
    recommended_items.loc[recommended_items['suggested_quantity'] < 1, 'suggested_quantity'] = 1
    
    # חישוב עלות משוערת
    recommended_items['estimated_cost'] = recommended_items['suggested_quantity'] * recommended_items['price_per_unit']
    
    # הכנת רשימת התוצאות
    recommendations = recommended_items[[
        'item_id', 'name', 'category', 'quantity', 'loan_count', 
        'utilization', 'purchase_score', 'suggested_quantity', 'price_per_unit', 'estimated_cost'
    ]].to_dict('records')
    
    # קבלת סיכום לפי קטגוריה
    category_summary = recommended_items.groupby('category').agg({
        'suggested_quantity': 'sum',
        'estimated_cost': 'sum'
    }).reset_index().to_dict('records')
    
    # סגירת החיבור
    cur.close()
    conn.close()
    
    return {
        'recommendations': recommendations,
        'category_summary': category_summary,
        'total_cost': recommended_items['estimated_cost'].sum()
    }

# -------------------------
# השוואה בין תקופות
# -------------------------

def comparative_periods_analysis(period1_start, period1_end, period2_start, period2_end):
    """
    השוואה בין שתי תקופות זמן - מאפשר להשוות שימוש בין סמסטרים או שנים
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    # הגדרת שאילתא לקבלת נתוני השאלות בטווח תאריכים
    query = """
        SELECT 
            i.id, i.name, i.category,
            COUNT(*) as loan_count
        FROM loans l
        JOIN items i ON l.item_id = i.id
        WHERE l.loan_date BETWEEN %s AND %s
        GROUP BY i.id, i.name, i.category
    """
    
    # קבלת נתונים עבור תקופה 1
    cur.execute(query, (period1_start, period1_end))
    period1_data = cur.fetchall()
    period1_df = pd.DataFrame(period1_data, columns=['item_id', 'name', 'category', 'loan_count'])
    
    # קבלת נתונים עבור תקופה 2
    cur.execute(query, (period2_start, period2_end))
    period2_data = cur.fetchall()
    period2_df = pd.DataFrame(period2_data, columns=['item_id', 'name', 'category', 'loan_count'])
    
    # מיזוג הנתונים משתי התקופות
    merged_df = period1_df.merge(period2_df, on=['item_id', 'name', 'category'], how='outer', suffixes=('_period1', '_period2'))
    merged_df = merged_df.fillna(0)
    
    # חישוב השינוי באחוזים בין התקופות
    merged_df['change'] = merged_df['loan_count_period2'] - merged_df['loan_count_period1']
    merged_df['change_percent'] = 0.0
    
    # טיפול במקרה של חלוקה באפס
    mask = merged_df['loan_count_period1'] > 0
    merged_df.loc[mask, 'change_percent'] = ((merged_df.loc[mask, 'loan_count_period2'] - 
                                           merged_df.loc[mask, 'loan_count_period1']) / 
                                           merged_df.loc[mask, 'loan_count_period1']) * 100
    
    # אם loan_count_period1 הוא 0 והשני גדול מ-0, השינוי הוא 100%
    mask = (merged_df['loan_count_period1'] == 0) & (merged_df['loan_count_period2'] > 0)
    merged_df.loc[mask, 'change_percent'] = 100.0
    
    # סיכום לפי קטגוריה
    category_summary = merged_df.groupby('category').agg({
        'loan_count_period1': 'sum',
        'loan_count_period2': 'sum'
    }).reset_index()
    
    category_summary['change'] = category_summary['loan_count_period2'] - category_summary['loan_count_period1']
    category_summary['change_percent'] = 0.0
    
    mask = category_summary['loan_count_period1'] > 0
    category_summary.loc[mask, 'change_percent'] = ((category_summary.loc[mask, 'loan_count_period2'] - 
                                                   category_summary.loc[mask, 'loan_count_period1']) / 
                                                   category_summary.loc[mask, 'loan_count_period1']) * 100
    
    # סגירת החיבור
    cur.close()
    conn.close()
    
    return {
        'item_comparison': merged_df.sort_values('change_percent', ascending=False).to_dict('records'),
        'category_comparison': category_summary.sort_values('change_percent', ascending=False).to_dict('records'),
        'period1': {
            'start': period1_start,
            'end': period1_end,
            'total_loans': int(period1_df['loan_count'].sum())
        },
        'period2': {
            'start': period2_start,
            'end': period2_end,
            'total_loans': int(period2_df['loan_count'].sum())
        }
    }

# -------------------------
# יצוא דו"חות מתקדמים
# -------------------------

def export_advanced_report(report_type, params=None):
    """
    ייצוא דו"חות מתקדמים בפורמטים שונים
    """
    if params is None:
        params = {}
    
    if report_type == 'usage_trends':
        months_back = params.get('months_back', 12)
        data = analyze_usage_trends(months_back)
    elif report_type == 'future_demand':
        months_ahead = params.get('months_ahead', 3)
        data = predict_future_demand(months_ahead)
    elif report_type == 'purchase_recommendations':
        data = generate_purchase_recommendations()
    elif report_type == 'comparative_periods':
        period1_start = params.get('period1_start')
        period1_end = params.get('period1_end')
        period2_start = params.get('period2_start')
        period2_end = params.get('period2_end')
        
        if not all([period1_start, period1_end, period2_start, period2_end]):
            return {'error': 'חסרים פרמטרים נדרשים עבור דו"ח השוואתי'}
            
        data = comparative_periods_analysis(period1_start, period1_end, period2_start, period2_end)
    else:
        return {'error': 'סוג דו"ח לא נתמך'}
    
    return data

# -------------------------
# פונקציה ראשית להפעלה
# -------------------------

def main():
    """פונקציה ראשית"""
    try:
        # קבלת פרמטרים מה-request
        request_json = json.loads(sys.stdin.read())
        report_type = request_json.get('report_type', '')
        params = request_json.get('params', {})
        
        result = export_advanced_report(report_type, params)
        
        # החזרת תוצאות ב-JSON
        print(json.dumps(result, default=str))
        
    except Exception as e:
        print(json.dumps({
            'error': f'שגיאה בייצוא הדו"ח: {str(e)}'
        }))

if __name__ == "__main__":
    main()