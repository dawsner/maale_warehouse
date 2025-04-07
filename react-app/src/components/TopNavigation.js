import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar, IconButton, Menu, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

function TopNavigation({ user, onLogout }) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleClose();
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
                    startIcon={<InventoryIcon />}
                  >
                    מלאי
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
                onClick={handleMenu}
                size="small"
                aria-controls={open ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
              >
                <Avatar sx={{ bgcolor: '#1E2875', width: 32, height: 32 }}>
                  <AccountCircleIcon />
                </Avatar>
              </IconButton>
              <Menu
                id="account-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem onClick={() => navigate('/profile')}>
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