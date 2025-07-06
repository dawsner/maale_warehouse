from database import get_db_connection
import sys

def main():
    try:
        # Get connection
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check items table
        cur.execute("SELECT COUNT(*) FROM items")
        item_count = cur.fetchone()[0]
        print(f"Items in database: {item_count}")
        
        if item_count > 0:
            # Get some sample items
            cur.execute("SELECT id, name, category FROM items LIMIT 5")
            print("\nSample items:")
            for row in cur.fetchall():
                print(f"ID: {row[0]}, Name: {row[1]}, Category: {row[2]}")
        
        # Close connection
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)

if __name__ == "__main__":
    main()
