"""
מודול בסיס נתונים עבור מערכת ניהול ציוד קולנוע
מספק פונקציות לחיבור ולניהול בסיס הנתונים PostgreSQL
"""

import os
import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta
import pytz

def get_db_connection():
    """
    יוצר חיבור לבסיס הנתונים PostgreSQL
    משתמש במשתנה הסביבה DATABASE_URL
    """
    try:
        db_url = os.getenv('DATABASE_URL')
        if not db_url:
            raise ValueError("DATABASE_URL environment variable is not set")
        
        conn = psycopg2.connect(db_url)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        raise

def init_db():
    """
    מאתחל את בסיס הנתונים - יוצר טבלאות אם הן לא קיימות
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # יצירת טבלת משתמשים
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'student',
                email VARCHAR(100),
                full_name VARCHAR(100),
                study_year VARCHAR(10),
                branch VARCHAR(20) DEFAULT 'main',
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        ''')
        
        # יצירת טבלת פריטים
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS items (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                category VARCHAR(100) NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 0,
                notes TEXT,
                order_notes TEXT,
                ordered BOOLEAN DEFAULT FALSE,
                checkout_notes TEXT,
                checked_out BOOLEAN DEFAULT FALSE,
                checked BOOLEAN DEFAULT FALSE,
                return_notes TEXT,
                returned BOOLEAN DEFAULT FALSE,
                price_per_unit DECIMAL(10,2) DEFAULT 0,
                total_price DECIMAL(10,2) DEFAULT 0,
                director VARCHAR(100),
                producer VARCHAR(100),
                photographer VARCHAR(100),
                unnnamed_11 VARCHAR(100),
                is_available BOOLEAN DEFAULT TRUE,
                allowed_years VARCHAR(10) DEFAULT '1,2,3',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # יצירת טבלת השאלות
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS loans (
                id SERIAL PRIMARY KEY,
                item_id INTEGER REFERENCES items(id),
                student_name VARCHAR(100) NOT NULL,
                student_id VARCHAR(50),
                quantity INTEGER NOT NULL,
                loan_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                due_date TIMESTAMP NOT NULL,
                return_date TIMESTAMP,
                is_returned BOOLEAN DEFAULT FALSE,
                loan_notes TEXT,
                return_notes TEXT,
                user_id INTEGER REFERENCES users(id),
                checkout_notes TEXT,
                director VARCHAR(100),
                producer VARCHAR(100),
                photographer VARCHAR(100),
                price_per_unit DECIMAL(10,2),
                total_price DECIMAL(10,2)
            )
        ''')
        
        # יצירת טבלת הזמנות
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS reservations (
                id SERIAL PRIMARY KEY,
                item_id INTEGER REFERENCES items(id),
                student_name VARCHAR(100) NOT NULL,
                student_id VARCHAR(50),
                quantity INTEGER NOT NULL,
                start_date TIMESTAMP NOT NULL,
                end_date TIMESTAMP NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                notes TEXT,
                user_id INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        print("Database initialized successfully")
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error initializing database: {e}")
        raise
    finally:
        if conn:
            conn.close()

def get_all_items():
    """
    מחזיר את כל הפריטים במלאי
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        cursor.execute("""
            SELECT i.*, 
                   COALESCE(SUM(CASE WHEN l.is_returned = FALSE THEN l.quantity ELSE 0 END), 0) as loaned_count
            FROM items i
            LEFT JOIN loans l ON i.id = l.item_id
            GROUP BY i.id
            ORDER BY i.category, i.name
        """)
        
        items = cursor.fetchall()
        return [dict(item) for item in items]
        
    except Exception as e:
        print(f"Error getting items: {e}")
        return []
    finally:
        if conn:
            conn.close()

