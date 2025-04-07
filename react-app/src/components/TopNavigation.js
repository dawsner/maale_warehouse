import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Button, 
  Box,
  Avatar,
  Typography,
  Stack,
  useMediaQuery,
  IconButton,
  Menu,
  MenuItem,
  useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import logo from '../assets/logo.png';

// אייקונים
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MailIcon from '@mui/icons-material/Mail';
import HistoryIcon from '@mui/icons-material/History';
import BarChartIcon from '@mui/icons-material/BarChart';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import GridViewIcon from '@mui/icons-material/GridView';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LogoutIcon from '@mui/icons-material/Logout';

// מיפוי של נתיבים ואייקונים (כולל כותרות בעברית)
const navigationItems = {
  warehouse: [
    { path: '/inventory', label: 'מלאי', icon: <InventoryIcon fontSize="small" /> },
    { path: '/loans', label: 'השאלות', icon: <PeopleIcon fontSize="small" /> },
    { path: '/alerts', label: 'התראות', icon: <NotificationsIcon fontSize="small" /> },
    { path: '/equipment-tracking', label: 'מעקב ציוד', icon: <MailIcon fontSize="small" /> },
    { path: '/history', label: 'היסטוריה', icon: <HistoryIcon fontSize="small" /> },
    { path: '/statistics', label: 'סטטיסטיקות', icon: <BarChartIcon fontSize="small" /> },
    { path: '/import-export', label: 'ייבוא/ייצוא', icon: <UploadFileIcon fontSize="small" /> },
    { path: '/reservations', label: 'ניהול הזמנות', icon: <SettingsIcon fontSize="small" /> },
  ],
  student: [
    { path: '/my-equipment', label: 'הציוד שלי', icon: <PersonIcon fontSize="small" /> },
    { path: '/available-items', label: 'פריטים זמינים', icon: <GridViewIcon fontSize="small" /> },
    { path: '/book-equipment', label: 'הזמנת ציוד', icon: <ShoppingCartIcon fontSize="small" /> },
  ],
  anonymous: [
    { path: '/login', label: 'התחברות', icon: null },
    { path: '/register', label: 'הרשמה', icon: null },
  ]
};

function TopNavigation({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleMenuItemClick = (path) => {
    navigate(path);
    handleClose();
  };
  
  // מחזיר את רשימת הניווט בהתאם לתפקיד המשתמש
  const getNavItems = () => {
    if (!user) return navigationItems.anonymous;
    return user.role === 'warehouse' ? navigationItems.warehouse : navigationItems.student;
  };
  
  return (
    <AppBar position="static" color="default" elevation={0} sx={{ backgroundColor: 'white', borderBottom: '1px solid #CECECE' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* לוגו */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo} alt="Logo" style={{ height: '40px', marginLeft: '15px' }} />
        </Box>
        
        {/* תפריט ניווט */}
        {isMobile ? (
          // תפריט נייד
          <Box>
            <IconButton
              aria-controls={open ? 'basic-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              onClick={handleClick}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="basic-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{
                'aria-labelledby': 'basic-button',
              }}
            >
              {getNavItems().map((item) => (
                <MenuItem 
                  key={item.path} 
                  onClick={() => handleMenuItemClick(item.path)}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                    backgroundColor: location.pathname === item.path ? theme.palette.primary.light : 'inherit'
                  }}
                >
                  {item.icon && <Box sx={{ mr: 1 }}>{item.icon}</Box>}
                  <Typography>{item.label}</Typography>
                </MenuItem>
              ))}
              {user && (
                <MenuItem onClick={onLogout} sx={{ display: 'flex', alignItems: 'center' }}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                  <Typography>התנתק</Typography>
                </MenuItem>
              )}
            </Menu>
          </Box>
        ) : (
          // תפריט רגיל
          <Stack direction="row" spacing={1}>
            {getNavItems().map((item) => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? 'contained' : 'text'}
                color={location.pathname === item.path ? 'primary' : 'inherit'}
                onClick={() => navigate(item.path)}
                startIcon={item.icon}
                sx={{ 
                  borderRadius: '8px', 
                  padding: '6px 10px',
                  fontSize: '14px',
                  color: location.pathname === item.path ? 'white' : '#9197B3',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: location.pathname === item.path ? 
                      theme.palette.primary.main : 'rgba(0,0,0,0.03)'
                  }
                }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
        )}
        
        {/* פרטי משתמש */}
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', marginRight: 'auto' }}>
            <Box sx={{ 
              backgroundColor: '#F5F6FA', 
              padding: '6px 12px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              marginRight: '10px'
            }}>
              <Avatar sx={{ 
                width: 32, 
                height: 32, 
                backgroundColor: theme.palette.primary.main, 
                marginLeft: '8px', 
                fontWeight: 'bold' 
              }}>
                {user.fullName ? user.fullName[0] : 'U'}
              </Avatar>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="caption" sx={{ color: '#9197B3' }}>שלום,</Typography>
                <Typography variant="body2" sx={{ color: '#373B5C', fontWeight: 500 }}>
                  {user.fullName || user.username}
                </Typography>
              </Box>
            </Box>
            
            <Button
              color="inherit"
              onClick={onLogout}
              startIcon={<LogoutIcon />}
              sx={{ 
                color: '#9197B3',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.03)'
                }
              }}
            >
              התנתק
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default TopNavigation;
