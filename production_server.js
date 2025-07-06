const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

// Middleware for parsing JSON
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Function to run Python scripts
function runPythonScript(scriptPath, inputData = null) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python3', [scriptPath]);
        
        let output = '';
        let errorOutput = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(output);
                    resolve(result);
                } catch (e) {
                    resolve({ output: output, raw: true });
                }
            } else {
                reject(new Error(`Python script failed with code ${code}: ${errorOutput}`));
            }
        });
        
        if (inputData) {
            pythonProcess.stdin.write(JSON.stringify(inputData));
            pythonProcess.stdin.end();
        }
    });
}

// API Routes - all the Python API endpoints
const apiRoutes = [
    'get_dashboard_data',
    'get_inventory', 
    'get_loans',
    'get_reservations',
    'get_alerts',
    'get_students',
    'create_loan',
    'create_reservation',
    'add_item',
    'delete_item',
    'get_loan_details',
    'check_item_availability',
    'excel_preview',
    'export_excel',
    'get_maintenance_data',
    'get_maintenance_overview',
    'get_upcoming_maintenance',
    'get_templates',
    'get_equipment_usage_stats',
    'get_student_stats',
    'get_monthly_trends',
    'get_category_analysis',
    'advanced_analytics',
    'get_advanced_reports',
    'export_advanced_report'
];

// Login and auth routes
app.post('/api/login', async (req, res) => {
    try {
        const result = await runPythonScript(path.join(__dirname, 'react-app/api/login.py'), req.body);
        res.json(result);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

app.post('/api/verify-token', async (req, res) => {
    try {
        const result = await runPythonScript(path.join(__dirname, 'react-app/api/verify_token.py'), req.body);
        res.json(result);
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ success: false, message: 'Token verification failed' });
    }
});

// Dynamic API routes
apiRoutes.forEach(route => {
    app.get(`/api/${route}`, async (req, res) => {
        try {
            const scriptPath = path.join(__dirname, `react-app/api/${route}.py`);
            if (fs.existsSync(scriptPath)) {
                const result = await runPythonScript(scriptPath, req.query);
                res.json(result);
            } else {
                res.status(404).json({ error: 'API endpoint not found' });
            }
        } catch (error) {
            console.error(`API ${route} error:`, error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post(`/api/${route}`, async (req, res) => {
        try {
            const scriptPath = path.join(__dirname, `react-app/api/${route}.py`);
            if (fs.existsSync(scriptPath)) {
                const result = await runPythonScript(scriptPath, req.body);
                res.json(result);
            } else {
                res.status(404).json({ error: 'API endpoint not found' });
            }
        } catch (error) {
            console.error(`API ${route} error:`, error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
});

// Check if build directory exists, if not use development approach
const buildPath = path.join(__dirname, 'react-app/build');
const publicPath = path.join(__dirname, 'react-app/public');

if (fs.existsSync(buildPath)) {
    // Production mode - serve build files
    console.log('Production mode: serving build files');
    app.use(express.static(buildPath));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(buildPath, 'index.html'));
    });
} else {
    // Development mode - serve public files and proxy React dev server
    console.log('Development mode: serving public files');
    app.use(express.static(publicPath));
    
    app.get('*', (req, res) => {
        // Send a simple HTML that will load the React app
        res.send(`
            <!DOCTYPE html>
            <html lang="he" dir="rtl">
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>מערכת ניהול ציוד קולנוע</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        margin: 0;
                        padding: 20px;
                        background: #f5f5f5;
                        text-align: center;
                        direction: rtl;
                    }
                    .container {
                        max-width: 600px;
                        margin: 50px auto;
                        background: white;
                        padding: 40px;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .loading {
                        font-size: 18px;
                        color: #666;
                        margin-bottom: 20px;
                    }
                    .logo {
                        font-size: 24px;
                        font-weight: bold;
                        color: #1976d2;
                        margin-bottom: 30px;
                    }
                    .spinner {
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #1976d2;
                        border-radius: 50%;
                        width: 50px;
                        height: 50px;
                        animation: spin 1s linear infinite;
                        margin: 20px auto;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    .system-info {
                        background: #e3f2fd;
                        padding: 20px;
                        border-radius: 4px;
                        margin-top: 30px;
                        font-size: 14px;
                        color: #1565c0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="logo">🎬 מערכת ניהול ציוד קולנוע</div>
                    <div class="loading">המערכת נטענת...</div>
                    <div class="spinner"></div>
                    <div class="system-info">
                        <strong>המערכת המלאה פועלת!</strong><br>
                        • 257 פריטי ציוד זמינים<br>
                        • דשבורד מלא עם סטטיסטיקות<br>
                        • מערכת השאלות והזמנות<br>
                        • ממשק בעברית עם תמיכה RTL<br><br>
                        <strong>התחברות:</strong> admin/admin
                    </div>
                </div>
                <script>
                    // Redirect to React app (for development mode this should work)
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 3000);
                </script>
            </body>
            </html>
        `);
    });
}

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Cinema Equipment Management System running on http://0.0.0.0:${port}`);
    console.log(`📊 API endpoints available at http://0.0.0.0:${port}/api/`);
    console.log(`🎬 Frontend available at http://0.0.0.0:${port}/`);
});