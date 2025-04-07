import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { theme, rtlPlugins } from './theme';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

// Components
import TopNavigation from './components/TopNavigation';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Inventory from './pages/Inventory';
import Loans from './pages/Loans';
import Statistics from './pages/Statistics';
import AvailableItems from './pages/student/AvailableItems';
import BookEquipment from './pages/student/BookEquipment';
import MyEquipment from './pages/student/MyEquipment';
import NotFound from './pages/NotFound';

// Services
import { authAPI } from './api/api';

// עיטוף עם הגדרות RTL (מימין לשמאל)
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: rtlPlugins,
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // בדיקת משתמש מחובר בעת טעינת האפליקציה
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getCurrentUser()
        .then(userData => {
          setUser(userData);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData.role === 'admin') {
      navigate('/inventory');
    } else {
      navigate('/available-items');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  // סוגי דפים שדורשים הרשאות מנהל
  const AdminRoute = ({ children }) => {
    if (loading) return <CircularProgress />;
    if (!user) return <Navigate to="/login" />;
    if (user.role !== 'admin') return <Navigate to="/available-items" />;
    return children;
  };

  // סוגי דפים שדורשים התחברות בלבד
  const ProtectedRoute = ({ children }) => {
    if (loading) return <CircularProgress />;
    if (!user) return <Navigate to="/login" />;
    return children;
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        bgcolor="#FAFBFF"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <TopNavigation user={user} onLogout={handleLogout} />
        <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
          <Routes>
            {/* דפים פתוחים לכל */}
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register onLogin={handleLogin} />} />
            
            {/* דפים למנהלים בלבד */}
            <Route path="/inventory" element={
              <AdminRoute><Inventory /></AdminRoute>
            } />
            <Route path="/loans" element={
              <AdminRoute><Loans /></AdminRoute>
            } />
            <Route path="/statistics" element={
              <AdminRoute><Statistics /></AdminRoute>
            } />
            
            {/* דפים לסטודנטים */}
            <Route path="/available-items" element={
              <ProtectedRoute><AvailableItems /></ProtectedRoute>
            } />
            <Route path="/book-equipment" element={
              <ProtectedRoute><BookEquipment userId={user?.id} /></ProtectedRoute>
            } />
            <Route path="/my-equipment" element={
              <ProtectedRoute><MyEquipment userId={user?.id} /></ProtectedRoute>
            } />
            
            {/* דף ברירת מחדל */}
            <Route path="/" element={
              user ? (
                user.role === 'admin' ? 
                <Navigate to="/inventory" /> : 
                <Navigate to="/available-items" />
              ) : (
                <Navigate to="/login" />
              )
            } />
            
            {/* דף שגיאה 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Container>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App;