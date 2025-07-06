const express = require('express');
const path = require('path');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Serve static files from current directory
app.use(express.static(__dirname));

// API proxy to Python scripts
app.all('/api/*', (req, res) => {
  console.log(`API Request: ${req.method} ${req.path}`);
  
  const apiPath = req.path.replace('/api/', '');
  const scriptPath = path.join(__dirname, 'api', `${apiPath}.py`);
  
  const python = spawn('python3', [scriptPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: __dirname
  });
  
  // Send request data to Python script
  if (req.body && Object.keys(req.body).length > 0) {
    python.stdin.write(JSON.stringify(req.body));
  }
  python.stdin.end();
  
  let output = '';
  let errorOutput = '';
  
  python.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  python.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });
  
  python.on('close', (code) => {
    if (code !== 0) {
      console.error(`Python script error: ${errorOutput}`);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    try {
      const result = JSON.parse(output);
      res.json(result);
    } catch (e) {
      console.error(`JSON parse error: ${e.message}`);
      res.status(500).json({ error: 'Invalid response format' });
    }
  });
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Production server running on http://0.0.0.0:${PORT}`);
  console.log(`🌐 Available at: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
});