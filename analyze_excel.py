import pandas as pd
import sys

def analyze_excel_structure(file_path):
    try:
        print("\nReading Excel file...")
        df = pd.read_excel(file_path, engine='openpyxl')
        print("\nFile read successfully!")
        
        print("\n1. כל שמות העמודות בקובץ:")
        for col in df.columns:
            print(f"- {col}")
        
        print("\n2. חמש שורות ראשונות מהקובץ:")
        print(df.head().to_string())
        
        print("\n3. ניתוח העמודות לפי קטגוריות:")
        
        # Identify column types
        category_columns = ['Unnamed: 0']  # Usually contains categories
        item_columns = ['פריט']  # Contains item names
        note_columns = [
            'הערות על הזמנה (מחסן באדום. סטודנט בכחול)',
            'הערות על הוצאה (מחסן באדום. סטודנט בכחול)',
            'הערות על החזרה'
        ]
        production_team_columns = ['במאית: ', 'מפיקה: ', 'צלמת: ']
        status_columns = ['הזמנה', 'יצא', 'בדקתי', 'חזר']
        
        print("\nעמודות קטגוריות:")
        for col in [c for c in category_columns if c in df.columns]:
            print(f"- {col}")
        
        print("\nעמודות שמות פריטים:")
        for col in [c for c in item_columns if c in df.columns]:
            print(f"- {col}")
        
        print("\nעמודות הערות:")
        for col in [c for c in note_columns if c in df.columns]:
            print(f"- {col}")
        
        print("\nעמודות מידע על צוות ההפקה:")
        for col in [c for c in production_team_columns if c in df.columns]:
            print(f"- {col}")
        
        print("\nעמודות סטטוס השאלה/החזרה:")
        for col in [c for c in status_columns if c in df.columns]:
            print(f"- {col}")
        
        # Find unmapped columns
        all_mapped_columns = (category_columns + item_columns + note_columns + 
                            production_team_columns + status_columns)
        unmapped_columns = [col for col in df.columns if col not in all_mapped_columns]
        
        if unmapped_columns:
            print("\n4. עמודות שלא מופו:")
            for col in unmapped_columns:
                print(f"- {col}")
        else:
            print("\n4. אין עמודות שלא מופו")
        
        return df
    except Exception as e:
        print(f"Error: {str(e)}")
        return None

if __name__ == "__main__":
    file_path = 'טופס השאלת ציוד לשלוחה החרדית  ב.xlsx'
    df = analyze_excel_structure(file_path)
    if df is not None:
        # Save the analysis to a file
        with open('excel_structure.txt', 'w', encoding='utf-8') as f:
            f.write("ניתוח מבנה קובץ האקסל\n")
            f.write("\nמספר שורות בקובץ: " + str(len(df)))
            f.write("\nמספר עמודות: " + str(len(df.columns)))
            f.write("\n\nרשימת העמודות:\n")
            for col in df.columns:
                f.write(f"- {col}\n")
            f.write("\nדוגמת נתונים (5 שורות ראשונות):\n")
            f.write(df.head().to_string())
