const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

// אפשר CORS לפיתוח
app.use(cors());

// עיבוד גוף בקשות JSON
app.use(bodyParser.json());

/**
 * פונקציה כללית להפעלת סקריפט פייתון
 * @param {string} scriptPath - נתיב לסקריפט
 * @param {Array} args - פרמטרים לסקריפט
 * @param {Object} inputData - נתוני קלט JSON לשלוח לסקריפט
 * @returns {Promise} - הבטחה עם תוצאות הסקריפט
 */
function runPythonScript(scriptPath, args = [], inputData = null) {
  return new Promise((resolve, reject) => {
    const fullPath = path.resolve(__dirname, '../api', scriptPath);
    const pythonProcess = spawn('python3', [fullPath, ...args]);
    
    let resultData = '';
    let errorData = '';
    
    // אם יש נתוני קלט, שלח אותם לסקריפט
    if (inputData) {
      pythonProcess.stdin.write(JSON.stringify(inputData));
      pythonProcess.stdin.end();
    }
    
    // איסוף פלט מהסקריפט
    pythonProcess.stdout.on('data', (data) => {
      resultData += data.toString();
    });
    
    // איסוף שגיאות מהסקריפט
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.error(`Python stderr: ${data}`);
    });
    
    // טיפול בסיום הסקריפט
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code}`);
        return reject(new Error(`Process exited with code ${code}: ${errorData}`));
      }
      
      try {
        // נסה לנתח את הפלט כ-JSON
        const jsonResult = JSON.parse(resultData);
        resolve(jsonResult);
      } catch (err) {
        // אם הפלט לא JSON תקין, החזר את הפלט כמחרוזת
        resolve(resultData);
      }
    });
    
    // טיפול בשגיאות בהפעלת התהליך
    pythonProcess.on('error', (err) => {
      console.error('Failed to start Python process', err);
      reject(err);
    });
  });
}

// ניתובים ל-API

// מלאי
app.get('/api/inventory', async (req, res) => {
  try {
    const result = await runPythonScript('get_inventory.py');
    res.json(result);
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ error: 'Failed to fetch inventory', details: err.message });
  }
});

app.post('/api/inventory', async (req, res) => {
  try {
    const result = await runPythonScript('create_item.py', [], req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error creating item:', err);
    res.status(500).json({ error: 'Failed to create item', details: err.message });
  }
});

app.put('/api/inventory/:id', async (req, res) => {
  try {
    const itemId = req.params.id;
    const result = await runPythonScript('update_item.py', [itemId], req.body);
    res.json(result);
  } catch (err) {
    console.error('Error updating item:', err);
    res.status(500).json({ error: 'Failed to update item', details: err.message });
  }
});

app.delete('/api/inventory/:id', async (req, res) => {
  try {
    const itemId = req.params.id;
    const result = await runPythonScript('delete_item.py', [itemId]);
    res.json(result);
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ error: 'Failed to delete item', details: err.message });
  }
});

app.patch('/api/inventory/:id/availability', async (req, res) => {
  try {
    const itemId = req.params.id;
    const { isAvailable } = req.body;
    const result = await runPythonScript('toggle_availability.py', [itemId, isAvailable]);
    res.json(result);
  } catch (err) {
    console.error('Error toggling availability:', err);
    res.status(500).json({ error: 'Failed to toggle availability', details: err.message });
  }
});

// השאלות
app.get('/api/loans', async (req, res) => {
  try {
    const result = await runPythonScript('get_loans.py');
    res.json(result);
  } catch (err) {
    console.error('Error fetching loans:', err);
    res.status(500).json({ error: 'Failed to fetch loans', details: err.message });
  }
});

app.get('/api/loans/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await runPythonScript('get_user_loans.py', [userId]);
    res.json(result);
  } catch (err) {
    console.error('Error fetching user loans:', err);
    res.status(500).json({ error: 'Failed to fetch user loans', details: err.message });
  }
});

app.post('/api/loans', async (req, res) => {
  try {
    const result = await runPythonScript('create_loan.py', [], req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error creating loan:', err);
    res.status(500).json({ error: 'Failed to create loan', details: err.message });
  }
});

app.patch('/api/loans/:id/return', async (req, res) => {
  try {
    const loanId = req.params.id;
    const { returnNotes } = req.body;
    const result = await runPythonScript('return_loan.py', [loanId], { returnNotes });
    res.json(result);
  } catch (err) {
    console.error('Error returning loan:', err);
    res.status(500).json({ error: 'Failed to return loan', details: err.message });
  }
});

// הזמנות
app.get('/api/reservations', async (req, res) => {
  try {
    const result = await runPythonScript('get_reservations.py');
    res.json(result);
  } catch (err) {
    console.error('Error fetching reservations:', err);
    res.status(500).json({ error: 'Failed to fetch reservations', details: err.message });
  }
});

app.get('/api/reservations/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await runPythonScript('get_user_reservations.py', [userId]);
    res.json(result);
  } catch (err) {
    console.error('Error fetching user reservations:', err);
    res.status(500).json({ error: 'Failed to fetch user reservations', details: err.message });
  }
});

app.patch('/api/reservations/:id/status', async (req, res) => {
  try {
    const reservationId = req.params.id;
    const { status } = req.body;
    const result = await runPythonScript('update_reservation_status.py', [reservationId, status]);
    res.json(result);
  } catch (err) {
    console.error('Error updating reservation status:', err);
    res.status(500).json({ error: 'Failed to update reservation status', details: err.message });
  }
});

// אימות והרשאות
app.post('/api/auth/login', async (req, res) => {
  try {
    const result = await runPythonScript('login.py', [], req.body);
    res.json(result);
  } catch (err) {
    console.error('Error during login:', err);
    res.status(401).json({ error: 'Authentication failed', details: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const result = await runPythonScript('register.py', [], req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(400).json({ error: 'Registration failed', details: err.message });
  }
});

// סטטיסטיקות
app.get('/api/stats/equipment-usage', async (req, res) => {
  try {
    const result = await runPythonScript('get_equipment_usage_stats.py');
    res.json(result);
  } catch (err) {
    console.error('Error fetching equipment usage stats:', err);
    res.status(500).json({ error: 'Failed to fetch equipment usage stats', details: err.message });
  }
});

// ייבוא/ייצוא Excel
app.post('/api/import-export/import', async (req, res) => {
  // הערה: צריך להוסיף טיפול בקבצים עם multer
  try {
    const result = await runPythonScript('import_excel.py');
    res.json(result);
  } catch (err) {
    console.error('Error importing Excel:', err);
    res.status(500).json({ error: 'Failed to import Excel', details: err.message });
  }
});

app.get('/api/import-export/export', async (req, res) => {
  try {
    const result = await runPythonScript('export_excel.py');
    // הערה: צריך לטפל בהחזרת קובץ במקום JSON
    res.json(result);
  } catch (err) {
    console.error('Error exporting Excel:', err);
    res.status(500).json({ error: 'Failed to export Excel', details: err.message });
  }
});

// שירות קבצים סטטיים (בעתיד, לפיתוח)
if (process.env.NODE_ENV === 'production') {
  // שירות קבצים סטטיים מתיקיית הבילד
  app.use(express.static(path.join(__dirname, '../build')));
  
  // כל בקשה אחרת תחזיר את ה-index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

// הפעלת השרת
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
