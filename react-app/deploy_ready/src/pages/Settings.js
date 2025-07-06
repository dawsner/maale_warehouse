import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Divider, 
  Switch,
  FormControlLabel,
  Button,
  TextField,
  Grid,
  Alert,
  IconButton,
  InputAdornment,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SecurityIcon from '@mui/icons-material/Security';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import LanguageIcon from '@mui/icons-material/Language';
import StorageIcon from '@mui/icons-material/Storage';
import BackupIcon from '@mui/icons-material/Backup';
import RestoreIcon from '@mui/icons-material/Restore';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

// כרגע זהו דף הגדרות פשוט
// בעתיד יתווספו כאן אפשרויות נוספות כמו גיבוי, שחזור, שינוי שפה, וכו'

function Settings() {
  const [settings, setSettings] = useState({
    showEnhancedInventory: true,
    enableAutoSave: true,
    defaultRowsPerPage: 50,
    backupFrequency: 'daily',
    logsEnabled: true,
    useExtendedCategories: false,
    databaseBackupLocation: '/backups',
    rtlEnabled: true
  });
  
  const [savedMessage, setSavedMessage] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSaveSettings = () => {
    // בעתיד כאן יתבצע שמירה של ההגדרות לשרת
    setSavedMessage('ההגדרות נשמרו בהצלחה');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleBackup = () => {
    setBackupDialogOpen(false);
    setSavedMessage('בוצע גיבוי של בסיס הנתונים');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: '1px solid #CECECE' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1E2875' }}>
            הגדרות מערכת
          </Typography>
          <Typography variant="body1" color="text.secondary">
            שליטה בהגדרות והעדפות של מערכת ניהול הציוד
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {savedMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {savedMessage}
          </Alert>
        )}

        <Grid container spacing={4}>
          <Grid item xs={12} md={3}>
            <Card 
              variant="outlined" 
              sx={{ 
                position: 'sticky', 
                top: '20px',
                borderColor: '#CECECE',
                bgcolor: '#FAFBFF'
              }}
            >
              <CardHeader 
                title="קטגוריות" 
                sx={{ 
                  bgcolor: '#F3F5FF',
                  borderBottom: '1px solid #CECECE'
                }}
              />
              <List component="nav">
                <ListItem button selected>
                  <ListItemIcon>
                    <ViewModuleIcon />
                  </ListItemIcon>
                  <ListItemText primary="ממשק משתמש" />
                </ListItem>
                <ListItem button>
                  <ListItemIcon>
                    <SecurityIcon />
                  </ListItemIcon>
                  <ListItemText primary="אבטחה" />
                </ListItem>
                <ListItem button>
                  <ListItemIcon>
                    <LanguageIcon />
                  </ListItemIcon>
                  <ListItemText primary="שפה" />
                </ListItem>
                <ListItem button>
                  <ListItemIcon>
                    <StorageIcon />
                  </ListItemIcon>
                  <ListItemText primary="בסיס נתונים" />
                </ListItem>
                <ListItem button>
                  <ListItemIcon>
                    <FormatListBulletedIcon />
                  </ListItemIcon>
                  <ListItemText primary="רשימות" />
                </ListItem>
                <ListItem button>
                  <ListItemIcon>
                    <LibraryBooksIcon />
                  </ListItemIcon>
                  <ListItemText primary="לוגים" />
                </ListItem>
              </List>
            </Card>
          </Grid>

          <Grid item xs={12} md={9}>
            <Card variant="outlined" sx={{ mb: 4, borderColor: '#CECECE' }}>
              <CardHeader 
                title="ממשק משתמש" 
                sx={{ bgcolor: '#F3F5FF', borderBottom: '1px solid #CECECE' }}
              />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.showEnhancedInventory}
                          onChange={(e) => handleSettingChange('showEnhancedInventory', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="השתמש בממשק מלאי משופר כברירת מחדל"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.enableAutoSave}
                          onChange={(e) => handleSettingChange('enableAutoSave', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="הפעל שמירה אוטומטית"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.rtlEnabled}
                          onChange={(e) => handleSettingChange('rtlEnabled', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="תצוגה מימין לשמאל (RTL)"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="מספר שורות לעמוד"
                      type="number"
                      value={settings.defaultRowsPerPage}
                      onChange={(e) => handleSettingChange('defaultRowsPerPage', parseInt(e.target.value))}
                      variant="outlined"
                      InputProps={{
                        inputProps: { min: 10, max: 100 }
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ mb: 4, borderColor: '#CECECE' }}>
              <CardHeader 
                title="נתונים וגיבוי" 
                sx={{ bgcolor: '#F3F5FF', borderBottom: '1px solid #CECECE' }}
              />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.useExtendedCategories}
                          onChange={(e) => handleSettingChange('useExtendedCategories', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="השתמש בקטגוריות מורחבות"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.logsEnabled}
                          onChange={(e) => handleSettingChange('logsEnabled', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="הפעל רישום לוגים של פעולות"
                    />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      label="נתיב גיבוי בסיס נתונים"
                      value={settings.databaseBackupLocation}
                      onChange={(e) => handleSettingChange('databaseBackupLocation', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        startIcon={<BackupIcon />}
                        onClick={() => setBackupDialogOpen(true)}
                      >
                        גיבוי בסיס נתונים
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="secondary" 
                        startIcon={<RestoreIcon />}
                      >
                        שחזור מגיבוי
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<SaveIcon />}
                onClick={handleSaveSettings}
              >
                שמור הגדרות
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Dialog open={backupDialogOpen} onClose={() => setBackupDialogOpen(false)}>
        <DialogTitle>גיבוי בסיס נתונים</DialogTitle>
        <DialogContent dividers>
          <Typography>
            האם לבצע גיבוי של בסיס הנתונים כעת?
            הגיבוי יישמר בנתיב: {settings.databaseBackupLocation}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialogOpen(false)}>ביטול</Button>
          <Button variant="contained" color="primary" onClick={handleBackup}>
            בצע גיבוי
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Settings;