#!/bin/bash

# סקריפט דיפלוי למערכת ניהול ציוד קולנוע
echo "Starting Cinema Equipment Management System..."

# הגדרת משתני סביבה
export NODE_ENV=production
export PORT=${PORT:-5000}
export HOST=0.0.0.0

echo "Installing dependencies..."
npm install

echo "Starting production server on port $PORT..."

# הפעלת שרת הפרודקשן עם כל ה-API ו-React
node production_server.js