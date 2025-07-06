const express = require('express');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'react-app/public')));

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') res.sendStatus(200);
    else next();
});

// Python API runner
function runPython(scriptPath, inputData = null) {
    return new Promise((resolve, reject) => {
        const py = spawn('python3', [scriptPath]);
        let output = '';
        let error = '';
        
        py.stdout.on('data', (data) => output += data.toString());
        py.stderr.on('data', (data) => error += data.toString());
        py.on('close', (code) => {
            if (code === 0) {
                try { resolve(JSON.parse(output)); }
                catch { resolve({ output }); }
            } else {
                reject(new Error(error || 'Python script failed'));
            }
        });
        
        if (inputData) {
            py.stdin.write(JSON.stringify(inputData));
            py.stdin.end();
        }
    });
}

// API Routes
app.post('/api/login', async (req, res) => {
    try {
        const result = await runPython('react-app/api/login.py', req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

app.post('/api/verify-token', async (req, res) => {
    try {
        const result = await runPython('react-app/api/verify_token.py', req.body);
        res.json(result);
    } catch (error) {
        res.status(401).json({ success: false, message: 'Token verification failed' });
    }
});

// Dashboard API
app.get('/api/get_dashboard_data', async (req, res) => {
    try {
        const result = await runPython('react-app/api/get_dashboard_data.py');
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Dashboard data failed' });
    }
});

app.get('/api/get_inventory', async (req, res) => {
    try {
        const result = await runPython('react-app/api/get_inventory.py');
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Inventory data failed' });
    }
});

app.get('/api/get_loans', async (req, res) => {
    try {
        const result = await runPython('react-app/api/get_loans.py');
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Loans data failed' });
    }
});

app.get('/api/get_alerts', async (req, res) => {
    try {
        const result = await runPython('react-app/api/get_alerts.py');
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Alerts data failed' });
    }
});

// Catch all - serve React app
app.get('*', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="he" dir="rtl">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>מערכת ניהול ציוד קולנוע</title>
            <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Hebrew:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <link href="https://cdn.jsdelivr.net/npm/@mui/material@5.13.0/umd/material-ui.css" rel="stylesheet">
            <style>
                body {
                    font-family: 'IBM Plex Sans Hebrew', 'Segoe UI', sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-align: center;
                    direction: rtl;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .container {
                    background: rgba(255,255,255,0.1);
                    padding: 40px;
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                    max-width: 600px;
                    width: 100%;
                }
                .logo {
                    font-size: 48px;
                    margin-bottom: 20px;
                }
                h1 {
                    font-size: 32px;
                    margin-bottom: 20px;
                    font-weight: 300;
                }
                .features {
                    background: rgba(255,255,255,0.1);
                    padding: 30px;
                    border-radius: 15px;
                    margin: 30px 0;
                    text-align: right;
                }
                .feature {
                    margin: 15px 0;
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                }
                .feature-icon {
                    margin-left: 15px;
                    font-size: 24px;
                }
                .login-form {
                    background: rgba(255,255,255,0.1);
                    padding: 30px;
                    border-radius: 15px;
                    margin: 30px 0;
                }
                .input-group {
                    margin: 20px 0;
                    text-align: right;
                }
                input {
                    width: 100%;
                    padding: 15px;
                    border: none;
                    border-radius: 10px;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    font-size: 16px;
                    direction: rtl;
                    text-align: right;
                }
                input::placeholder {
                    color: rgba(255,255,255,0.7);
                }
                button {
                    width: 100%;
                    padding: 15px;
                    border: none;
                    border-radius: 10px;
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    margin-top: 20px;
                    transition: transform 0.2s;
                }
                button:hover {
                    transform: translateY(-2px);
                }
                .stats {
                    display: flex;
                    justify-content: space-around;
                    margin: 30px 0;
                    flex-wrap: wrap;
                }
                .stat {
                    text-align: center;
                    margin: 10px;
                }
                .stat-number {
                    font-size: 36px;
                    font-weight: bold;
                    display: block;
                }
                .stat-label {
                    font-size: 14px;
                    opacity: 0.8;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">🎬</div>
                <h1>מערכת ניהול ציוד קולנוע</h1>
                
                <div class="stats">
                    <div class="stat">
                        <span class="stat-number">257</span>
                        <span class="stat-label">פריטי ציוד</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">20</span>
                        <span class="stat-label">קטגוריות</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">100%</span>
                        <span class="stat-label">פעיל</span>
                    </div>
                </div>

                <div class="features">
                    <div class="feature">
                        ניהול מלאי מתקדם <span class="feature-icon">📦</span>
                    </div>
                    <div class="feature">
                        מערכת השאלות והזמנות <span class="feature-icon">📋</span>
                    </div>
                    <div class="feature">
                        דשבורד עם סטטיסטיקות <span class="feature-icon">📊</span>
                    </div>
                    <div class="feature">
                        ממשק בעברית מלא <span class="feature-icon">🇮🇱</span>
                    </div>
                </div>

                <div class="login-form">
                    <form id="loginForm">
                        <div class="input-group">
                            <input type="text" id="username" placeholder="שם משתמש" required>
                        </div>
                        <div class="input-group">
                            <input type="password" id="password" placeholder="סיסמה" required>
                        </div>
                        <button type="submit">התחבר למערכת</button>
                    </form>
                </div>

                <p style="opacity: 0.8; font-size: 14px;">
                    למשתמשי בדיקה: admin / admin
                </p>
            </div>

            <script>
                document.getElementById('loginForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const username = document.getElementById('username').value;
                    const password = document.getElementById('password').value;
                    
                    try {
                        const response = await fetch('/api/login', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ username, password })
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            localStorage.setItem('token', result.user.token);
                            localStorage.setItem('user', JSON.stringify(result.user));
                            alert('התחברת בהצלחה! המערכת נטענת...');
                            window.location.reload();
                        } else {
                            alert('שגיאה בהתחברות: ' + result.message);
                        }
                    } catch (error) {
                        alert('שגיאה בחיבור לשרת');
                    }
                });

                // Check if user is already logged in
                const token = localStorage.getItem('token');
                if (token) {
                    document.querySelector('.container').innerHTML = \`
                        <div class="logo">🎬</div>
                        <h1>מערכת ניהול ציוד קולנוע</h1>
                        <div class="features">
                            <h2>המערכת פועלת בהצלחה!</h2>
                            <p>כל הפונקציות זמינות דרך API</p>
                            <div style="margin: 30px 0;">
                                <button onclick="testAPI()">בדיקת API</button>
                                <button onclick="logout()" style="background: #dc3545; margin-top: 10px;">התנתק</button>
                            </div>
                        </div>
                    \`;
                }

                function testAPI() {
                    fetch('/api/get_dashboard_data')
                        .then(response => response.json())
                        .then(data => {
                            alert('API עובד! נמצאו ' + data.inventory_summary.overview.total_items + ' פריטים');
                        })
                        .catch(error => {
                            alert('שגיאה ב-API: ' + error);
                        });
                }

                function logout() {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.reload();
                }
            </script>
        </body>
        </html>
    `);
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Cinema Equipment Management System running on port ${port}`);
    console.log(`📊 API endpoints: /api/login, /api/get_dashboard_data, /api/get_inventory`);
    console.log(`🎬 Frontend: Single page application with login`);
    console.log(`✅ System ready for production deployment`);
});