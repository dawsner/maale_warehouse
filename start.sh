#!/bin/bash

# Production start script for cinema equipment management system
echo "Starting Cinema Equipment Management System..."

# Check if build directory exists, if not create minimal build
if [ ! -d "react-app/build" ]; then
    echo "Build directory not found. Creating minimal build structure..."
    mkdir -p react-app/build/static/js
    mkdir -p react-app/build/static/css
    
    # Create minimal index.html that redirects to dev server
    cat > react-app/build/index.html << 'EOF'
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>מערכת ניהול מחסן השאלות</title>
    <script>
        // Redirect to development server in production
        if (window.location.port === '5000') {
            window.location.href = 'http://' + window.location.hostname + ':5000';
        }
    </script>
</head>
<body>
    <div id="root">Loading Cinema Equipment Management System...</div>
    <script>
        setTimeout(function() {
            window.location.reload();
        }, 3000);
    </script>
</body>
</html>
EOF
fi

# Start the application
cd react-app
echo "Starting production server..."
npm run dev