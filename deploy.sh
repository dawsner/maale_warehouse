#!/bin/bash

# סקריפט דיפלוי פשוט למערכת ניהול ציוד קולנוע
echo "Starting Cinema Equipment Management System..."

# הגדרת משתני סביבה
export NODE_ENV=production
export PORT=${PORT:-5000}
export HOST=0.0.0.0

echo "Starting server on port $PORT..."

# התחלת השרת הראשי
node server.js