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
// שימוש בפורט 5000 לאפליקציה, כפי שהוגדר בדרישות Replit
const PORT = process.env.PORT || 5000;

// Middlewares - עדכון הגדרות CORS להרשאת גישה מורחבת
app.use(cors({
  origin: ['http://localhost:5000', 'http://127.0.0.1:5000', 'https://*.replit.dev', 'https://*.replit.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 שעות
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../build')));

/**
 * פונקציה כללית להפעלת סקריפט פייתון
 * @param {string} scriptPath - נתיב לסקריפט
 * @param {Array} args - פרמטרים לסקריפט
 * @param {Object} inputData - נתוני קלט JSON לשלוח לסקריפט
 * @returns {Promise} - הבטחה עם תוצאות הסקריפט
 */
function runPythonScript(scriptPath, args = [], inputData = null) {
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

    // הגבלת זמן ריצה
    const timeoutMs = 30000; // 30 שניות
    const timeoutId = setTimeout(() => {
      console.error(`Python script timeout after ${timeoutMs/1000} seconds: ${scriptPath}`);
      pythonProcess.kill();
      reject(new Error(`Script execution timed out after ${timeoutMs/1000} seconds`));
    }, timeoutMs);

    // אם יש נתוני קלט, נשלח אותם לסקריפט
    if (inputData) {
      try {
        pythonProcess.stdin.write(JSON.stringify(inputData));
        pythonProcess.stdin.end();
      } catch (inputError) {
        clearTimeout(timeoutId);
        console.error(`Error sending input to Python script: ${inputError}`);
        return reject(new Error(`Failed to send input to script: ${inputError.message}`));
      }
    }

    pythonProcess.stdout.on('data', (data) => {
      try {
        const chunk = data.toString('utf8');
        dataString += chunk;
        console.log(`Python stdout: ${chunk.substring(0, 150)}${chunk.length > 150 ? '...' : ''}`);
      } catch (stdoutError) {
        console.error(`Error processing stdout: ${stdoutError}`);
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      try {
        const chunk = data.toString('utf8');
        errorString += chunk;
        console.error(`Python stderr: ${chunk}`);
      } catch (stderrError) {
        console.error(`Error processing stderr: ${stderrError}`);
      }
    });

    pythonProcess.on('close', (code) => {
      clearTimeout(timeoutId);
      console.log(`Python script exited with code ${code}`);
      
      if (code !== 0) {
        console.error(`Python script error (${code}): ${errorString}`);
        return reject(new Error(errorString || 'Python script error'));
      }

      // אם אין תוכן פלט, מחזירים מערך ריק
      if (!dataString || !dataString.trim()) {
        console.log('No output from Python script, returning empty array');
        return resolve([]);
      }

      try {
        // בדיקה אם הפלט נראה כמו מערך
        if (dataString.trim().startsWith('[') && dataString.trim().endsWith(']')) {
          console.log(`Trying to parse as array: ${dataString.substring(0, 150)}${dataString.length > 150 ? '...' : ''}`);
          const result = JSON.parse(dataString);
          console.log(`Successfully parsed array with ${result.length} items`);
          return resolve(result);
        }
        
        // בדיקה אם הפלט נראה כמו אובייקט JSON
        if (dataString.trim().startsWith('{') && dataString.trim().endsWith('}')) {
          console.log(`Trying to parse as object: ${dataString.substring(0, 150)}${dataString.length > 150 ? '...' : ''}`);
          const result = JSON.parse(dataString);
          console.log(`Successfully parsed object with keys: ${Object.keys(result).join(', ')}`);
          return resolve(result);
        }
        
        // ניסיון אחרון לפענח את כל התוכן כ-JSON
        console.log(`Trying to parse entire content: ${dataString.substring(0, 150)}${dataString.length > 150 ? '...' : ''}`);
        const result = JSON.parse(dataString);
        console.log(`Successfully parsed JSON. Type: ${Array.isArray(result) ? 'Array' : typeof result}`);
        resolve(result);
      } catch (jsonError) {
        console.error(`Error parsing JSON: ${jsonError.message}`);
        
        // אם לא הצלחנו לפענח את התוכן כ-JSON, מחזירים מערך עם בודד עם המחרוזת
        // זה ימנע שבירת האפליקציה
        console.log(`Returning empty array to prevent UI crash`);
        resolve([]);
      }
    });

    // טיפול בשגיאות בהפעלת התהליך
    pythonProcess.on('error', (err) => {
      clearTimeout(timeoutId);
      console.error(`Error running Python process: ${err}`);
      reject(new Error(`Failed to run script: ${err.message}`));
    });
  });
}

// נתיבי API

// אימות והרשאות
app.post('/api/auth/login', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/login.py'),
      [],
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(401).json({ message: 'שם משתמש או סיסמה שגויים' });
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
    try {
      const result = await runPythonScript(
        path.join(__dirname, '../api/get_inventory.py')
      );
      
      // בדיקה שהתוצאה היא מערך
      if (Array.isArray(result)) {
        // אם התוצאה היא מערך, מחזירים אותה כ-JSON
        console.log(`Inventory API result: Array with ${result.length} items`);
        return res.json(result);
      } else if (typeof result === 'object' && result !== null) {
        // אם התוצאה היא אובייקט אחר, בודקים אם זו שגיאה
        if (result.error) {
          console.error('Error from inventory API:', result.message);
          return res.status(500).json({ 
            message: 'שגיאה בקבלת נתוני מלאי: ' + result.message,
            error: true 
          });
        }
        // אחרת מחזירים את האובייקט
        console.log('Inventory API result: Object response');
        return res.json(result);
      } else if (typeof result === 'string') {
        // אם התוצאה היא מחרוזת, מנסים לפענח אותה כ-JSON
        console.log('Inventory API result: String response, trying to parse as JSON');
        try {
          const parsedResult = JSON.parse(result);
          return res.json(parsedResult);
        } catch (parseError) {
          console.error('Failed to parse inventory result as JSON:', parseError);
          return res.status(500).json({ 
            message: 'שגיאה בפענוח תשובת API המלאי', 
            error: true 
          });
        }
      }
      
      // אם הגענו לכאן, התוצאה היא בפורמט לא צפוי
      console.error('Unexpected inventory API result format:', typeof result);
      return res.status(500).json({ 
        message: 'פורמט לא צפוי מ-API המלאי', 
        error: true 
      });
    } catch (error) {
      console.error('Error processing inventory request:', error);
      res.status(500).json({ 
        message: 'שגיאה בקבלת נתוני מלאי: ' + error.message,
        error: true 
      });
    }
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

// ניתוב כל בקשה אחרת לאפליקציית React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// הפעלת השרת
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});