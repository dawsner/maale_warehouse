"""
סקריפט זה מאפשר שליחת התראות בדואר אלקטרוני עבור השאלות באיחור או פריטים שהמלאי שלהם נמוך
"""
import sys
import os
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
from datetime import datetime
import pytz
import logging

# הגדרת לוגר
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_israel_time():
    """מחזיר את השעה הנוכחית בישראל"""
    israel_tz = pytz.timezone('Asia/Jerusalem')
    return datetime.now(israel_tz)

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
    try:
        # פרטי התחברות לשרת SMTP - יש להגדיר בקובץ .env
        sender_email = os.environ.get("EMAIL_SENDER", "noreply@cinemawarehouse.com")
        sender_name = os.environ.get("EMAIL_SENDER_NAME", "מערכת ניהול מחסן קולנוע")
        smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.environ.get("SMTP_PORT", 587))
        smtp_username = os.environ.get("SMTP_USERNAME", "")
        smtp_password = os.environ.get("SMTP_PASSWORD", "")
        
        # אם אין הגדרת SMTP תקינה, רושמים שגיאה
        if not smtp_username or not smtp_password:
            logger.error("SMTP credentials not configured. Email not sent.")
            return False
        
        # יצירת הודעה משולבת (HTML + טקסט)
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = formataddr((sender_name, sender_email))
        msg['To'] = recipient_email
        
        # הוספת חלק טקסטואלי (אם סופק)
        if text_content:
            msg.attach(MIMEText(text_content, 'plain', 'utf-8'))
        
        # הוספת חלק HTML
        msg.attach(MIMEText(html_content, 'html', 'utf-8'))
        
        # התחברות לשרת SMTP ושליחה
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()  # הפעלת אבטחת TLS
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
            
        logger.info(f"Email sent successfully to {recipient_email}")
        return True
    
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return False

