"""
סקריפט זה מאפשר שליחת התראות בדואר אלקטרוני עבור השאלות באיחור או פריטים שהמלאי שלהם נמוך
"""

import sys
import json
import datetime
import os
import smtplib
import pytz
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def get_israel_time():
    """מחזיר את השעה הנוכחית בישראל"""
    israel_tz = pytz.timezone('Asia/Jerusalem')
    return datetime.datetime.now(israel_tz)

def send_email(recipient_email, subject, html_content, text_content=None):
    """
    שולח אימייל באמצעות SMTP
    
    Parameters:
    recipient_email (str): כתובת המייל של הנמען
    subject (str): נושא ההודעה
    html_content (str): תוכן HTML של ההודעה
    text_content (str, optional): תוכן טקסטואלי של ההודעה (למקרה שלא ניתן להציג HTML)
    
    Returns:
    bool: האם ההודעה נשלחה בהצלחה
    """
    # הגדרות השרת - בסביבת הפיתוח נשתמש ב-dummy server כדי לא לשלוח אימיילים אמיתיים
    EMAIL_HOST = os.environ.get('EMAIL_HOST', 'localhost')
    EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 1025))  # 1025 is the default port for the dummy SMTP server
    EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
    EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
    EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'False').lower() == 'true'
    DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'notifications@cinema-equipment.example.com')
    
    # יצירת הודעת דוא"ל
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = DEFAULT_FROM_EMAIL
    msg['To'] = recipient_email
    
    # הוספת תוכן טקסטואלי (אופציונלי)
    if text_content:
        msg.attach(MIMEText(text_content, 'plain', 'utf-8'))
    
    # הוספת תוכן HTML
    msg.attach(MIMEText(html_content, 'html', 'utf-8'))
    
    try:
        # פתיחת חיבור ושליחת ההודעה
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            if EMAIL_USE_TLS:
                server.starttls()
            
            if EMAIL_HOST_USER and EMAIL_HOST_PASSWORD:
                server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
            
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def create_overdue_loan_email(loan_data):
    """
    יוצר תבנית אימייל עבור השאלה באיחור
    
    Parameters:
    loan_data (dict): נתוני ההשאלה באיחור
    
    Returns:
    tuple: (נושא האימייל, תוכן HTML, תוכן טקסטואלי)
    """
    student_name = loan_data.get('student_name', '')
    item_name = loan_data.get('item_name', '')
    days_overdue = loan_data.get('days_overdue', 0)
    due_date = loan_data.get('due_date', '')
    
    if isinstance(due_date, datetime.date):
        due_date = due_date.strftime('%d/%m/%Y')
    
    subject = f"תזכורת: איחור בהחזרת הציוד {item_name}"
    
    html_content = f"""
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #d32f2f; text-align: center; margin-bottom: 20px;">תזכורת: איחור בהחזרת ציוד</h2>
        
        <p style="margin-bottom: 15px;">שלום {student_name},</p>
        
        <p style="margin-bottom: 15px;">אנו מבקשים להזכיר כי חלף מועד החזרת הציוד שהושאל לך:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p><strong>פריט:</strong> {item_name}</p>
            <p><strong>תאריך החזרה מתוכנן:</strong> {due_date}</p>
            <p><strong>ימי איחור:</strong> <span style="color: #d32f2f; font-weight: bold;">{days_overdue} ימים</span></p>
        </div>
        
        <p style="margin-bottom: 15px;">נודה לך על החזרת הציוד בהקדם האפשרי למחסן הציוד.</p>
        
        <p style="margin-bottom: 15px;">במקרה של שאלות או בעיות, אנא צור קשר עם צוות ניהול הציוד.</p>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px; text-align: center;">
            הודעה זו נשלחה באופן אוטומטי ממערכת ניהול ציוד קולנוע<br>
            נא לא להשיב להודעה זו
        </p>
    </div>
    """
    
    text_content = f"""
    תזכורת: איחור בהחזרת ציוד
    
    שלום {student_name},
    
    אנו מבקשים להזכיר כי חלף מועד החזרת הציוד שהושאל לך:
    
    פריט: {item_name}
    תאריך החזרה מתוכנן: {due_date}
    ימי איחור: {days_overdue} ימים
    
    נודה לך על החזרת הציוד בהקדם האפשרי למחסן הציוד.
    
    במקרה של שאלות או בעיות, אנא צור קשר עם צוות ניהול הציוד.
    
    הודעה זו נשלחה באופן אוטומטי ממערכת ניהול ציוד קולנוע
    נא לא להשיב להודעה זו
    """
    
    return subject, html_content, text_content

