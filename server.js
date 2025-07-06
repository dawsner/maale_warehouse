const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build and public
app.use(express.static(path.join(__dirname, 'react-app/build')));
app.use(express.static(path.join(__dirname, 'react-app/public')));
app.use(express.static(path.join(__dirname, 'react-app/src')));

// API routes - run Python scripts
app.use('/api', (req, res, next) => {
  const scriptPath = path.join(__dirname, 'react-app/api', `${req.path.slice(1)}.py`);
  
  const python = spawn('python3', [scriptPath], {
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let jsonInput = '';
  if (req.method === 'POST' && req.body) {
    jsonInput = JSON.stringify(req.body);
  }

  if (jsonInput) {
    python.stdin.write(jsonInput);
  }
  python.stdin.end();

  let stdout = '';
  let stderr = '';

  python.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  python.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  python.on('close', (code) => {
    if (stderr && stderr.trim()) {
      console.error(`Python stderr: ${stderr}`);
    }

    if (code !== 0) {
      return res.status(500).json({ error: `Script exited with code ${code}`, stderr });
    }

    try {
      const result = JSON.parse(stdout);
      res.json(result);
    } catch (e) {
      console.error('Failed to parse JSON:', stdout);
      res.status(500).json({ error: 'Invalid JSON response', output: stdout });
    }
  });

  python.on('error', (err) => {
    console.error('Failed to start Python script:', err);
    res.status(500).json({ error: 'Failed to start script', details: err.message });
  });
});

// Development mode - serve React dev files
if (process.env.NODE_ENV !== 'production') {
  // Serve React development files
  app.use('/static', express.static(path.join(__dirname, 'react-app/build/static')));
  app.use('/', express.static(path.join(__dirname, 'react-app/public')));
  
  // For development, redirect to React dev server
  app.get('*', (req, res) => {
    res.redirect('http://localhost:3000' + req.path);
  });
} else {
  // Production mode - serve built React files
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'react-app/build', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Cinema Equipment Management Server running on http://0.0.0.0:${PORT}`);
});