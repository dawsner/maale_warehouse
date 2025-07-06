# מדריך דיפלוי ל-Render - מערכת ניהול ציוד קולנוע

## שלב 1: העלאת הקוד לGitHub

### א. יצירת repository חדש ב-GitHub
1. כנס ל-github.com
2. לחץ על "New repository" 
3. שם: `cinema-equipment-management`
4. סמן "Public" (או Private אם אתה רוצה)
5. לחץ "Create repository"

### ב. העלאת הקוד מReplit
```bash
# פתח Terminal ב-Replit והרץ את הפקודות הבאות:

# התחלת Git repository
git init

# הוספת כל הקבצים
git add .

# יצירת commit ראשון
git commit -m "Initial commit - Cinema Equipment Management System"

# חיבור ל-GitHub (תחליף USERNAME בשם המשתמש שלך)
git remote add origin https://github.com/USERNAME/cinema-equipment-management.git

# העלאת הקוד
git push -u origin main
```

## שלב 2: דיפלוי ב-Render

### א. יצירת Web Service
1. כנס ל-render.com
2. לחץ "New +" → "Web Service"
3. לחץ "Connect account" ל-GitHub
4. בחר את הפרויקט: `cinema-equipment-management`
5. לחץ "Connect"

### ב. הגדרות הפרויקט
```
Name: cinema-equipment-management
Region: Oregon (US West)
Branch: main
Runtime: Node
Build Command: (השאר ריק)
Start Command: bash deploy.sh
```

### ג. הגדרות Environment Variables
לחץ "Advanced" ותוסיף:
```
NODE_ENV = production
PORT = 10000
DATABASE_URL = [תקבל בשלב הבא]
```

## שלב 3: הוספת PostgreSQL Database

### א. יצירת Database
1. מהדף הראשי של Render, לחץ "New +" → "PostgreSQL"
2. שם: `cinema-equipment-db`
3. Database: `cinema_equipment`
4. User: `cinema_user`
5. Region: Oregon (US West) - אותו מקום כמו השרת
6. לחץ "Create Database"

### ב. חיבור Database לWeb Service
1. כנס לדף ה-Database שיצרת
2. עבור ל-"Connections"
3. העתק את ה-"External Database URL"
4. חזור לWeb Service שלך
5. עבור ל-"Environment" 
6. עדכן את `DATABASE_URL` עם הכתובת שהעתקת

## שלב 4: Deploy!
1. לחץ "Create Web Service"
2. Render יתחיל לבנות ולפרסם
3. תהליך זה לוקח 5-10 דקות
4. תקבל URL כמו: `https://cinema-equipment-management.onrender.com`

## פרטי התחברות למערכת
- שם משתמש: `admin`
- סיסמה: `admin`

## בעיות נפוצות ופתרונות

### אם הבנייה נכשלת:
- בדוק שה-Build Command ריק
- וודא שה-Start Command הוא: `bash deploy.sh`

### אם המערכת לא עולה:
- בדוק שה-DATABASE_URL מוגדר נכון
- וודא שהPORT מוגדר ל-10000

### אם יש בעיות עם הנתונים:
- הנתונים יועברו אוטומטית מהאקסל
- 257 פריטי ציוד צריכים להיות זמינים

## עדכון המערכת
כשתרצה לעדכן:
1. עשה שינויים ב-Replit
2. הרץ:
```bash
git add .
git commit -m "תיאור השינוי"
git push
```
3. Render יעדכן אוטומטית!

---

✅ **המערכת כוללת:**
- ניהול מלאי ציוד קולנוע
- מערכת השאלות והחזרות
- דשבורד מנהלים ומחסנאים
- מערכת התראות
- דוחות וסטטיסטיקות
- תמיכה מלאה בעברית RTL