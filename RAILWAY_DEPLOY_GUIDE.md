# מדריך דיפלוי Railway - פשוט ובטוח

## למה Railway?
- דיפלוי במקליק אחד
- PostgreSQL מובנה
- לא משפיע על הקוד המקומי
- גיבוי אוטומטי
- עלות צפויה: $15-20 לחודש

## שלב 1: הכנת הקוד לדיפלוי

אני אכין לך את הקבצים הנדרשים:

### 1. package.json (שורש הפרויקט)
נוסיף script לבניית הפרויקט:

```json
{
  "name": "cinema-equipment-management",
  "version": "1.0.0",
  "scripts": {
    "build": "cd react-app && npm install && npm run build",
    "start": "cd react-app && node server/server.js",
    "postinstall": "cd react-app && npm install"
  },
  "engines": {
    "node": "18.x"
  }
}
```

### 2. railway.json (הגדרות Railway)
```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

## שלב 2: הרשמה ל-Railway

1. לך לאתר: https://railway.app
2. התחבר עם GitHub
3. אשר הרשאות

## שלב 3: יצירת פרויקט חדש

1. לחץ "New Project"
2. בחר "Deploy from GitHub repo"
3. בחר את המאגר שלך
4. Railway יזהה אוטומטית שזה פרויקט Node.js

## שלב 4: הוספת מסד נתונים

1. בפרויקט Railway, לחץ "Add Service"
2. בחר "PostgreSQL"
3. Railway יצור מסד נתונים אוטומטית

## שלב 5: קישור המסד נתונים

Railway יצור אוטומטית משתנה סביבה בשם `DATABASE_URL`
זה יקשר אוטומטית למסד הנתונים החדש.

## שלב 6: דיפלוי

1. Railway יתחיל לבנות את הפרויקט אוטומטית
2. תוכל לראות את הלוגים בזמן אמת
3. אחרי הבנייה, תקבל URL ציבורי

## שלב 7: העברת נתונים (אופציונלי)

אם אתה רוצה להעביר את הנתונים הקיימים:
1. Railway יספק לך כלי להעברת נתונים
2. או שתוכל להשתמש בייבוא Excel במערכת החדשה

## יתרונות הפתרון:
✅ לא משפיע על הקוד המקומי שלך
✅ גיבוי אוטומטי יומי
✅ SSL חינם
✅ CDN מובנה
✅ מעקב אחר שגיאות
✅ התרעות במייל

## אבטחה:
- הנתונים מוצפנים
- גישה מוגבלת רק לך
- גיבויים אוטומטיים
- אפשרות לשחזור נתונים

האם אתה רוצה שאתחיל להכין את הקבצים לדיפלוי Railway?