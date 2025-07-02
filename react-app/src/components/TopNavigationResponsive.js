import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Avatar, 
  IconButton, 
  Menu, 
  MenuItem, 
  Badge, 
  Dialog, 
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  Collapse
} from '@mui/material';
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
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PersonIcon from '@mui/icons-material/Person';
import MenuIcon from '@mui/icons-material/Menu';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExtensionIcon from '@mui/icons-material/Extension';

import AlertsCenter from './AlertsCenter';
import { alertsAPI } from '../api/api';

function TopNavigationResponsive({ user, onLogout }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  const [adminMenuAnchorEl, setAdminMenuAnchorEl] = useState(null);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminSubmenuOpen, setAdminSubmenuOpen] = useState(false);
  
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

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const handleAdminSubmenuToggle = () => {
    setAdminSubmenuOpen(!adminSubmenuOpen);
  };

  // קבלת מספר ההתראות
  const fetchAlertCount = async () => {
    try {
      const alerts = await alertsAPI.getAlerts();
      if (Array.isArray(alerts)) {
        setAlertCount(alerts.length);
      } else {
        setAlertCount(0);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setAlertCount(0);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAlertCount();
      const interval = setInterval(fetchAlertCount, 60000); // רענון כל דקה
      return () => clearInterval(interval);
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

  const navigateAndClose = (path) => {
    navigate(path);
    handleMobileMenuClose();
  };

  // רשימת פריטי תפריט למנהל מחסן
  const adminMenuItems = [
    { text: 'דשבורד', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'ניהול מלאי', icon: <GridViewIcon />, path: '/inventory' },
    { text: 'השאלות', icon: <AssignmentIcon />, path: '/loans' },
    { text: 'הזמנות', icon: <EventNoteIcon />, path: '/reservations' },
    { text: 'סטטיסטיקות', icon: <BarChartIcon />, path: '/statistics' },
    { text: 'ייבוא/ייצוא', icon: <UploadFileIcon />, path: '/import-excel' },
    { text: 'ניהול תחזוקה', icon: <BuildIcon />, path: '/maintenance' }
  ];

  // רשימת פריטי תפריט לסטודנטים
  const studentMenuItems = [
    { text: 'ציוד זמין', icon: <InventoryIcon />, path: '/available-items' },
    { text: 'ההשאלות שלי', icon: <AssignmentIcon />, path: '/my-loans' },
    { text: 'ההזמנות שלי', icon: <CalendarTodayIcon />, path: '/my-reservations' }
  ];

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: 'white', color: '#1E2875', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 1000 }}>
        <Toolbar>
          <Box display="flex" alignItems="center" justifyContent="flex-start" sx={{ flexGrow: 1 }}>
            <img 
              src="/logo.png" 
              alt="לוגו מערכת" 
              style={{ height: isMobile ? '30px' : '40px', marginLeft: '12px' }} 
            />
            {!isMobile && (
              <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 1, fontWeight: 'bold' }}>
                מערכת ניהול ציוד קולנוע
              </Typography>
            )}
          </Box>

          {user ? (
            <>
              {/* Desktop Navigation */}
              {!isMobile && (
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
                      <Button
                        color="inherit"
                        onClick={() => navigate('/maintenance')}
                        startIcon={<BuildIcon />}
                      >
                        ניהול תחזוקה
                      </Button>
                      
                      <Button 
                        color="inherit" 
                        onClick={() => navigate('/vintage-order-wizard')}
                        startIcon={<AddCircleIcon />}
                        sx={{ 
                          background: 'linear-gradient(45deg, #1E2875 30%, #373B5C 90%)',
                          color: 'white',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #141a4d 30%, #282b45 90%)',
                          },
                          fontWeight: 'bold',
                          mr: 1
                        }}
                      >
                        אשף ההזמנות
                      </Button>
                      
                      {/* כפתור התראות */}
                      <IconButton
                        onClick={handleOpenAlerts}
                        size="medium"
                        sx={{ ml: 1 }}
                      >
                        <Badge badgeContent={alertCount} color="error">
                          <NotificationsIcon />
                        </Badge>
                      </IconButton>

                      {/* כפתור להזמנות ממתינות וניהול מנהלים */}
                      <IconButton
                        onClick={handleAdminMenuOpen}
                        size="medium"
                        sx={{ ml: 1 }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                      <Menu
                        anchorEl={adminMenuAnchorEl}
                        open={adminMenuOpen}
                        onClose={handleAdminMenuClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                      >
                        <MenuItem onClick={() => { navigate('/pending-reservations'); handleAdminMenuClose(); }}>
                          <EventNoteIcon fontSize="small" sx={{ mr: 1 }} />
                          הזמנות ממתינות
                        </MenuItem>
                        <MenuItem onClick={() => { navigate('/user-management'); handleAdminMenuClose(); }}>
                          <PeopleIcon fontSize="small" sx={{ mr: 1 }} />
                          ניהול משתמשים
                        </MenuItem>
                        <MenuItem onClick={() => { navigate('/advanced-analytics'); handleAdminMenuClose(); }}>
                          <AssessmentIcon fontSize="small" sx={{ mr: 1 }} />
                          ניתוח מתקדם
                        </MenuItem>
                        <MenuItem onClick={() => { navigate('/settings'); handleAdminMenuClose(); }}>
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
                        ציוד זמין
                      </Button>
                      <Button 
                        color="inherit" 
                        onClick={() => navigate('/my-loans')}
                        startIcon={<AssignmentIcon />}
                      >
                        ההשאלות שלי
                      </Button>
                      <Button 
                        color="inherit" 
                        onClick={() => navigate('/my-reservations')}
                        startIcon={<CalendarTodayIcon />}
                      >
                        ההזמנות שלי
                      </Button>
                      
                      <Button 
                        color="inherit" 
                        onClick={() => navigate('/vintage-order-wizard')}
                        startIcon={<AddCircleIcon />}
                        sx={{ 
                          background: 'linear-gradient(45deg, #1E2875 30%, #373B5C 90%)',
                          color: 'white',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #141a4d 30%, #282b45 90%)',
                          },
                          fontWeight: 'bold',
                          mr: 1
                        }}
                      >
                        אשף ההזמנות
                      </Button>
                    </>
                  )}
                  
                  {/* תפריט משתמש */}
                  <IconButton
                    onClick={handleUserMenuOpen}
                    size="medium"
                    sx={{ ml: 1 }}
                  >
                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#1E2875' }}>
                      {user.full_name ? user.full_name.charAt(0) : <PersonIcon />}
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={userMenuAnchorEl}
                    open={userMenuOpen}
                    onClose={handleUserMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  >
                    <MenuItem onClick={handleUserMenuClose}>
                      <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} />
                      {user.full_name}
                    </MenuItem>
                    <MenuItem onClick={onLogout}>
                      <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                      התנתק
                    </MenuItem>
                  </Menu>
                </Box>
              )}

              {/* Mobile Navigation */}
              {isMobile && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {/* כפתור התראות למובייל */}
                  {(user.role === 'admin' || user.role === 'warehouse_staff') && (
                    <IconButton
                      onClick={handleOpenAlerts}
                      size="medium"
                      sx={{ ml: 1 }}
                    >
                      <Badge badgeContent={alertCount} color="error">
                        <NotificationsIcon />
                      </Badge>
                    </IconButton>
                  )}
                  
                  {/* כפתור המבורגר */}
                  <IconButton
                    onClick={handleMobileMenuToggle}
                    size="large"
                    sx={{ ml: 1 }}
                  >
                    <MenuIcon />
                  </IconButton>
                </Box>
              )}
            </>
          ) : (
            <Button color="inherit" onClick={() => navigate('/login')}>
              התחברות
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer Menu */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleMobileMenuClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            paddingTop: 2
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1E2875' }}>
            {user?.full_name}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {user?.role === 'student' ? 'סטודנט' : 'צוות מחסן'}
          </Typography>
        </Box>
        
        <Divider />
        
        <List>
          {/* תפריט עבור מנהל מחסן */}
          {(user?.role === 'admin' || user?.role === 'warehouse_staff') && (
            <>
              {adminMenuItems.map((item) => (
                <ListItem button key={item.text} onClick={() => navigateAndClose(item.path)}>
                  <ListItemIcon sx={{ color: '#1E2875' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
              
              <ListItem button onClick={() => navigateAndClose('/vintage-order-wizard')}>
                <ListItemIcon sx={{ color: '#1E2875' }}>
                  <AddCircleIcon />
                </ListItemIcon>
                <ListItemText primary="אשף ההזמנות" />
              </ListItem>
              
              <Divider sx={{ my: 1 }} />
              
              {/* תפריט מתקדם למנהלים */}
              <ListItem button onClick={handleAdminSubmenuToggle}>
                <ListItemIcon sx={{ color: '#1E2875' }}>
                  <MoreVertIcon />
                </ListItemIcon>
                <ListItemText primary="ניהול מתקדם" />
                {adminSubmenuOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItem>
              
              <Collapse in={adminSubmenuOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItem button sx={{ pl: 4 }} onClick={() => navigateAndClose('/pending-reservations')}>
                    <ListItemIcon sx={{ color: '#1E2875' }}>
                      <EventNoteIcon />
                    </ListItemIcon>
                    <ListItemText primary="הזמנות ממתינות" />
                  </ListItem>
                  <ListItem button sx={{ pl: 4 }} onClick={() => navigateAndClose('/user-management')}>
                    <ListItemIcon sx={{ color: '#1E2875' }}>
                      <PeopleIcon />
                    </ListItemIcon>
                    <ListItemText primary="ניהול משתמשים" />
                  </ListItem>
                  <ListItem button sx={{ pl: 4 }} onClick={() => navigateAndClose('/template-management')}>
                    <ListItemIcon sx={{ color: '#1E2875' }}>
                      <ExtensionIcon />
                    </ListItemIcon>
                    <ListItemText primary="ניהול מערכי הזמנות" />
                  </ListItem>
                  <ListItem button sx={{ pl: 4 }} onClick={() => navigateAndClose('/advanced-analytics')}>
                    <ListItemIcon sx={{ color: '#1E2875' }}>
                      <AssessmentIcon />
                    </ListItemIcon>
                    <ListItemText primary="ניתוח מתקדם" />
                  </ListItem>
                  <ListItem button sx={{ pl: 4 }} onClick={() => navigateAndClose('/settings')}>
                    <ListItemIcon sx={{ color: '#1E2875' }}>
                      <SettingsIcon />
                    </ListItemIcon>
                    <ListItemText primary="הגדרות מערכת" />
                  </ListItem>
                </List>
              </Collapse>
            </>
          )}
          
          {/* תפריט עבור סטודנטים */}
          {user?.role === 'student' && (
            <>
              {studentMenuItems.map((item) => (
                <ListItem button key={item.text} onClick={() => navigateAndClose(item.path)}>
                  <ListItemIcon sx={{ color: '#1E2875' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
              
              <ListItem button onClick={() => navigateAndClose('/vintage-order-wizard')}>
                <ListItemIcon sx={{ color: '#1E2875' }}>
                  <AddCircleIcon />
                </ListItemIcon>
                <ListItemText primary="אשף ההזמנות" />
              </ListItem>
            </>
          )}
          
          <Divider sx={{ my: 1 }} />
          
          {/* התנתקות */}
          <ListItem button onClick={onLogout}>
            <ListItemIcon sx={{ color: '#d32f2f' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="התנתק" sx={{ color: '#d32f2f' }} />
          </ListItem>
        </List>
      </Drawer>

      {/* דיאלוג התראות */}
      <Dialog
        open={alertsOpen}
        onClose={handleCloseAlerts}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <AlertsCenter onClose={handleCloseAlerts} />
      </Dialog>
    </>
  );
}

export default TopNavigationResponsive;