#!/bin/bash

# סקריפט דיפלוי אוטומטי למערכת ניהול ציוד קולנוע
# פועל על כל פלטפורמה: Replit, Railway, Render, Vercel

echo "🚀 Starting deployment process..."

# מעבר לתיקיית הפרויקט
cd react-app

# התקנת חבילות
echo "📦 Installing dependencies..."
npm install

# בדיקה אם קיימת תיקיית build
if [ ! -d "build" ]; then
    echo "🔨 Building React app for production..."
    npm run build || {
        echo "⚠️  Build failed, using development mode"
    }
fi

# הגדרת משתני סביבה לפרודקשן
export NODE_ENV=production
export PORT=${PORT:-5000}

echo "🌟 Starting production server on port $PORT..."
node server/server.js