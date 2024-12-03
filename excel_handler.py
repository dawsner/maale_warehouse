import pandas as pd
from database import get_db_connection, add_item

def import_excel(file):
    try:
        df = pd.read_excel(file)
        required_columns = ['שם פריט', 'קטגוריה', 'כמות']
        
        if not all(col in df.columns for col in required_columns):
            return False, "קובץ האקסל חייב להכיל את העמודות: שם פריט, קטגוריה, כמות"
        
        for _, row in df.iterrows():
            add_item(
                name=row['שם פריט'],
                category=row['קטגוריה'],
                quantity=int(row['כמות']),
                notes=row.get('הערות', '')
            )
        return True, "הנתונים נטענו בהצלחה"
    except Exception as e:
        return False, f"שגיאה בטעינת הקובץ: {str(e)}"

def export_to_excel():
    with get_db_connection() as conn:
        # Export items
        items_df = pd.read_sql_query(
            "SELECT name as שם_פריט, category as קטגוריה, "
            "quantity as כמות_כוללת, available as כמות_זמינה, "
            "notes as הערות FROM items",
            conn
        )
        
        # Export active loans
        loans_df = pd.read_sql_query(
            """SELECT i.name as שם_פריט, l.student_name as שם_סטודנט,
               l.student_id as תז_סטודנט, l.quantity as כמות,
               l.loan_date as תאריך_השאלה
               FROM loans l
               JOIN items i ON l.item_id = i.id
               WHERE l.status = 'active'""",
            conn
        )
        
        # Create Excel writer object
        with pd.ExcelWriter('warehouse_export.xlsx') as writer:
            items_df.to_excel(writer, sheet_name='מלאי', index=False)
            loans_df.to_excel(writer, sheet_name='השאלות_פעילות', index=False)
            
        return 'warehouse_export.xlsx'
