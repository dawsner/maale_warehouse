import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

// יבוא של רכיבים (Components)
import TopNavigation from './components/TopNavigation';
import Login from './pages/Login';
import Register from './pages/Register';
import Inventory from './pages/Inventory';
import Loans from './pages/Loans';
import Alerts from './pages/Alerts';
import EquipmentTracking from './pages/EquipmentTracking';
import History from './pages/History';
import Statistics from './pages/Statistics';
import ImportExport from './pages/ImportExport';
import Reservations from './pages/Reservations';
import MyEquipment from './pages/student/MyEquipment';
import AvailableItems from './pages/student/AvailableItems';
import BookEquipment from './pages/student/BookEquipment';

// יצירת ערכת עיצוב מותאמת
let theme = createTheme({
  direction: 'rtl',
  palette: {
    primary: {
      main: '#1E2875',
      light: '#E6E8F5',
    },
    secondary: {
      main: '#373B5C',
    },
    error: {
      main: '#FF4D4F',
    },
    warning: {
      main: '#FAAD14',
    },
    success: {
      main: '#52C41A',
    },
  },
  typography: {
    fontFamily: '"Open Sans", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 5,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          direction: 'rtl',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          direction: 'rtl',
        },
      },
    },
  },
});

// עושה את הטיפוגרפיה רספונסיבית
theme = responsiveFontSizes(theme);

// RTL לתמיכה בכיוון עברית
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// פונקציית רכיב ראשי של האפליקציה
function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // בדיקה אם המשתמש מחובר
  useEffect(() => {
    // כאן נבדוק במצב אמיתי אם המשתמש מחובר מהשרת או מזיכרון מקומי
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  // פונקציה להתחברות
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    navigate(userData.role === 'warehouse' ? '/inventory' : '/my-equipment');
  };

  // פונקציה להתנתקות
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <div className="app">
          <TopNavigation user={user} onLogout={handleLogout} />
          
          <main className="main-content">
            <Routes>
              {/* נתיבים לגישה ללא התחברות */}
              <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
              <Route path="/register" element={user ? <Navigate to="/" /> : <Register onLogin={handleLogin} />} />
              
              {/* נתיבים לצוות מחסן */}
              {user && user.role === 'warehouse' && (
                <>
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/loans" element={<Loans />} />
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/equipment-tracking" element={<EquipmentTracking />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/statistics" element={<Statistics />} />
                  <Route path="/import-export" element={<ImportExport />} />
                  <Route path="/reservations" element={<Reservations />} />
                </>
              )}
              
              {/* נתיבים לסטודנטים */}
              {user && user.role === 'student' && (
                <>
                  <Route path="/my-equipment" element={<MyEquipment userId={user.id} />} />
                  <Route path="/available-items" element={<AvailableItems />} />
                  <Route path="/book-equipment" element={<BookEquipment userId={user.id} />} />
                </>
              )}
              
              {/* נתיב ברירת מחדל */}
              <Route path="/" element={
                user 
                  ? user.role === 'warehouse' 
                    ? <Navigate to="/inventory" /> 
                    : <Navigate to="/my-equipment" />
                  : <Navigate to="/login" />
              } />
              
              {/* נתיב לכל דף אחר */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App;
