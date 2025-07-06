# מדריך דיפלוי למערכת ניהול מחסן השאלות

## הכי פשוט וחינם - Railway.app

### שלב 1: יצירת חשבון
1. הולך ל-railway.app
2. לוחץ "Start a new project"
3. מתחבר עם GitHub

### שלב 2: יצירת פרויקט חדש
1. "Deploy from GitHub repo"
2. בוחר את הריפו שלך
3. ב-Root Directory: ללא שינוי
4. ב-Build Command: `cd react-app && npm install`
5. ב-Start Command: `cd react-app && npm run dev`

### שלב 3: הוספת בסיס נתונים
1. לוחץ "Add Service" -> "Database" -> "PostgreSQL"
2. מעתיק את DATABASE_URL
3. הולך ל"Variables" ומוסיף:
   - `DATABASE_URL` = הURL שהעתקת
   - `PORT` = `5000`

### שלב 4: הפעלה
המערכת אמורה להיות זמינה תוך דקות!

## אופציה 2: Heroku (פופולרי)

### שלב 1: הכנת הפרויקט
```bash
# בתיקיית הפרויקט
npm install -g heroku
heroku login
heroku create cinema-equipment-app
```

### שלב 2: הגדרת בסיס נתונים
```bash
heroku addons:create heroku-postgresql:mini
```

### שלב 3: הגדרת קבצים
- וודא שיש `package.json` בתיקייה הראשית
- הProcfile כבר מוכן

### שלב 4: העלאה
```bash
git add .
git commit -m "Deploy to production"
git push heroku main
```

## אופציה 2: Railway (בחינם)

1. הולך ל-railway.app
2. מתחבר עם GitHub
3. "New Project" -> "Deploy from GitHub"
4. בוחר את הריפו
5. מוסיף PostgreSQL database
6. מגדיר PORT=5000

## אופציה 3: Render (בחינם)

1. הולך ל-render.com  
2. "New Web Service"
3. מתחבר לגיט
4. Build Command: `cd react-app && npm install && npm run build`
5. Start Command: `cd react-app && npm run dev`

## אופציה 4: Vercel + PlanetScale

1. Frontend: vercel.com
2. Database: planetscale.com (MySQL)
3. מחבר את שניהם

## הגדרות חובה:
- PORT=5000
- DATABASE_URL=(מהשירות שבחרת)
- NODE_ENV=production

## קבצים שצריכים להיות מעודכנים:
✓ Procfile
✓ package.json (dependencies)
✓ start.sh
✓ server.js (port configuration)

המערכת מוכנה לדיפלוי בכל השירותים האלה!