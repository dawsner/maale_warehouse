import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar, IconButton, Menu, MenuItem } from '@mui/material';
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

function TopNavigation({ user, onLogout }) {
  const navigate = useNavigate();
  const [userMenuAnchorEl, setUserMenuAnchorEl] = React.useState(null);
  const [adminMenuAnchorEl, setAdminMenuAnchorEl] = React.useState(null);
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

  return (
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
  );
}

export default TopNavigation;