def create_upcoming_return_email(loan_data):
    """
    יוצר תבנית אימייל עבור השאלה שמועד החזרתה קרב
    
    Parameters:
    loan_data (dict): נתוני ההשאלה שמועד החזרתה קרב
    
    Returns:
    tuple: (נושא האימייל, תוכן HTML, תוכן טקסטואלי)
    """
    student_name = loan_data.get('student_name', '')
    item_name = loan_data.get('item_name', '')
    days_remaining = loan_data.get('days_remaining', 0)
    due_date = loan_data.get('due_date', '')
    
    if isinstance(due_date, datetime.date):
        due_date = due_date.strftime('%d/%m/%Y')
    
    subject = f"תזכורת: מועד החזרת הציוד {item_name} מתקרב"
    
    html_content = f"""
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #1976d2; text-align: center; margin-bottom: 20px;">תזכורת: מועד החזרת ציוד מתקרב</h2>
        
        <p style="margin-bottom: 15px;">שלום {student_name},</p>
        
        <p style="margin-bottom: 15px;">אנו מבקשים להזכיר כי מועד החזרת הציוד שהושאל לך מתקרב:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p><strong>פריט:</strong> {item_name}</p>
            <p><strong>תאריך החזרה מתוכנן:</strong> {due_date}</p>
            <p><strong>ימים שנותרו:</strong> <span style="color: #1976d2; font-weight: bold;">{days_remaining} ימים</span></p>
        </div>
        
        <p style="margin-bottom: 15px;">אנא הכן את הציוד להחזרה ביום המיועד.</p>
        
        <p style="margin-bottom: 15px;">במקרה של צורך בהארכת תקופת ההשאלה, אנא צור קשר עם צוות ניהול הציוד בהקדם האפשרי.</p>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px; text-align: center;">
            הודעה זו נשלחה באופן אוטומטי ממערכת ניהול ציוד קולנוע<br>
            נא לא להשיב להודעה זו
        </p>
    </div>
    """
    
    text_content = f"""
    תזכורת: מועד החזרת ציוד מתקרב
    
    שלום {student_name},
    
    אנו מבקשים להזכיר כי מועד החזרת הציוד שהושאל לך מתקרב:
    
    פריט: {item_name}
    תאריך החזרה מתוכנן: {due_date}
    ימים שנותרו: {days_remaining} ימים
    
    אנא הכן את הציוד להחזרה ביום המיועד.
    
    במקרה של צורך בהארכת תקופת ההשאלה, אנא צור קשר עם צוות ניהול הציוד בהקדם האפשרי.
    
    הודעה זו נשלחה באופן אוטומטי ממערכת ניהול ציוד קולנוע
    נא לא להשיב להודעה זו
    """
    
    return subject, html_content, text_content

def create_low_stock_email(item_data):
    """
    יוצר תבנית אימייל עבור פריט שכמותו במלאי נמוכה
    
    Parameters:
    item_data (dict): נתוני הפריט שכמותו במלאי נמוכה
    
    Returns:
    tuple: (נושא האימייל, תוכן HTML, תוכן טקסטואלי)
    """
    item_name = item_data.get('name', '')
    category = item_data.get('category', '')
    available_quantity = item_data.get('available_quantity', 0)
    total_quantity = item_data.get('quantity', 0)
    stock_percent = item_data.get('stock_percent', 0)
    
    subject = f"התראה: מלאי נמוך - {item_name}"
    
    html_content = f"""
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #ff9800; text-align: center; margin-bottom: 20px;">התראה: מלאי נמוך</h2>
        
        <p style="margin-bottom: 15px;">שלום,</p>
        
        <p style="margin-bottom: 15px;">אנו מתריעים כי כמות המלאי של פריט הציוד הבא נמוכה:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p><strong>פריט:</strong> {item_name}</p>
            <p><strong>קטגוריה:</strong> {category}</p>
            <p><strong>כמות זמינה:</strong> <span style="color: #ff9800; font-weight: bold;">{available_quantity} מתוך {total_quantity}</span></p>
            <p><strong>אחוז במלאי:</strong> <span style="color: #ff9800; font-weight: bold;">{stock_percent}%</span></p>
        </div>
        
        <p style="margin-bottom: 15px;">מומלץ לבדוק את מצב הפריט ולשקול הזמנה נוספת או תיקון במידת הצורך.</p>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px; text-align: center;">
            הודעה זו נשלחה באופן אוטומטי ממערכת ניהול ציוד קולנוע<br>
            נא לא להשיב להודעה זו
        </p>
    </div>
    """
    
    text_content = f"""
    התראה: מלאי נמוך
    
    שלום,
    
    אנו מתריעים כי כמות המלאי של פריט הציוד הבא נמוכה:
    
    פריט: {item_name}
    קטגוריה: {category}
    כמות זמינה: {available_quantity} מתוך {total_quantity}
    אחוז במלאי: {stock_percent}%
    
    מומלץ לבדוק את מצב הפריט ולשקול הזמנה נוספת או תיקון במידת הצורך.
    
    הודעה זו נשלחה באופן אוטומטי ממערכת ניהול ציוד קולנוע
    נא לא להשיב להודעה זו
    """
    
    return subject, html_content, text_content

def main():
    """פונקציה ראשית"""
    try:
        # קבלת נתונים מהקלט
        if len(sys.argv) > 1:
            input_data = json.loads(sys.argv[1])
            alert_type = input_data.get('alert_type')
            data = input_data.get('data')
            recipient_email = input_data.get('email')
            
            if not alert_type or not data or not recipient_email:
                print(json.dumps({
                    "success": False,
                    "message": "חסרים פרמטרים: alert_type, data, email"
                }))
                return
            
            # בחירת סוג האימייל בהתאם לסוג ההתראה
            if alert_type == 'overdue':
                subject, html_content, text_content = create_overdue_loan_email(data)
            elif alert_type == 'upcoming':
                subject, html_content, text_content = create_upcoming_return_email(data)
            elif alert_type == 'low_stock':
                subject, html_content, text_content = create_low_stock_email(data)
            else:
                print(json.dumps({
                    "success": False,
                    "message": f"סוג התראה לא נתמך: {alert_type}"
                }))
                return
            
            # שליחת האימייל
            success = send_email(recipient_email, subject, html_content, text_content)
            
            if success:
                print(json.dumps({
                    "success": True,
                    "message": f"האימייל נשלח בהצלחה לכתובת {recipient_email}"
                }))
            else:
                print(json.dumps({
                    "success": False,
                    "message": "שגיאה בשליחת האימייל"
                }))
        else:
            print(json.dumps({
                "success": False,
                "message": "לא התקבלו נתונים בקלט"
            }))
    
    except Exception as e:
        print(json.dumps({
            "success": False,
            "message": f"שגיאה: {str(e)}"
        }))

if __name__ == "__main__":
    main()