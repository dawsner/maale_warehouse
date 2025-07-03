import os
import sys
from psycopg2.extras import RealDictCursor
import psycopg2
from datetime import datetime

def get_db_connection():
    db_url = os.getenv('DATABASE_URL')
    print(f"DEBUG: Connecting to database with URL: {db_url}", file=sys.stderr)
    return psycopg2.connect(db_url)

def init_db():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Create items table with all needed fields from Excel
            cur.execute("""
                CREATE TABLE IF NOT EXISTS items (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    available INTEGER NOT NULL,
                    notes TEXT,
                    is_available BOOLEAN DEFAULT TRUE,
                    category_original TEXT,
                    order_notes TEXT,
                    ordered BOOLEAN DEFAULT FALSE,
                    checked_out BOOLEAN DEFAULT FALSE,
                    checked BOOLEAN DEFAULT FALSE,
                    checkout_notes TEXT,
                    returned BOOLEAN DEFAULT FALSE,
                    return_notes TEXT,
                    price_per_unit NUMERIC DEFAULT 0,
                    total_price NUMERIC DEFAULT 0,
                    unnnamed_11 TEXT,
                    director TEXT,
                    producer TEXT,
                    photographer TEXT
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

def add_item(name, category, quantity, notes="", order_notes=None, ordered=False,
             checkout_notes=None, checked_out=False, checked=False,
             return_notes=None, returned=False, price_per_unit=0, total_price=0,
             director=None, producer=None, photographer=None, unnnamed_11=None):
    """
    מוסיף פריט חדש למלאי עם תמיכה מלאה בכל שדות האקסל
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO items (
                    name, category, quantity, available, notes,
                    order_notes, ordered, checkout_notes, checked_out, checked,
                    return_notes, returned, price_per_unit, total_price,
                    director, producer, photographer, unnnamed_11
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (name, category, quantity, quantity, notes,
                 order_notes, ordered, checkout_notes, checked_out, checked,
                 return_notes, returned, price_per_unit, total_price,
                 director, producer, photographer, unnnamed_11)
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
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                    (item_id, student_name, student_id, quantity, due_date, user_id,
                     loan_notes, checkout_notes, return_notes,
                     director, producer, photographer,
                     price_per_unit, total_price)
                )
                loan_id = cur.fetchone()[0]
                conn.commit()
                return loan_id
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

def update_item(item_id, name, category, quantity, notes, order_notes=None, ordered=None,
                checkout_notes=None, checked_out=None, checked=None, return_notes=None, returned=None,
                price_per_unit=None, total_price=None, director=None, producer=None,
                photographer=None, unnnamed_11=None, is_available=None):
    """
    מעדכן פריט קיים במערכת עם תמיכה מלאה בכל שדות האקסל
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Check if quantity is less than current loans
            cur.execute("""
                SELECT COALESCE(SUM(quantity), 0) as loaned_quantity
                FROM loans
                WHERE item_id = %s AND status = 'active'
            """, (item_id,))
            result = cur.fetchone()
            loaned_quantity = result[0] if result else 0
            
            if quantity < loaned_quantity:
                return False, "לא ניתן להפחית את הכמות מתחת לכמות המושאלת"
            
            # Get current item to handle NULL values
            cur.execute("SELECT * FROM items WHERE id = %s", (item_id,))
            current_item = cur.fetchone()
            
            if not current_item:
                return False, "הפריט לא נמצא"
            
            # Build the update query dynamically based on provided fields
            update_fields = []
            values = []
            
            update_fields.append("name = %s")
            values.append(name)
            
            update_fields.append("category = %s")
            values.append(category)
            
            update_fields.append("quantity = %s")
            values.append(quantity)
            
            update_fields.append("notes = %s")
            values.append(notes if notes is not None else '')
            
            # Handle optional fields
            if order_notes is not None:
                update_fields.append("order_notes = %s")
                values.append(order_notes)
                
            if ordered is not None:
                update_fields.append("ordered = %s")
                values.append(ordered)
                
            if checkout_notes is not None:
                update_fields.append("checkout_notes = %s")
                values.append(checkout_notes)
                
            if checked_out is not None:
                update_fields.append("checked_out = %s")
                values.append(checked_out)
                
            if checked is not None:
                update_fields.append("checked = %s")
                values.append(checked)
                
            if return_notes is not None:
                update_fields.append("return_notes = %s")
                values.append(return_notes)
                
            if returned is not None:
                update_fields.append("returned = %s")
                values.append(returned)
                
            if price_per_unit is not None:
                update_fields.append("price_per_unit = %s")
                values.append(price_per_unit)
                
            if total_price is not None:
                update_fields.append("total_price = %s")
                values.append(total_price)
                
            if director is not None:
                update_fields.append("director = %s")
                values.append(director)
                
            if producer is not None:
                update_fields.append("producer = %s")
                values.append(producer)
                
            if photographer is not None:
                update_fields.append("photographer = %s")
                values.append(photographer)
                
            if unnnamed_11 is not None:
                update_fields.append("unnnamed_11 = %s")
                values.append(unnnamed_11)
                
            if is_available is not None:
                update_fields.append("is_available = %s")
                values.append(is_available)
            
            # Build and execute the final query
            query = f"UPDATE items SET {', '.join(update_fields)} WHERE id = %s RETURNING *"
            values.append(item_id)
            
            cur.execute(query, values)
            
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
            
            result = cur.fetchone()
            if result and result[0] > 0:
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