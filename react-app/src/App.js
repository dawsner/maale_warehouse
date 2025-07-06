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
import TopNavigationResponsive from './components/TopNavigationResponsive';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Inventory from './pages/Inventory';
import InventoryEnhanced from './pages/InventoryEnhanced';
import Loans from './pages/Loans';
import Statistics from './pages/Statistics';
import ExcelImport from './pages/ExcelImport';
import Settings from './pages/Settings';
import Reservations from './pages/Reservations';
import Dashboard from './pages/Dashboard';
import AvailableItems from './pages/student/AvailableItems';
import BookEquipment from './pages/student/BookEquipment';
import MyEquipment from './pages/student/MyEquipment';
import CreateReservation from './pages/student/CreateReservation';
import MyReservations from './pages/student/MyReservations';
import VintageOrderWizard from './pages/student/VintageOrderWizard';
import Profile from './pages/student/Profile';
import AdvancedReports from './pages/admin/AdvancedReports';
import UserManagement from './pages/admin/UserManagement';
import TemplateManagement from './pages/admin/TemplateManagement';
import NotFound from './pages/NotFound';

// Maintenance Pages
import MaintenanceDashboard from './components/maintenance/MaintenanceDashboard';
import ItemMaintenance from './components/maintenance/ItemMaintenance';
import SchedulesPage from './components/maintenance/SchedulesPage';

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
      console.log('Token found in localStorage, trying to authenticate...');
      // בדיקת תקפות הטוקן
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        // אם הטוקן פג תוקף
        if (decoded.exp <= currentTime) {
          console.log('Token expired, redirecting to login');
          localStorage.removeItem('token');
          setLoading(false);
          return;
        }
        
        // אם הטוקן תקף, ננסה לקבל פרטי משתמש
        authAPI.getCurrentUser()
          .then(userData => {
            console.log('Current user data received:', userData);
            setUser(userData);
            setLoading(false);
          })
          .catch((err) => {
            console.error('Error getting current user:', err);
            localStorage.removeItem('token');
            setLoading(false);
          });
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('token');
        setLoading(false);
      }
    } else {
      console.log('No token found, user not logged in');
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData) => {
    console.log('Login successful, user data:', userData);
    setUser(userData);
    // כל המשתמשים מנותבים לדשבורד אחרי התחברות
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  // סוגי דפים שדורשים הרשאות מנהל או מחסנאי
  const AdminRoute = ({ children }) => {
    if (loading) return <CircularProgress />;
    if (!user) return <Navigate to="/login" />;
    if (user.role !== 'admin' && user.role !== 'warehouse_staff') return <Navigate to="/available-items" />;
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
        <TopNavigationResponsive user={user} onLogout={handleLogout} />
        <Container 
          maxWidth={false} 
          sx={{ 
            mt: { xs: 1, sm: 2, md: 3 }, 
            mb: 4, 
            px: { xs: 1, sm: 2, md: 3, lg: 4 }, 
            maxWidth: '98%', 
            mx: 'auto',
            minHeight: 'calc(100vh - 64px)' // גובה מלא פחות הנוויגציה
          }}
        >
          <Routes>
            {/* דפים פתוחים לכל */}
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register onLogin={handleLogin} />} />
            
            {/* דשבורד לכל המשתמשים */}
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            
            {/* דפים למנהלים בלבד */}
            <Route path="/inventory" element={
              <AdminRoute><InventoryEnhanced /></AdminRoute>
            } />
            <Route path="/inventory-legacy" element={
              <AdminRoute><Inventory /></AdminRoute>
            } />
            <Route path="/loans" element={
              <AdminRoute><Loans /></AdminRoute>
            } />
            <Route path="/reservations" element={
              <AdminRoute><Reservations /></AdminRoute>
            } />
            <Route path="/statistics" element={
              <AdminRoute><Statistics /></AdminRoute>
            } />
            <Route path="/import-excel" element={
              <AdminRoute><ExcelImport /></AdminRoute>
            } />
            <Route path="/settings" element={
              <AdminRoute><Settings /></AdminRoute>
            } />
            <Route path="/advanced-reports" element={
              <AdminRoute><AdvancedReports /></AdminRoute>
            } />
            <Route path="/user-management" element={
              <AdminRoute><UserManagement /></AdminRoute>
            } />
            <Route path="/template-management" element={
              <AdminRoute><TemplateManagement /></AdminRoute>
            } />
            
            {/* דפי ניהול תחזוקה */}
            <Route path="/maintenance" element={
              <AdminRoute><MaintenanceDashboard /></AdminRoute>
            } />
            <Route path="/maintenance/item/:itemId" element={
              <AdminRoute><ItemMaintenance /></AdminRoute>
            } />
            <Route path="/maintenance/schedules" element={
              <AdminRoute><SchedulesPage /></AdminRoute>
            } />
            
            {/* דפים לסטודנטים */}
            <Route path="/available-items" element={
              <ProtectedRoute><AvailableItems /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
            <Route path="/book-equipment" element={
              <ProtectedRoute><BookEquipment userId={user?.id} /></ProtectedRoute>
            } />
            <Route path="/my-equipment" element={
              <ProtectedRoute><MyEquipment userId={user?.id} /></ProtectedRoute>
            } />
            <Route path="/create-reservation" element={
              <ProtectedRoute><CreateReservation userId={user?.id} /></ProtectedRoute>
            } />
            <Route path="/my-reservations" element={
              <ProtectedRoute><MyReservations userId={user?.id} /></ProtectedRoute>
            } />
            <Route path="/vintage-order-wizard" element={
              <ProtectedRoute><VintageOrderWizard userId={user?.id} /></ProtectedRoute>
            } />
            
            {/* דף ברירת מחדל */}
            <Route path="/" element={
              user ? (
                (user.role === 'admin' || user.role === 'warehouse_staff') ? 
                <Navigate to="/dashboard" /> : 
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