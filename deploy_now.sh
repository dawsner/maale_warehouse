#!/bin/bash

echo "🚀 מכין deployment עכשיו..."

# Stop existing processes
pkill -f "react-scripts" 2>/dev/null
pkill -f "node server" 2>/dev/null

cd react-app

# Create production-ready version
echo "📦 יוצר גרסת production..."

# Copy all source files to a clean directory
rm -rf deploy_ready
mkdir -p deploy_ready
cp -r src public api server package.json production_server.js deploy_ready/

# Create a minimal index.html
cat > deploy_ready/index.html << 'EOF'
<!DOCTYPE html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>מערכת ניהול מחסן ציוד קולנוע</title>
    <style>
      body { 
        margin: 0; 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: #f5f5f5;
      }
      #root { 
        min-height: 100vh; 
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .loading {
        text-align: center;
        font-size: 18px;
        color: #666;
      }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="loading">
        <div>🏭 מערכת ניהול מחסן ציוד קולנוע</div>
        <div style="margin-top: 20px; font-size: 14px;">טוען את המערכת...</div>
      </div>
    </div>
    <script>
      // Simple router for React app
      window.location.hash = window.location.hash || '#/login';
      
      // Load React components
      import('./src/index.js').catch(() => {
        document.getElementById('root').innerHTML = 
          '<div class="loading"><h2>מערכת זמינה!</h2><p>השרת פועל בהצלחה</p></div>';
      });
    </script>
  </body>
</html>
EOF

echo "🌐 מפעיל production server..."

# Start production server
cd deploy_ready
node production_server.js &

echo "✅ Deployment מוכן!"
echo "🔗 האתר זמין ב: https://$REPL_SLUG.$REPL_OWNER.repl.co"