def add_item(name, category, quantity, notes="", order_notes=None, ordered=False,
             checkout_notes=None, checked_out=False, checked=False,
             return_notes=None, returned=False, price_per_unit=0, total_price=0,
             director=None, producer=None, photographer=None, unnnamed_11=None):
    """
    מוסיף פריט חדש למלאי
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO items (name, category, quantity, notes, order_notes, ordered,
                             checkout_notes, checked_out, checked, return_notes, returned,
                             price_per_unit, total_price, director, producer, photographer, unnnamed_11)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (name, category, quantity, notes, order_notes, ordered,
              checkout_notes, checked_out, checked, return_notes, returned,
              price_per_unit, total_price, director, producer, photographer, unnnamed_11))
        
        result = cursor.fetchone()
        if result:
            item_id = result[0]
        else:
            raise Exception("Failed to create item")
        conn.commit()
        return item_id
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error adding item: {e}")
        raise
    finally:
        if conn:
            conn.close()

def create_loan(item_id, student_name, student_id, quantity, due_date, user_id=None, 
                loan_notes=None, checkout_notes=None, return_notes=None,
                director=None, producer=None, photographer=None,
                price_per_unit=None, total_price=None):
    """
    יוצר השאלה חדשה
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO loans (item_id, student_name, student_id, quantity, due_date, user_id,
                             loan_notes, checkout_notes, return_notes, director, producer, 
                             photographer, price_per_unit, total_price)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (item_id, student_name, student_id, quantity, due_date, user_id,
              loan_notes, checkout_notes, return_notes, director, producer,
              photographer, price_per_unit, total_price))
        
        result = cursor.fetchone()
        if result:
            loan_id = result[0]
        else:
            raise Exception("Failed to create loan")
        conn.commit()
        return loan_id
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error creating loan: {e}")
        raise
    finally:
        if conn:
            conn.close()

def update_item(item_id, name, category, quantity, notes, order_notes=None, ordered=None,
                checkout_notes=None, checked_out=None, checked=None, return_notes=None, returned=None,
                price_per_unit=None, total_price=None, director=None, producer=None,
                photographer=None, unnnamed_11=None, is_available=None):
    """
    מעדכן פריט קיים במערכת
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE items 
            SET name=%s, category=%s, quantity=%s, notes=%s, order_notes=%s, ordered=%s,
                checkout_notes=%s, checked_out=%s, checked=%s, return_notes=%s, returned=%s,
                price_per_unit=%s, total_price=%s, director=%s, producer=%s, photographer=%s,
                unnnamed_11=%s, is_available=%s, updated_at=CURRENT_TIMESTAMP
            WHERE id=%s
        """, (name, category, quantity, notes, order_notes, ordered,
              checkout_notes, checked_out, checked, return_notes, returned,
              price_per_unit, total_price, director, producer, photographer,
              unnnamed_11, is_available, item_id))
        
        conn.commit()
        return True
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error updating item: {e}")
        return False
    finally:
        if conn:
            conn.close()

def delete_item(item_id):
    """
    מוחק פריט מהמערכת
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM items WHERE id = %s", (item_id,))
        conn.commit()
        return True
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error deleting item: {e}")
        return False
    finally:
        if conn:
            conn.close()

def return_loan(loan_id, return_notes=None):
    """
    מחזיר השאלה
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE loans 
            SET is_returned = TRUE, return_date = CURRENT_TIMESTAMP, return_notes = %s
            WHERE id = %s
        """, (return_notes, loan_id))
        
        conn.commit()
        return True
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error returning loan: {e}")
        return False
    finally:
        if conn:
            conn.close()

def get_loan_details(loan_id):
    """
    מחזיר פרטי השאלה
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        cursor.execute("""
            SELECT l.*, i.name as item_name, i.category
            FROM loans l
            JOIN items i ON l.item_id = i.id
            WHERE l.id = %s
        """, (loan_id,))
        
        loan = cursor.fetchone()
        return dict(loan) if loan else None
        
    except Exception as e:
        print(f"Error getting loan details: {e}")
        return None
    finally:
        if conn:
            conn.close()

def toggle_item_availability(item_id, is_available):
    """
    משנה את זמינות הפריט
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE items 
            SET is_available = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (is_available, item_id))
        
        conn.commit()
        return True
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error toggling item availability: {e}")
        return False
    finally:
        if conn:
            conn.close()