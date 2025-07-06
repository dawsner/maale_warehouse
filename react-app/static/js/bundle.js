// Basic bundle.js that redirects to the development server
console.log('Cinema Equipment Management System Loading...');

// Check if we're in production or development
if (window.location.hostname.includes('repl.co') || window.location.hostname.includes('replit.dev')) {
  // Production deployment - redirect to proper React app
  console.log('Production mode detected, loading full application...');
  window.location.replace(window.location.origin + '/dashboard');
} else {
  // Development mode
  console.log('Development mode detected');
  // Load the actual React application
  const script = document.createElement('script');
  script.src = 'http://localhost:3000/static/js/bundle.js';
  script.onerror = function() {
    // Fallback if React dev server is not running
    document.getElementById('root').innerHTML = '<div style="padding: 20px; font-family: Arial;">מערכת ניהול ציוד קולנוע מתחילה...</div>';
  };
  document.head.appendChild(script);
}