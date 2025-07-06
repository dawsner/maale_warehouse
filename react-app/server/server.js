/**
 * שרת Express עבור מערכת ניהול ציוד קולנוע
 * משמש כשכבת ביניים בין ממשק המשתמש React לבין קוד הפייתון הקיים
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 80;
const HOST = process.env.HOST || '0.0.0.0';

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(bodyParser.json());

/**
 * פונקציה כללית להפעלת סקריפט פייתון
 * @param {string} scriptPath - נתיב לסקריפט
 * @param {Array} args - פרמטרים לסקריפט
 * @param {Object} inputData - נתוני קלט JSON לשלוח לסקריפט
 * @returns {Promise} - הבטחה עם תוצאות הסקריפט
 */
function runPythonScript(scriptPath, args = [], inputData = null) {
  console.log("Running Python script:", scriptPath);
  return new Promise((resolve, reject) => {
    // נבדוק אם הקובץ קיים
    try {
      fs.accessSync(scriptPath, fs.constants.F_OK);
    } catch (err) {
      console.error(`Script not found: ${scriptPath}`);
      return reject(new Error(`Script not found: ${scriptPath}`));
    }

    console.log(`Running Python script: ${scriptPath}`);
    const pythonProcess = spawn('python3', [scriptPath, ...args]);
    let dataString = '';
    let errorString = '';

    // אם יש נתוני קלט, נשלח אותם לסקריפט
    if (inputData) {
      pythonProcess.stdin.write(JSON.stringify(inputData));
      pythonProcess.stdin.end();
    }

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
      console.log(`Python stdout: ${data.toString().substring(0, 150)}${data.toString().length > 150 ? '...' : ''}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
      console.error(`Python stderr: ${data.toString()}`);
    });

    pythonProcess.on('close', (code) => {
      console.log(`Python script exited with code ${code}`);
      if (code !== 0) {
        console.error(`Python script error (${code}): ${errorString}`);
        return reject(new Error(errorString || 'Python script error'));
      }

      try {
        console.log(`Trying to parse JSON: ${dataString.substring(0, 150)}${dataString.length > 150 ? '...' : ''}`);
        const result = JSON.parse(dataString);
        console.log(`Successfully parsed JSON. Type: ${Array.isArray(result) ? 'Array' : typeof result}`);
        resolve(result);
      } catch (e) {
        console.error(`Error parsing JSON: ${e.message}`);
        if (dataString.trim()) {
          console.log(`Returning raw string (${dataString.length} chars)`);
          resolve(dataString.trim());
        } else {
          console.log('Returning success object');
          resolve({ success: true });
        }
      }
    });
  });
}

// נתיבי API

// אימות והרשאות
app.post('/api/login', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/login.py'),
      [],
      req.body
    );
    res.json(result);
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(401).json({ message: 'שם משתמש או סיסמה שגויים - ' + error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/login.py'),
      [],
      req.body
    );
    res.json(result);
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(401).json({ message: 'שם משתמש או סיסמה שגויים - ' + error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/register.py'),
      [],
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: 'שגיאה בהרשמה: ' + error.message });
  }
});

app.post('/api/verify-token', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/verify_token.py'),
      [],
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(401).json({ message: 'שגיאה באימות טוקן: ' + error.message });
  }
});

app.post('/api/auth/verify-token', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/verify_token.py'),
      [],
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(401).json({ message: 'שגיאה באימות טוקן: ' + error.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  // טוקן נשלח בכותרת Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'לא התקבל טוקן הרשאה' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/verify_token.py'),
      [],
      { token }
    );
    res.json(result);
  } catch (error) {
    res.status(401).json({ message: 'טוקן לא תקין או פג תוקף' });
  }
});

// ניהול מלאי
app.get('/api/inventory', async (req, res) => {
  try {
    console.log('Received request for inventory data');
    const result = await runPythonScript(
      path.join(__dirname, '../api/get_inventory.py')
    );
    console.log('Inventory API result:', typeof result === 'string' ? 'Text response' : (Array.isArray(result) ? `Array with ${result.length} items` : typeof result));
    res.json(result);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: 'שגיאה בקבלת נתוני מלאי: ' + error.message });
  }
});

app.post('/api/inventory', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/add_item.py'),
      [],
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: 'שגיאה בהוספת פריט: ' + error.message });
  }
});

app.put('/api/inventory/:id', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/update_item.py'),
      [],
      { id: req.params.id, ...req.body }
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: 'שגיאה בעדכון פריט: ' + error.message });
  }
});

app.delete('/api/inventory/:id', async (req, res) => {
  try {
    await runPythonScript(
      path.join(__dirname, '../api/delete_item.py'),
      [],
      { id: req.params.id }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: 'שגיאה במחיקת פריט: ' + error.message });
  }
});

app.put('/api/inventory/:id/availability', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/toggle_availability.py'),
      [],
      { id: req.params.id, isAvailable: req.body.isAvailable }
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: 'שגיאה בעדכון זמינות פריט: ' + error.message });
  }
});

// עדכון הרשאות פריט לפי שנות לימוד
app.post('/api/inventory/update-permissions', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/update_item_permissions.py'),
      [],
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: 'שגיאה בעדכון הרשאות פריט: ' + error.message });
  }
});

// ניהול השאלות
app.get('/api/loans', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/get_loans.py')
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת נתוני השאלות: ' + error.message });
  }
});

app.get('/api/loans/user/:userId', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/get_user_loans.py'),
      [],
      { userId: req.params.userId }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת נתוני השאלות: ' + error.message });
  }
});

app.post('/api/loans', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/create_loan.py'),
      [],
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: 'שגיאה ביצירת השאלה: ' + error.message });
  }
});

app.put('/api/loans/:id/return', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/return_loan.py'),
      [],
      { loanId: req.params.id, returnNotes: req.body.returnNotes }
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: 'שגיאה בהחזרת פריט: ' + error.message });
  }
});

app.get('/api/loans/:id', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/get_loan_details.py'),
      [],
      { loanId: req.params.id }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת פרטי השאלה: ' + error.message });
  }
});

// קבלת רשימת הסטודנטים
app.get('/api/students', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/get_students.py')
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת נתוני סטודנטים: ' + error.message });
  }
});

// ניהול הזמנות
app.get('/api/reservations', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/get_reservations.py')
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת נתוני הזמנות: ' + error.message });
  }
});

app.get('/api/reservations/user/:userId', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/get_user_reservations.py'),
      [],
      { userId: req.params.userId }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת נתוני הזמנות: ' + error.message });
  }
});

app.post('/api/reservations', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/create_reservation.py'),
      [],
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: 'שגיאה ביצירת הזמנה: ' + error.message });
  }
});

app.put('/api/reservations/:id/status', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/update_reservation_status.py'),
      [],
      { reservationId: req.params.id, status: req.body.status }
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: 'שגיאה בעדכון סטטוס הזמנה: ' + error.message });
  }
});

// בדיקת זמינות פריט בטווח תאריכים
app.post('/api/reservations/check-availability', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/check_item_availability.py'),
      [],
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: 'שגיאה בבדיקת זמינות: ' + error.message });
  }
});

// דשבורד
app.get('/api/dashboard', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/get_dashboard_data.py')
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת נתוני דשבורד: ' + error.message });
  }
});

// סטטיסטיקות
app.get('/api/stats/equipment-usage', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/get_equipment_usage_stats.py')
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת נתוני שימוש בציוד: ' + error.message });
  }
});

app.get('/api/stats/student-usage', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/get_student_stats.py')
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת נתוני סטודנטים: ' + error.message });
  }
});

app.get('/api/stats/monthly-trends', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/get_monthly_trends.py')
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת נתוני מגמות חודשיות: ' + error.message });
  }
});

app.get('/api/stats/category-analysis', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/get_category_analysis.py')
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת ניתוח קטגוריות: ' + error.message });
  }
});

// דוחות מתקדמים וניתוח נתונים
app.post('/api/advanced-reports', async (req, res) => {
  try {
    console.log('Received advanced report request:', JSON.stringify(req.body).substring(0, 200));
    const result = await runPythonScript(
      path.join(__dirname, '../api/get_advanced_reports.py'),
      [],
      req.body
    );
    res.json(result);
  } catch (error) {
    console.error('Error generating advanced report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בהפקת דו"ח מתקדם: ' + error.message 
    });
  }
});

// ייצוא דוחות מתקדמים בפורמטים שונים
app.post('/api/export-advanced-report', async (req, res) => {
  try {
    console.log('Received advanced report export request:', JSON.stringify(req.body).substring(0, 200));
    const result = await runPythonScript(
      path.join(__dirname, '../api/export_advanced_report.py'),
      [],
      req.body
    );
    
    // בדיקה האם מדובר בקובץ או תשובת JSON
    if (result.format === 'excel' || result.format === 'csv') {
      // כאשר התוצאה היא קובץ מקודד ב-base64, נפענח ונחזיר
      const fileBuffer = Buffer.from(result.data, 'base64');
      res.setHeader('Content-Type', result.format === 'excel' ? 
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 
                  'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(fileBuffer);
    } else {
      // החזרת התוצאה כ-JSON
      res.json(result);
    }
  } catch (error) {
    console.error('Error exporting advanced report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בייצוא דו"ח מתקדם: ' + error.message 
    });
  }
});

// ניהול משתמשים
app.post('/api/user-management', async (req, res) => {
  try {
    console.log('Received user management request for action:', req.body.action);
    const result = await runPythonScript(
      path.join(__dirname, '../api/user_management.py'),
      [],
      req.body
    );
    res.json(result);
  } catch (error) {
    console.error('Error in user management operation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בפעולת ניהול משתמשים: ' + error.message 
    });
  }
});

// קונפיגורציה של multer לטיפול בקבצים
const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: 10 * 1024 * 1024, // מקסימום 10MB
  }
});

// יבוא/יצוא
app.post('/api/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'לא נשלח קובץ' });
    }

    console.log('File received:', req.file);
    console.log('Form data:', req.body);

    const action = req.body.action || 'import';
    const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : {};

    const result = await runPythonScript(
      path.join(__dirname, '../api/excel_preview.py'),
      [],
      {
        action,
        file_path: req.file.path,
        mapping
      }
    );

    res.json(result);
  } catch (error) {
    console.error('Error processing import:', error);
    res.status(400).json({ message: 'שגיאה ביבוא נתונים: ' + error.message });
  }
});

// תצוגה מקדימה של יבוא אקסל
app.post('/api/import/preview', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'לא נשלח קובץ' });
    }

    console.log('Preview file received:', req.file);

    const result = await runPythonScript(
      path.join(__dirname, '../api/excel_preview.py'),
      [],
      {
        action: 'preview',
        file_path: req.file.path
      }
    );

    res.json(result);
  } catch (error) {
    console.error('Error processing import preview:', error);
    res.status(400).json({ message: 'שגיאה בהצגת תצוגה מקדימה: ' + error.message });
  }
});

// יבוא אקסל עם מיפוי עמודות
app.post('/api/import/with-mapping', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'לא נשלח קובץ' });
    }

    console.log('Import with mapping file received:', req.file);
    
    const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : {};
    
    const result = await runPythonScript(
      path.join(__dirname, '../api/excel_preview.py'),
      [],
      {
        action: 'import',
        file_path: req.file.path,
        mapping
      }
    );

    res.json(result);
  } catch (error) {
    console.error('Error processing import with mapping:', error);
    res.status(400).json({ message: 'שגיאה ביבוא נתונים: ' + error.message });
  }
});

// יצוא כל המלאי לאקסל
app.get('/api/export', async (req, res) => {
  try {
    // יצירת קובץ הייצוא
    const result = await runPythonScript(
      path.join(__dirname, '../api/export_excel.py')
    );
    
    // בדיקה האם התקבל נתיב לקובץ
    if (!result || !result.file_path) {
      return res.status(500).json({ message: 'שגיאה ביצירת קובץ ייצוא' });
    }
    
    // שליחת הקובץ
    res.download(result.file_path, 'inventory_export.xlsx', (err) => {
      if (err) {
        console.error('Error sending export file:', err);
      }
      
      // מחיקת הקובץ הזמני אחרי שליחתו
      try {
        fs.unlinkSync(result.file_path);
      } catch (unlinkErr) {
        console.error('Error deleting temporary export file:', unlinkErr);
      }
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ message: 'שגיאה ביצוא נתונים: ' + error.message });
  }
});

// יצוא אקסל עם פילטרים
app.post('/api/export/filtered', async (req, res) => {
  try {
    // יצירת קובץ הייצוא עם פילטרים
    const result = await runPythonScript(
      path.join(__dirname, '../api/export_excel.py'),
      [],
      { filters: req.body }
    );
    
    // בדיקה האם התקבל נתיב לקובץ
    if (!result || !result.file_path) {
      return res.status(500).json({ message: 'שגיאה ביצירת קובץ ייצוא' });
    }
    
    // שליחת הקובץ
    res.download(result.file_path, 'filtered_inventory_export.xlsx', (err) => {
      if (err) {
        console.error('Error sending filtered export file:', err);
      }
      
      // מחיקת הקובץ הזמני אחרי שליחתו
      try {
        fs.unlinkSync(result.file_path);
      } catch (unlinkErr) {
        console.error('Error deleting temporary export file:', unlinkErr);
      }
    });
  } catch (error) {
    console.error('Error exporting filtered data:', error);
    res.status(500).json({ message: 'שגיאה ביצוא נתונים: ' + error.message });
  }
});

// קבלת תבנית ייצוא אקסל
app.get('/api/export/template', async (req, res) => {
  try {
    // יצירת קובץ תבנית
    const result = await runPythonScript(
      path.join(__dirname, '../api/export_excel.py'),
      [],
      { template: true }
    );
    
    // בדיקה האם התקבל נתיב לקובץ
    if (!result || !result.file_path) {
      return res.status(500).json({ message: 'שגיאה ביצירת קובץ תבנית' });
    }
    
    // שליחת הקובץ
    res.download(result.file_path, 'inventory_template.xlsx', (err) => {
      if (err) {
        console.error('Error sending template file:', err);
      }
      
      // מחיקת הקובץ הזמני אחרי שליחתו
      try {
        fs.unlinkSync(result.file_path);
      } catch (unlinkErr) {
        console.error('Error deleting temporary template file:', unlinkErr);
      }
    });
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ message: 'שגיאה ביצירת תבנית: ' + error.message });
  }
});

// הסרת המשפט הזה כי הוא מפריע לנתיבי ה-API שמוגדרים אחריו
// נעביר אותו לסוף הקובץ

// הפעלת השרת
/* נתיבי API למערכת ההתראות */

// נתיב להחזרת כל ההתראות
app.post('/api/alerts', async (req, res) => {
  try {
    const { days_threshold, stock_threshold } = req.body;
    const inputData = JSON.stringify({ 
      days_threshold: days_threshold || 3, 
      stock_threshold: stock_threshold || 20
    });
    const result = await runPythonScript(
      path.join(__dirname, '../api/get_alerts.py'),
      [inputData]
    );
    res.json(result);
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({ error: error.message });
  }
});

// נתיב לשליחת התראת אימייל
app.post('/api/send-email-alert', async (req, res) => {
  try {
    const { alert_type, data, email } = req.body;
    
    if (!alert_type || !data || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields: alert_type, data, email',
        success: false 
      });
    }
    
    const inputData = JSON.stringify({ alert_type, data, email });
    const result = await runPythonScript(
      path.join(__dirname, '../api/send_email_notification.py'),
      [inputData]
    );
    res.json(result);
  } catch (error) {
    console.error('Error sending email alert:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

// ===== נתיבי API למערכת ניהול תחזוקה ותיקונים =====

// קבלת נתוני תחזוקה
app.post('/api/maintenance/data', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/get_maintenance_data.py'),
      [],
      req.body
    );
    res.json(result);
  } catch (error) {
    console.error('Error getting maintenance data:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// עדכון נתוני תחזוקה
app.post('/api/maintenance/update', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/update_maintenance_data.py'),
      [],
      req.body
    );
    res.json(result);
  } catch (error) {
    console.error('Error updating maintenance data:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});



// קיצור נתיב לקבלת סקירת מצב תחזוקה
app.get('/api/maintenance/overview', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/get_maintenance_overview.py')
    );
    res.json(result);
  } catch (error) {
    console.error('Error getting maintenance overview:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// קיצור נתיב לקבלת תזכורות תחזוקה קרובות
app.get('/api/maintenance/upcoming', async (req, res) => {
  const days = req.query.days ? parseInt(req.query.days) : 30;
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/get_maintenance_data.py'),
      [],
      { 
        action: 'upcoming_schedules',
        days: days
      }
    );
    res.json(result);
  } catch (error) {
    console.error('Error getting upcoming maintenance:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// מסלולי API תחזוקה - בסגנון /api/inventory שעובד
app.get('/api/maintenance', async (req, res) => {
  try {
    console.log("Running maintenance API in inventory style");
    const result = await runPythonScript(
      path.join(__dirname, '../api/get_maintenance_overview.py')
    );
    console.log("Maintenance data result:", typeof result === 'string' ? 'Text response' : (Array.isArray(result) ? `Array with ${result.length} items` : typeof result));
    res.json(result);
  } catch (error) {
    console.error('Error fetching maintenance data:', error);
    res.status(500).json({ message: 'שגיאה בקבלת נתוני תחזוקה: ' + error.message });
  }
});

// הגדרות API נוספות
// מסלול אחד מרוכז לתחזוקה
app.get('/api/maintenance_data', async (req, res) => {
  try {
    console.log("Requesting maintenance data");
    const result = await runPythonScript(
      path.join(__dirname, '../api/get_maintenance_overview.py')
    );
    console.log("Maintenance data response type:", typeof result);
    res.json(result);
  } catch (error) {
    console.error('Error getting maintenance data:', error);
    res.status(500).json({ message: 'Error getting maintenance data: ' + error.message });
  }
});

// מסלול לניהול מערכי הזמנות
app.post('/api/templates', async (req, res) => {
  try {
    console.log("Templates management request:", req.body);
    const result = await runPythonScript(
      path.join(__dirname, '../api/manage_templates.py'),
      req.body
    );
    console.log("Templates API result:", typeof result);
    res.json(result);
  } catch (error) {
    console.error('Error managing templates:', error);
    res.status(500).json({ message: 'Error managing templates: ' + error.message });
  }
});

// מסלול לקבלת מערכי הזמנות עבור האשף
app.get('/api/order_templates', async (req, res) => {
  try {
    console.log("Getting order templates for wizard");
    const result = await runPythonScript(
      path.join(__dirname, '../api/get_templates.py')
    );
    console.log("Order templates result:", typeof result);
    res.json(result);
  } catch (error) {
    console.error('Error getting order templates:', error);
    res.status(500).json({ message: 'Error getting order templates: ' + error.message });
  }
});

// רק עבור דיפלוי פרודקשן - אחרת React Dev Server מטפל בזה
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
  });
}

app.listen(PORT, HOST, () => {
  console.log(`🚀 Cinema Equipment Management Server running on http://${HOST}:${PORT}`);
});