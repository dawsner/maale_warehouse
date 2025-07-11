/**
 * הגדרות API כלליות
 * מכיל קונפיגורציה בסיסית לבקשות HTTP
 */

// נתיב בסיסי לכל קריאות ה-API
export const API_URL = '';  // נתיב יחסי - מסתמך על הגדרת ה-proxy ב-package.json

// כותרות ברירת מחדל לכל הבקשות
export const BASE_HEADERS = {
  'Content-Type': 'application/json',
};

// הגדרות זמן כללי
export const TIMEOUTS = {
  DEFAULT: 30000,      // 30 seconds - ברירת מחדל לרוב הבקשות
  LONG: 60000,         // 60 seconds - לבקשות שעשויות לקחת זמן רב יותר
  SHORT: 10000         // 10 seconds - לבקשות מהירות
};

// קובץ הגדרות API
const config = {
  development: {
    apiBaseUrl: 'http://0.0.0.0:5000'
  },
  production: {
    apiBaseUrl: ''
  }
};

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? config.production.apiBaseUrl 
  : config.development.apiBaseUrl;

export default API_BASE_URL;