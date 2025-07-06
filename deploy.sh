#!/bin/bash

# סקריפט דיפלוי אוטומטי למערכת ניהול ציוד קולנוע
echo "🚀 Starting Cinema Equipment Management System..."

# מעבר לתיקיית הפרויקט
cd react-app

# התקנת חבילות
echo "📦 Installing dependencies..."
npm install --production=false

# הגדרת משתני סביבה
export NODE_ENV=production
export PORT=${PORT:-5000}
export HOST=0.0.0.0

echo "🌟 Starting server on host $HOST:$PORT..."

# התחלת השרת בפרודקשן
node server/server.js