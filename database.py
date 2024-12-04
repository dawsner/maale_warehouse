import os
from psycopg2.extras import RealDictCursor
import psycopg2
from datetime import datetime

def get_db_connection():
    return psycopg2.connect(os.getenv('DATABASE_URL'))

def init_db():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Create items table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS items (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    available INTEGER NOT NULL,
                    notes TEXT
                )
            """)
            
            # Create loans table with new fields
            cur.execute("""
                CREATE TABLE IF NOT EXISTS loans (
                    id SERIAL PRIMARY KEY,
                    item_id INTEGER REFERENCES items(id),
                    student_name TEXT NOT NULL,
                    student_id TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    loan_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    due_date TIMESTAMP NOT NULL,
                    return_date TIMESTAMP,
                    status TEXT DEFAULT 'active',
                    user_id INTEGER,
                    loan_notes TEXT,
                    checkout_notes TEXT,
                    return_notes TEXT,
                    order_status TEXT,
                    checkout_status BOOLEAN DEFAULT FALSE,
                    checked_status BOOLEAN DEFAULT FALSE,
                    return_status BOOLEAN DEFAULT FALSE,
                    director TEXT,
                    producer TEXT,
                    photographer TEXT,
                    price_per_unit DECIMAL,
                    total_price DECIMAL
                )
            """)
            
            # Create users table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    full_name TEXT NOT NULL
                )
            """)
            
            # Create reservations table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS reservations (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    item_id INTEGER REFERENCES items(id),
                    student_name TEXT NOT NULL,
                    student_id TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    start_date TIMESTAMP NOT NULL,
                    end_date TIMESTAMP NOT NULL,
                    status TEXT DEFAULT 'pending',
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.commit()

def add_item(name, category, quantity, notes=""):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO items (name, category, quantity, available, notes)
                   VALUES (%s, %s, %s, %s, %s)""",
                (name, category, quantity, quantity, notes)
            )
            conn.commit()

def get_all_items():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM items ORDER BY category, name")
            return cur.fetchall()

def create_loan(item_id, student_name, student_id, quantity, due_date, user_id=None, 
             loan_notes=None, checkout_notes=None, return_notes=None,
             director=None, producer=None, photographer=None,
             price_per_unit=None, total_price=None):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE items SET available = available - %s 
                   WHERE id = %s AND available >= %s""",
                (quantity, item_id, quantity)
            )
            if cur.rowcount > 0:
                cur.execute(
                    """INSERT INTO loans (
                        item_id, student_name, student_id, quantity, due_date, user_id,
                        loan_notes, checkout_notes, return_notes,
                        director, producer, photographer,
                        price_per_unit, total_price
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (item_id, student_name, student_id, quantity, due_date, user_id,
                     loan_notes, checkout_notes, return_notes,
                     director, producer, photographer,
                     price_per_unit, total_price)
                )
                conn.commit()
                return True
    return False

def return_loan(loan_id, return_notes=None):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE loans 
                   SET status = 'returned',
                       return_date = CURRENT_TIMESTAMP,
                       return_status = TRUE,
                       return_notes = COALESCE(%s, return_notes)
                   WHERE id = %s AND status = 'active'""",
                (return_notes, loan_id)
            )
            if cur.rowcount > 0:
                cur.execute(
                    """UPDATE items SET available = available + loans.quantity 
                       FROM loans WHERE items.id = loans.item_id AND loans.id = %s""",
                    (loan_id,)
                )
                conn.commit()
                return True
    return False

def get_loan_details(loan_id):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT l.*, i.name as item_name
                FROM loans l
                JOIN items i ON l.item_id = i.id
                WHERE l.id = %s
            """, (loan_id,))
            return cur.fetchone()

def update_item(item_id, name, category, quantity, notes):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Check if quantity is less than current loans
            cur.execute("""
                SELECT COALESCE(SUM(quantity), 0) as loaned_quantity
                FROM loans
                WHERE item_id = %s AND status = 'active'
            """, (item_id,))
            loaned_quantity = cur.fetchone()[0]
            
            if quantity < loaned_quantity:
                return False, "לא ניתן להפחית את הכמות מתחת לכמות המושאלת"
            
            # Update item
            cur.execute("""
                UPDATE items 
                SET name = %s, 
                    category = %s, 
                    quantity = %s + COALESCE((
                        SELECT SUM(quantity) 
                        FROM loans 
                        WHERE item_id = %s AND status = 'active'
                    ), 0),
                    notes = %s
                WHERE id = %s
                RETURNING *
            """, (name, category, quantity, item_id, notes, item_id))
            
            if cur.rowcount == 0:
                return False, "הפריט לא נמצא"
            
            conn.commit()
            return True, "הפריט עודכן בהצלחה"

def delete_item(item_id):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Check for active loans
            cur.execute("""
                SELECT COUNT(*) 
                FROM loans 
                WHERE item_id = %s AND status = 'active'
            """, (item_id,))
            
            if cur.fetchone()[0] > 0:
                return False, "לא ניתן למחוק פריט עם השאלות פעילות"
            
            # Delete the item
            cur.execute("DELETE FROM items WHERE id = %s", (item_id,))
            
            if cur.rowcount == 0:
                return False, "הפריט לא נמצא"
            
            conn.commit()
            return True, "הפריט נמחק בהצלחה"

def toggle_item_availability(item_id, is_available):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            if is_available:
                # Make item available - set available to quantity minus active loans
                cur.execute("""
                    UPDATE items 
                    SET available = quantity - COALESCE(
                        (SELECT SUM(quantity) 
                         FROM loans 
                         WHERE item_id = items.id AND status = 'active'), 0)
                    WHERE id = %s
                    RETURNING *
                """, (item_id,))
            else:
                # Make item unavailable - set available to 0
                cur.execute("""
                    UPDATE items 
                    SET available = 0
                    WHERE id = %s
                    RETURNING *
                """, (item_id,))
            
            if cur.rowcount == 0:
                return False, "הפריט לא נמצא"
            
            conn.commit()
            return True, "זמינות הפריט עודכנה בהצלחה"