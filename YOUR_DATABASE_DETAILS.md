# פרטי בסיס הנתונים שלך - להעתקה לVercel

## הנתונים המדויקים של המערכת שלך:

```
DATABASE_URL=postgresql://neondb_owner:C7Hl1sNOaWbc@ep-small-band-a4crrvzj.us-east-1.aws.neon.tech/neondb?sslmode=require

PGHOST=ep-small-band-a4crrvzj.us-east-1.aws.neon.tech
PGUSER=neondb_owner
PGPASSWORD=C7Hl1sNOaWbc
PGDATABASE=neondb
PGPORT=5432
```

## איך להשתמש בזה ב-Vercel:

1. **לך ל-Vercel.com** והירשם
2. **העלה את הפרויקט** (תיקיית react-app)
3. **ב-Environment Variables** הוסף **רק את השורה הזו**:
   ```
   DATABASE_URL=postgresql://neondb_owner:C7Hl1sNOaWbc@ep-small-band-a4crrvzj.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

**זה הכל!** אתה צריך רק את ה-DATABASE_URL אחד, לא את כל השאר.

## למה רק DATABASE_URL?
כל הפרטים (שם משתמש, סיסמה, כתובת השרת) כבר נמצאים בתוך ה-DATABASE_URL הזה.

---

**העתק את השורה הזו לVercel:**
```
DATABASE_URL=postgresql://neondb_owner:C7Hl1sNOaWbc@ep-small-band-a4crrvzj.us-east-1.aws.neon.tech/neondb?sslmode=require
```