def create_overdue_loan_email(loan_data):
    """
    יוצר תבנית אימייל עבור השאלה באיחור
    
    Parameters:
    loan_data (dict): נתוני ההשאלה באיחור
    
    Returns:
    tuple: (נושא האימייל, תוכן HTML, תוכן טקסטואלי)
    """
    days_text = "ימים" if loan_data.get('days_overdue', 0) != 1 else "יום"
    
    subject = f"התראה: השאלת ציוד באיחור - {loan_data.get('item_name', '')}"
    
    html_content = f"""
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #d32f2f;">התראת איחור בהחזרת ציוד</h2>
        <p>שלום,</p>
        <p>ברצוננו להזכיר כי קיים ציוד שהושאל ועבר את מועד ההחזרה המתוכנן:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>פריט:</strong> {loan_data.get('item_name', '')}</p>
            <p><strong>כמות:</strong> {loan_data.get('quantity', 1)}</p>
            <p><strong>תאריך השאלה:</strong> {loan_data.get('loan_date', '')}</p>
            <p><strong>תאריך החזרה מתוכנן:</strong> {loan_data.get('due_date', '')}</p>
            <p><strong>באיחור של:</strong> <span style="color: #d32f2f; font-weight: bold;">{loan_data.get('days_overdue', 0)} {days_text}</span></p>
            <p><strong>סטודנט/ית:</strong> {loan_data.get('student_name', '')}</p>
        </div>
        
        <p>נודה על החזרת הציוד בהקדם האפשרי.</p>
        <p>למידע נוסף או לתיאום החזרה, אנא צרו קשר עם צוות המחסן.</p>
        
        <div style="margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 10px;">
            <p>הודעה זו נשלחה באופן אוטומטי ממערכת ניהול מחסן ציוד קולנוע.</p>
            <p>נשלח בתאריך: {get_israel_time().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
    </div>
    """
    
    text_content = f"""
    התראת איחור בהחזרת ציוד
    
    שלום,
    
    ברצוננו להזכיר כי קיים ציוד שהושאל ועבר את מועד ההחזרה המתוכנן:
    
    פריט: {loan_data.get('item_name', '')}
    כמות: {loan_data.get('quantity', 1)}
    תאריך השאלה: {loan_data.get('loan_date', '')}
    תאריך החזרה מתוכנן: {loan_data.get('due_date', '')}
    באיחור של: {loan_data.get('days_overdue', 0)} {days_text}
    סטודנט/ית: {loan_data.get('student_name', '')}
    
    נודה על החזרת הציוד בהקדם האפשרי.
    למידע נוסף או לתיאום החזרה, אנא צרו קשר עם צוות המחסן.
    
    הודעה זו נשלחה באופן אוטומטי ממערכת ניהול מחסן ציוד קולנוע.
    נשלח בתאריך: {get_israel_time().strftime('%Y-%m-%d %H:%M:%S')}
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
    days_text = "ימים" if loan_data.get('days_remaining', 0) != 1 else "יום"
    
    subject = f"תזכורת: החזרת ציוד מתוכננת בקרוב - {loan_data.get('item_name', '')}"
    
    html_content = f"""
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #1976d2;">תזכורת להחזרת ציוד</h2>
        <p>שלום,</p>
        <p>ברצוננו להזכיר כי מועד ההחזרה של הציוד הבא מתקרב:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>פריט:</strong> {loan_data.get('item_name', '')}</p>
            <p><strong>כמות:</strong> {loan_data.get('quantity', 1)}</p>
            <p><strong>תאריך השאלה:</strong> {loan_data.get('loan_date', '')}</p>
            <p><strong>תאריך החזרה מתוכנן:</strong> {loan_data.get('due_date', '')}</p>
            <p><strong>זמן שנותר:</strong> <span style="color: #1976d2; font-weight: bold;">{loan_data.get('days_remaining', 0)} {days_text}</span></p>
            <p><strong>סטודנט/ית:</strong> {loan_data.get('student_name', '')}</p>
        </div>
        
        <p>אנא וודאו כי הציוד יוחזר בזמן.</p>
        <p>למידע נוסף או לתיאום החזרה, אנא צרו קשר עם צוות המחסן.</p>
        
        <div style="margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 10px;">
            <p>הודעה זו נשלחה באופן אוטומטי ממערכת ניהול מחסן ציוד קולנוע.</p>
            <p>נשלח בתאריך: {get_israel_time().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
    </div>
    """
    
    text_content = f"""
    תזכורת להחזרת ציוד
    
    שלום,
    
    ברצוננו להזכיר כי מועד ההחזרה של הציוד הבא מתקרב:
    
    פריט: {loan_data.get('item_name', '')}
    כמות: {loan_data.get('quantity', 1)}
    תאריך השאלה: {loan_data.get('loan_date', '')}
    תאריך החזרה מתוכנן: {loan_data.get('due_date', '')}
    זמן שנותר: {loan_data.get('days_remaining', 0)} {days_text}
    סטודנט/ית: {loan_data.get('student_name', '')}
    
    אנא וודאו כי הציוד יוחזר בזמן.
    למידע נוסף או לתיאום החזרה, אנא צרו קשר עם צוות המחסן.
    
    הודעה זו נשלחה באופן אוטומטי ממערכת ניהול מחסן ציוד קולנוע.
    נשלח בתאריך: {get_israel_time().strftime('%Y-%m-%d %H:%M:%S')}
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
    subject = f"התראת מלאי נמוך - {item_data.get('name', '')}"
    
    html_content = f"""
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #f57c00;">התראת מלאי נמוך</h2>
        <p>שלום,</p>
        <p>ברצוננו להודיע כי כמות המלאי של הפריט הבא נמוכה:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>פריט:</strong> {item_data.get('name', '')}</p>
            <p><strong>קטגוריה:</strong> {item_data.get('category', '')}</p>
            <p><strong>כמות זמינה:</strong> <span style="color: #f57c00; font-weight: bold;">{item_data.get('available_quantity', 0)} מתוך {item_data.get('quantity', 0)}</span></p>
            <p><strong>אחוז במלאי:</strong> <span style="color: #f57c00; font-weight: bold;">{item_data.get('stock_percent', 0)}%</span></p>
        </div>
        
        <p>מומלץ לשקול הזמנה של פריטים נוספים.</p>
        
        <div style="margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 10px;">
            <p>הודעה זו נשלחה באופן אוטומטי ממערכת ניהול מחסן ציוד קולנוע.</p>
            <p>נשלח בתאריך: {get_israel_time().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
    </div>
    """
    
    text_content = f"""
    התראת מלאי נמוך
    
    שלום,
    
    ברצוננו להודיע כי כמות המלאי של הפריט הבא נמוכה:
    
    פריט: {item_data.get('name', '')}
    קטגוריה: {item_data.get('category', '')}
    כמות זמינה: {item_data.get('available_quantity', 0)} מתוך {item_data.get('quantity', 0)}
    אחוז במלאי: {item_data.get('stock_percent', 0)}%
    
    מומלץ לשקול הזמנה של פריטים נוספים.
    
    הודעה זו נשלחה באופן אוטומטי ממערכת ניהול מחסן ציוד קולנוע.
    נשלח בתאריך: {get_israel_time().strftime('%Y-%m-%d %H:%M:%S')}
    """
    
    return subject, html_content, text_content

def main():
    """פונקציה ראשית"""
    try:
        # מקבל פרמטרים מבקשת HTTP
        if len(sys.argv) > 1:
            params = json.loads(sys.argv[1])
            alert_type = params.get('alert_type', '')  # 'overdue', 'upcoming', 'low_stock'
            data = params.get('data', {})
            recipient_email = params.get('email', '')
            
            if not recipient_email:
                raise ValueError("Missing recipient email address")
                
            if not alert_type or not data:
                raise ValueError("Missing alert type or data")
            
            # בחירת תבנית האימייל המתאימה
            if alert_type == 'overdue':
                subject, html_content, text_content = create_overdue_loan_email(data)
            elif alert_type == 'upcoming':
                subject, html_content, text_content = create_upcoming_return_email(data)
            elif alert_type == 'low_stock':
                subject, html_content, text_content = create_low_stock_email(data)
            else:
                raise ValueError(f"Unknown alert type: {alert_type}")
            
            # שליחת האימייל
            success = send_email(recipient_email, subject, html_content, text_content)
            
            print(json.dumps({
                'success': success,
                'message': 'Email sent successfully' if success else 'Failed to send email'
            }))
        else:
            raise ValueError("No parameters provided")
            
    except Exception as e:
        print(json.dumps({
            'error': str(e),
            'success': False
        }))


if __name__ == "__main__":
    main()