import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar, IconButton, Menu, MenuItem, Badge, Dialog } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import GridViewIcon from '@mui/icons-material/GridView';
import SettingsIcon from '@mui/icons-material/Settings';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DashboardIcon from '@mui/icons-material/Dashboard';
import NotificationsIcon from '@mui/icons-material/Notifications';
import BuildIcon from '@mui/icons-material/Build';

import AlertsCenter from './AlertsCenter';
import { alertsAPI } from '../api/api';

function TopNavigation({ user, onLogout }) {
  const navigate = useNavigate();
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  const [adminMenuAnchorEl, setAdminMenuAnchorEl] = useState(null);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const userMenuOpen = Boolean(userMenuAnchorEl);
  const adminMenuOpen = Boolean(adminMenuAnchorEl);

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleAdminMenuOpen = (event) => {
    setAdminMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  const handleAdminMenuClose = () => {
    setAdminMenuAnchorEl(null);
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleUserMenuClose();
    handleAdminMenuClose();
  };
  
  // פונקציה לטעינת מספר ההתראות
  const fetchAlertCount = async () => {
    try {
      // קריאה ל-API רק אם המשתמש מחובר והוא מנהל מחסן
      if (user && (user.role === 'admin' || user.role === 'warehouse_staff')) {
        const alertsData = await alertsAPI.getAlerts(3, 20); // ערכי ברירת מחדל לימים ואחוזי מלאי
        if (alertsData && alertsData.summary) {
          // סכום כל ההתראות
          setAlertCount(alertsData.summary.total_alerts || 0);
        }
      }
    } catch (error) {
      console.error('שגיאה בטעינת התראות:', error);
    }
  };

  // טעינת התראות בטעינה ראשונית
  useEffect(() => {
    if (user) {
      fetchAlertCount();
    }
  }, [user]);

  // פתיחת מרכז ההתראות
  const handleOpenAlerts = () => {
    setAlertsOpen(true);
  };

  // סגירת מרכז ההתראות
  const handleCloseAlerts = () => {
    setAlertsOpen(false);
    // טעינה מחדש של מספר ההתראות אחרי סגירה
    fetchAlertCount();
  };

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: 'white', color: '#1E2875', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 1000 }}>
        <Toolbar>
          <Box display="flex" alignItems="center" justifyContent="flex-start" sx={{ flexGrow: 1 }}>
            <img 
              src="/logo.png" 
              alt="לוגו מערכת" 
              style={{ height: '40px', marginLeft: '12px' }} 
            />
            <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 1, fontWeight: 'bold' }}>
              מערכת ניהול ציוד קולנוע
            </Typography>
          </Box>

          {user ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {(user.role === 'admin' || user.role === 'warehouse_staff') && (
                  <>
                    <Button 
                      color="inherit" 
                      onClick={() => navigate('/dashboard')}
                      startIcon={<DashboardIcon />}
                    >
                      דשבורד
                    </Button>
                    <Button 
                      color="inherit" 
                      onClick={() => navigate('/inventory')}
                      startIcon={<GridViewIcon />}
                    >
                      ניהול מלאי
                    </Button>
                    <Button 
                      color="inherit" 
                      onClick={() => navigate('/loans')}
                      startIcon={<AssignmentIcon />}
                    >
                      השאלות
                    </Button>
                    <Button 
                      color="inherit" 
                      onClick={() => navigate('/reservations')}
                      startIcon={<EventNoteIcon />}
                    >
                      הזמנות
                    </Button>
                    <Button 
                      color="inherit" 
                      onClick={() => navigate('/statistics')}
                      startIcon={<BarChartIcon />}
                    >
                      סטטיסטיקות
                    </Button>
                    <Button
                      color="inherit"
                      onClick={() => navigate('/import-excel')}
                      startIcon={<UploadFileIcon />}
                    >
                      ייבוא/ייצוא
                    </Button>
                    
                    {/* כפתור התראות */}
                    <IconButton
                      onClick={handleOpenAlerts}
                      size="medium"
                      sx={{ ml: 1 }}
                      color={alertCount > 0 ? "primary" : "default"}
                    >
                      <Badge badgeContent={alertCount} color="error" overlap="circular">
                        <NotificationsIcon />
                      </Badge>
                    </IconButton>
                    
                    <IconButton
                      onClick={handleAdminMenuOpen}
                      size="small"
                      aria-controls={adminMenuOpen ? 'admin-menu' : undefined}
                      aria-haspopup="true"
                      aria-expanded={adminMenuOpen ? 'true' : undefined}
                    >
                      <MoreVertIcon />
                    </IconButton>
                    <Menu
                      id="admin-menu"
                      anchorEl={adminMenuAnchorEl}
                      open={adminMenuOpen}
                      onClose={handleAdminMenuClose}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                      }}
                    >
                      <MenuItem onClick={() => handleNavigation('/maintenance')}>
                        <BuildIcon fontSize="small" sx={{ mr: 1 }} />
                        ניהול תחזוקה
                      </MenuItem>
                      <MenuItem onClick={() => handleNavigation('/inventory-legacy')}>
                        <InventoryIcon fontSize="small" sx={{ mr: 1 }} />
                        מלאי (גרסה ישנה)
                      </MenuItem>
                      <MenuItem onClick={() => handleNavigation('/settings')}>
                        <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
                        הגדרות מערכת
                      </MenuItem>
                    </Menu>
                  </>
                )}
                {user.role === 'student' && (
                  <>
                    <Button 
                      color="inherit" 
                      onClick={() => navigate('/available-items')}
                      startIcon={<InventoryIcon />}
                    >
                      פריטים זמינים
                    </Button>
                    <Button 
                      color="inherit" 
                      onClick={() => navigate('/book-equipment')}
                      startIcon={<AssignmentIcon />}
                    >
                      הזמנת ציוד
                    </Button>
                    <Button 
                      color="inherit" 
                      onClick={() => navigate('/my-equipment')}
                      startIcon={<InventoryIcon />}
                    >
                      הציוד שלי
                    </Button>
                    <Button 
                      color="inherit" 
                      onClick={() => navigate('/create-reservation')}
                      startIcon={<EventNoteIcon />}
                    >
                      הזמנה חדשה
                    </Button>
                    <Button 
                      color="inherit" 
                      onClick={() => navigate('/my-reservations')}
                      startIcon={<CalendarTodayIcon />}
                    >
                      ההזמנות שלי
                    </Button>
                  </>
                )}
                
                <IconButton
                  onClick={handleUserMenuOpen}
                  size="small"
                  aria-controls={userMenuOpen ? 'account-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={userMenuOpen ? 'true' : undefined}
                  sx={{ ml: 1 }}
                >
                  <Avatar sx={{ bgcolor: '#1E2875', width: 32, height: 32 }}>
                    <AccountCircleIcon />
                  </Avatar>
                </IconButton>
                <Menu
                  id="account-menu"
                  anchorEl={userMenuAnchorEl}
                  open={userMenuOpen}
                  onClose={handleUserMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <MenuItem onClick={() => handleNavigation('/profile')}>
                    פרופיל
                  </MenuItem>
                  <MenuItem onClick={onLogout}>
                    <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                    התנתק
                  </MenuItem>
                </Menu>
              </Box>
            </>
          ) : (
            <Button color="inherit" onClick={() => navigate('/login')}>
              התחברות
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* דיאלוג מרכז ההתראות */}
      <Dialog 
        open={alertsOpen} 
        onClose={handleCloseAlerts}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: { 
            borderRadius: 2,
            overflow: 'hidden',
            minHeight: '60vh'
          }
        }}
      >
        <AlertsCenter user={user} onClose={handleCloseAlerts} />
      </Dialog>
    </>
  );
}

export default TopNavigation;