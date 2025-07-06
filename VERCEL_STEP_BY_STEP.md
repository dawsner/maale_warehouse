# מדריך Vercel - צעד אחר צעד (מדויק)

## שלב 1: יצירת חשבון
1. לך ל-**vercel.com**
2. לחץ **"Sign Up"** 
3. בחר **"Continue with GitHub"** (הכי קל)

## שלב 2: יצירת פרויקט חדש
1. אחרי ההתחברות, לחץ **"Add New..."**
2. בחר **"Project"**

## שלב 3: העלאת הקוד
**אפשרות A: מ-GitHub**
1. לחץ **"Import Git Repository"**
2. חבר את GitHub שלך
3. בחר את הfork של הפרויקט

**אפשרות B: העלאה ישירה (יותר פשוט)**
1. לחץ **"Browse"** או גרור קבצים
2. **רק** את התיקייה `react-app` (לא הכל!)
3. זיפ את התיקייה ועלה

## שלב 4: הגדרות הפרויקט
1. **Framework Preset**: בחר **"Create React App"**
2. **Root Directory**: השאר ריק (או כתב `./` אם שאלו)
3. **Build and Output Settings**:
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

## שלב 5: איפה Environment Variables? 
**⚠️ זה החלק שלא מוצאים:**

1. **לפני שלוחצים Deploy**, גלול למטה
2. תראה קטע **"Environment Variables"** 
3. אם לא - לחץ על **"Advanced Options"** תחילה
4. או: תמתין עד אחרי הפריסה ותלך ל-**Settings > Environment Variables**

## שלב 6: הוספת משתני הסביבה
בשדות:
- **NAME**: `DATABASE_URL`
- **VALUE**: `postgresql://neondb_owner:C7Hl1sNOaWbc@ep-small-band-a4crrvzj.us-east-1.aws.neon.tech/neondb?sslmode=require`
- **ENVIRONMENTS**: בחר All (Development, Preview, Production)

## שלב 7: Deploy!
לחץ **"Deploy"** והמתן 2-3 דקות

---

## אם פספסת את Environment Variables:
1. אחרי הפריסה, לך ל-**Dashboard**
2. בחר את הפרויקט שלך
3. לחץ **"Settings"** (בתפריט העליון)
4. לחץ **"Environment Variables"** (בתפריט הצדדי)
5. לחץ **"Add New"**
6. הוסף את הנתונים ולחץ **"Save"**
7. **חשוב**: לחץ **"Redeploy"** כדי שהשינויים ייכנסו לתוקף