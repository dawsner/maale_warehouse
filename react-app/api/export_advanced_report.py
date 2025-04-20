"""
סקריפט API לייצוא דו"חות מתקדמים בפורמטים שונים (Excel, CSV, JSON)
"""

import os
import sys
import json
import datetime
import traceback
import pandas as pd
import io
import tempfile
import base64

# הוספת תיקיית השורש לpath כדי לאפשר import של מודולים אחרים
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(parent_dir)

# ייבוא המודול לניתוח מתקדם
from advanced_analytics import (
    analyze_usage_trends,
    predict_future_demand,
    generate_purchase_recommendations,
    comparative_periods_analysis,
    export_advanced_report
)

class DateTimeEncoder(json.JSONEncoder):
    """מחלקה להמרת אובייקטי תאריך ל-JSON"""
    def default(self, o):
        if isinstance(o, (datetime.datetime, datetime.date)):
            return o.isoformat()
        return super().default(o)

def create_excel_report(report_type, data):
    """יצירת קובץ אקסל מנתוני הדו"ח"""
    output = io.BytesIO()
    
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        if report_type == 'usage_trends':
            # דף 1: שימוש לפי קטגוריה
            if data.get('usage_by_category'):
                df_category = pd.DataFrame.from_dict(data['usage_by_category'], orient='index', columns=['loan_count'])
                df_category.index.name = 'category'
                df_category.reset_index(inplace=True)
                df_category.to_excel(writer, sheet_name='Usage by Category', index=False)
            
            # דף 2: פריטים פופולריים
            if data.get('most_popular_items'):
                df_popular = pd.DataFrame(data['most_popular_items'])
                df_popular.to_excel(writer, sheet_name='Popular Items', index=False)
            
            # דף 3: פריטים פחות פופולריים
            if data.get('least_popular_items'):
                df_unpopular = pd.DataFrame(data['least_popular_items'])
                df_unpopular.to_excel(writer, sheet_name='Least Popular Items', index=False)
            
            # דף 4: מגמות לפי קטגוריה
            if data.get('trend_by_category'):
                df_trends = pd.DataFrame.from_dict(data['trend_by_category'], orient='index', columns=['trend_value'])
                df_trends.index.name = 'category'
                df_trends.reset_index(inplace=True)
                df_trends.to_excel(writer, sheet_name='Category Trends', index=False)
        
        elif report_type == 'future_demand':
            # דף 1: חיזוי ביקוש לפי פריט
            if data.get('predicted_demand'):
                df_demand = pd.DataFrame(data['predicted_demand'])
                df_demand.to_excel(writer, sheet_name='Predicted Item Demand', index=False)
            
            # דף 2: חיזוי ביקוש לפי קטגוריה
            if data.get('predicted_categories'):
                category_data = []
                for category, predictions in data['predicted_categories'].items():
                    for pred in predictions:
                        pred['category'] = category
                        category_data.append(pred)
                
                if category_data:
                    df_cat_pred = pd.DataFrame(category_data)
                    df_cat_pred.to_excel(writer, sheet_name='Predicted Category Demand', index=False)
        
        elif report_type == 'purchase_recommendations':
            # דף 1: המלצות רכש לפי פריט
            if data.get('recommendations'):
                df_recs = pd.DataFrame(data['recommendations'])
                df_recs.to_excel(writer, sheet_name='Purchase Recommendations', index=False)
            
            # דף 2: סיכום לפי קטגוריה
            if data.get('category_summary'):
                df_cat_summary = pd.DataFrame(data['category_summary'])
                df_cat_summary.to_excel(writer, sheet_name='Category Summary', index=False)
        
        elif report_type == 'comparative_periods':
            # דף 1: השוואת פריטים בין תקופות
            if data.get('item_comparison'):
                df_items = pd.DataFrame(data['item_comparison'])
                df_items.to_excel(writer, sheet_name='Item Comparison', index=False)
            
            # דף 2: השוואת קטגוריות בין תקופות
            if data.get('category_comparison'):
                df_cats = pd.DataFrame(data['category_comparison'])
                df_cats.to_excel(writer, sheet_name='Category Comparison', index=False)
            
            # דף 3: מידע כללי
            if data.get('period1') and data.get('period2'):
                period_info = {
                    'Period': ['Period 1', 'Period 2'],
                    'Start Date': [data['period1']['start'], data['period2']['start']],
                    'End Date': [data['period1']['end'], data['period2']['end']],
                    'Total Loans': [data['period1']['total_loans'], data['period2']['total_loans']]
                }
                df_info = pd.DataFrame(period_info)
                df_info.to_excel(writer, sheet_name='Period Info', index=False)
    
    output.seek(0)
    return output.getvalue()

