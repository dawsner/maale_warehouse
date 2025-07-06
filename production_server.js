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

// Start React development server and serve through this server

// Start React dev server on port 3001 (different from main server)
const reactProcess = spawn('npm', ['run', 'start'], {
    cwd: path.join(__dirname, 'react-app'),
    env: { 
        ...process.env, 
        PORT: '3001',
        BROWSER: 'none',
        HOST: '0.0.0.0'
    },
    stdio: 'pipe'
});

// Proxy React requests to internal port 3000
const { createProxyMiddleware } = require('http-proxy-middleware');

// Proxy frontend requests to React dev server
const reactProxy = createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    ws: true, // enable websockets
    timeout: 60000,
    proxyTimeout: 60000,
    onError: (err, req, res) => {
        console.log('Proxy error:', err);
        res.status(500).send('React app not ready yet, please wait...');
    }
});

// Serve static files first, then proxy to React
app.use('/static', reactProxy);
app.use('/manifest.json', reactProxy);
app.use('/favicon.ico', reactProxy);

// Catch all other requests and proxy to React
app.get('*', (req, res, next) => {
    // Skip API requests
    if (req.path.startsWith('/api/')) {
        return next();
    }
    // Proxy to React dev server
    reactProxy(req, res, next);
});

// Cleanup on exit
process.on('exit', () => {
    if (reactProcess) {
        reactProcess.kill();
    }
});

process.on('SIGTERM', () => {
    if (reactProcess) {
        reactProcess.kill();
    }
    process.exit(0);
});

process.on('SIGINT', () => {
    if (reactProcess) {
        reactProcess.kill();
    }
    process.exit(0);
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Cinema Equipment Management System running on http://0.0.0.0:${port}`);
    console.log(`📊 API endpoints available at http://0.0.0.0:${port}/api/`);
    console.log(`🎬 Frontend available at http://0.0.0.0:${port}/`);
});