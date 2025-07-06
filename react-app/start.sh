#!/bin/bash

# הגדרת משתני סביבה
export NODE_ENV=production
export PORT=5000

# התקנת חבילות
cd react-app
npm install

# הפעלת השרת
node server/server.js