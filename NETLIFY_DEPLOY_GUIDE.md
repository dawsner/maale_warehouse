# מדריך פריסה לNetlify - חלופה לVercel

## מה זה Netlify?
פלטפורמת פריסה חינמית ופשוטה, מתחרה של Vercel

## שלבי הפריסה:

### שלב 1: יצירת חשבון
1. לך ל-https://netlify.com
2. לחץ "Sign up" והירשם עם GitHub

### שלב 2: פריסה
1. לחץ "New site from Git"
2. בחר GitHub ואת הפרויקט שלך
3. הגדרות בנייה:
   - Base directory: `react-app`
   - Build command: `npm run build`
   - Publish directory: `react-app/build`

### שלב 3: משתני סביבה
בחר Site settings > Environment variables:
```
DATABASE_URL=your_database_url
REACT_APP_API_URL=your_api_url
```

### שלב 4: Deploy!
- לחץ "Deploy site"
- האתר יהיה מוכן תוך דקות

## יתרונות:
✅ חינמי לחלוטין  
✅ פריסה מGitHub
✅ SSL אוטומטי
✅ ביצועים מעולים