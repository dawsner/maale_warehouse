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
const PORT = process.env.PORT || 5100;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
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

    const action = req.body.action || 'preview';
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

app.get('/api/export', async (req, res) => {
  try {
    const result = await runPythonScript(
      path.join(__dirname, '../api/export_excel.py')
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'שגיאה ביצוא נתונים: ' + error.message });
  }
});

// ניתוב כל בקשה אחרת לאפליקציית React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// הפעלת השרת
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});