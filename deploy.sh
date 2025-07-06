#!/bin/bash

# סקריפט דיפלוי למערכת ניהול ציוד קולנוע
echo "Starting Cinema Equipment Management System..."

# הגדרת משתני סביבה
export NODE_ENV=production
export PORT=${PORT:-5000}
export HOST=0.0.0.0

echo "Starting production server on port $PORT..."

# הפעלת המערכת המלאה כמו בפיתוח אבל עם פורט אחר
cd react-app && npm run dev