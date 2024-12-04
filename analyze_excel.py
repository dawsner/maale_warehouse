import pandas as pd
import sys

def analyze_excel_structure(file_path):
    # Try reading with different encodings
    encodings = ['utf-8', 'cp1255', 'windows-1255', 'iso-8859-8', 'utf-16']
    
    for encoding in encodings:
        try:
            print(f"\nTrying encoding: {encoding}")
            df = pd.read_excel(file_path, engine='openpyxl')
            print("\nFile read successfully!")
            print("\nColumns found:")
            print(df.columns.tolist())
            print("\nFirst few rows:")
            print(df.head())
            return df
        except UnicodeDecodeError:
            print(f"Failed with encoding: {encoding}")
        except Exception as e:
            print(f"Error: {str(e)}")
    
    return None

if __name__ == "__main__":
    file_path = 'טופס השאלת ציוד לשלוחה החרדית  ב.xlsx'
    df = analyze_excel_structure(file_path)
    if df is not None:
        # Save the column structure to a file for reference
        with open('excel_structure.txt', 'w', encoding='utf-8') as f:
            f.write("Excel File Structure:\n")
            f.write("Columns:\n")
            for col in df.columns:
                f.write(f"- {col}\n")
            f.write("\nSample Data:\n")
            f.write(df.head().to_string())
