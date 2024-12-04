import os
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager

@contextmanager
def get_db_connection():
    conn = psycopg2.connect(
        dbname=os.environ['PGDATABASE'],
        user=os.environ['PGUSER'],
        password=os.environ['PGPASSWORD'],
        host=os.environ['PGHOST'],
        port=os.environ['PGPORT']
    )
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Create items table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS items (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    category TEXT,
                    quantity INTEGER,
                    available INTEGER,
                    notes TEXT
                )
            """)
            
            # Create loans table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS loans (
                    id SERIAL PRIMARY KEY,
                    item_id INTEGER REFERENCES items(id),
                    student_name TEXT NOT NULL,
                    student_id TEXT NOT NULL,
                    loan_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    return_date TIMESTAMP,
                    quantity INTEGER,
                    status TEXT DEFAULT 'active'
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
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM items ORDER BY category, name")
            return cur.fetchall()

def create_loan(item_id, student_name, student_id, quantity, due_date, user_id=None):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE items SET available = available - %s 
                   WHERE id = %s AND available >= %s""",
                (quantity, item_id, quantity)
            )
            if cur.rowcount > 0:
                cur.execute(
                    """INSERT INTO loans (item_id, student_name, student_id, quantity, due_date, user_id) 
                       VALUES (%s, %s, %s, %s, %s, %s)""",
                    (item_id, student_name, student_id, quantity, due_date, user_id)
                )
                conn.commit()
                return True
    return False

def return_loan(loan_id):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE loans SET status = 'returned', return_date = CURRENT_TIMESTAMP 
                   WHERE id = %s AND status = 'active'""",
                (loan_id,)
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