def create_csv_report(report_type, data):
    """יצירת קובץ CSV מנתוני הדו"ח"""
    if report_type == 'usage_trends' and data.get('most_popular_items'):
        return pd.DataFrame(data['most_popular_items']).to_csv(index=False)
    
    elif report_type == 'future_demand' and data.get('predicted_demand'):
        return pd.DataFrame(data['predicted_demand']).to_csv(index=False)
    
    elif report_type == 'purchase_recommendations' and data.get('recommendations'):
        return pd.DataFrame(data['recommendations']).to_csv(index=False)
    
    elif report_type == 'comparative_periods' and data.get('item_comparison'):
        return pd.DataFrame(data['item_comparison']).to_csv(index=False)
    
    return "No data available for CSV export"

def main():
    """פונקציה ראשית לייצוא דו"חות"""
    try:
        # קריאת נתוני ה-request מה-input הסטנדרטי
        request_data = json.loads(sys.stdin.read())
        
        # שליפת הפרמטרים מהבקשה
        report_type = request_data.get('report_type', '')
        params = request_data.get('params', {})
        format = request_data.get('format', 'json').lower()  # json, excel, csv
        
        if not report_type:
            result = {
                'success': False,
                'error': 'לא סופק סוג דו"ח (report_type)'
            }
            print(json.dumps(result, cls=DateTimeEncoder))
            return
        
        # הפקת הדו"ח המבוקש
        report_data = export_advanced_report(report_type, params)
        
        # החזרת הדו"ח בפורמט המבוקש
        if format == 'json':
            result = {
                'success': True,
                'report_type': report_type,
                'data': report_data,
                'format': 'json',
                'generated_at': datetime.datetime.now().isoformat()
            }
            print(json.dumps(result, cls=DateTimeEncoder))
            
        elif format == 'excel':
            excel_data = create_excel_report(report_type, report_data)
            encoded_excel = base64.b64encode(excel_data).decode('utf-8')
            
            result = {
                'success': True,
                'report_type': report_type,
                'format': 'excel',
                'filename': f'{report_type}_report.xlsx',
                'data': encoded_excel,
                'generated_at': datetime.datetime.now().isoformat()
            }
            print(json.dumps(result, cls=DateTimeEncoder))
            
        elif format == 'csv':
            csv_data = create_csv_report(report_type, report_data)
            encoded_csv = base64.b64encode(csv_data.encode('utf-8')).decode('utf-8')
            
            result = {
                'success': True,
                'report_type': report_type,
                'format': 'csv',
                'filename': f'{report_type}_report.csv',
                'data': encoded_csv,
                'generated_at': datetime.datetime.now().isoformat()
            }
            print(json.dumps(result, cls=DateTimeEncoder))
        
        else:
            result = {
                'success': False,
                'error': f'פורמט לא נתמך: {format}'
            }
            print(json.dumps(result, cls=DateTimeEncoder))
        
    except Exception as e:
        error_details = traceback.format_exc()
        print(json.dumps({
            'success': False,
            'error': f'שגיאה בייצוא הדו"ח: {str(e)}',
            'details': error_details
        }, cls=DateTimeEncoder))

if __name__ == "__main__":
    main()