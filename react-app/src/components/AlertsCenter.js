import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Badge,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Divider,
  Chip,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';

// אייקונים
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import EmailIcon from '@mui/icons-material/Email';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InventoryIcon from '@mui/icons-material/Inventory';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';

import { alertsAPI } from '../api/api';

// קומפוננטה לתצוגת מרכז התראות
function AlertsCenter({ user, onClose }) {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState({
    overdue_loans: [],
    upcoming_returns: [],
    low_stock: [],
    summary: {
      total_alerts: 0,
      overdue_count: 0,
      upcoming_count: 0,
      low_stock_count: 0,
      high_severity_count: 0,
      last_updated: ''
    }
  });
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const [alertSettings, setAlertSettings] = useState({
    daysThreshold: 3,
    stockThreshold: 20
  });
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // טעינת ההתראות
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await alertsAPI.getAlerts(alertSettings.daysThreshold, alertSettings.stockThreshold);
      setAlerts(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'שגיאה בטעינת ההתראות');
    } finally {
      setLoading(false);
    }
  };

  // טעינה ראשונית
  useEffect(() => {
    fetchAlerts();
  }, [alertSettings.daysThreshold, alertSettings.stockThreshold]);

  // שינוי טאב פעיל
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // שליחת התראה במייל
  const handleSendEmail = async () => {
    if (!recipient || !selectedAlert) return;

    try {
      setSendingEmail(true);
      setEmailError(null);

      let alertType, data;
      if (selectedAlert.days_overdue !== undefined) {
        alertType = 'overdue';
        data = selectedAlert;
      } else if (selectedAlert.days_remaining !== undefined) {
        alertType = 'upcoming';
        data = selectedAlert;
      } else {
        alertType = 'low_stock';
        data = selectedAlert;
      }

      const response = await alertsAPI.sendEmailAlert(alertType, data, recipient);
      if (response && response.success) {
        setEmailSuccess(true);
      } else {
        throw new Error(response.message || 'שגיאה בשליחת האימייל');
      }
    } catch (err) {
      setEmailError(err.message || 'שגיאה בשליחת האימייל');
    } finally {
      setSendingEmail(false);
    }
  };

  // פתיחת דיאלוג שליחת מייל
  const handleOpenEmailDialog = (alert) => {
    setSelectedAlert(alert);
    setRecipient(alert.email || '');
    setEmailSuccess(false);
    setEmailError(null);
    setEmailDialogOpen(true);
  };

  // סגירת דיאלוג שליחת מייל
  const handleCloseEmailDialog = () => {
    setEmailDialogOpen(false);
  };

  // שמירת הגדרות התראות
  const handleSaveSettings = () => {
    // המטרה היא להשתמש בהגדרות החדשות של alertSettings כדי לטעון מחדש את ההתראות
    setSettingsDialogOpen(false);
    fetchAlerts();
  };

  // פונקציה שמחזירה אייקון לפי חומרת ההתראה
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <ErrorIcon color="error" />;
      case 'medium':
        return <WarningIcon color="warning" />;
      case 'low':
      default:
        return <InfoIcon color="info" />;
    }
  };

  // פונקציה שמחזירה צבע רקע לפי סוג ההתראה
  const getAlertBackground = (alertType, severity) => {
    if (alertType === 'overdue') {
      return severity === 'high' ? '#ffebee' : severity === 'medium' ? '#fff3e0' : '#fafafa';
    } else if (alertType === 'upcoming') {
      return severity === 'high' ? '#e3f2fd' : severity === 'medium' ? '#e8f5e9' : '#fafafa';
    } else { // low_stock
      return severity === 'high' ? '#fff3e0' : severity === 'medium' ? '#f9fbe7' : '#fafafa';
    }
  };

  // פונקציה שמחזירה כותרת להתראה
  const getAlertTitle = (alert) => {
    if (alert.days_overdue !== undefined) {
      return `איחור בהחזרת ${alert.item_name}`;
    } else if (alert.days_remaining !== undefined) {
      return `החזרה קרובה: ${alert.item_name}`;
    } else {
      return `מלאי נמוך: ${alert.name}`;
    }
  };

  // פאנל התראות על השאלות באיחור
  const OverdueLoansTab = () => (
    <Box sx={{ mt: 2 }}>
      {alerts.overdue_loans.length > 0 ? (
        <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
          {alerts.overdue_loans.map((loan, index) => (
            <React.Fragment key={`overdue-${loan.id}`}>
              <ListItem 
                alignItems="flex-start"
                sx={{ 
                  py: 2,
                  bgcolor: getAlertBackground('overdue', loan.severity),
                  borderRight: `4px solid ${loan.severity === 'high' ? '#f44336' : loan.severity === 'medium' ? '#ff9800' : '#2196f3'}`
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: loan.severity === 'high' ? '#ffcdd2' : loan.severity === 'medium' ? '#ffe0b2' : '#e3f2fd' }}>
                    {getSeverityIcon(loan.severity)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {getAlertTitle(loan)}
                      </Typography>
                      <Chip 
                        size="small" 
                        color={loan.severity === 'high' ? 'error' : loan.severity === 'medium' ? 'warning' : 'info'}
                        label={`${loan.days_overdue} ימי איחור`}
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary" component="span">
                          {loan.student_name} ({loan.student_id})
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <EventIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary" component="span">
                          תאריך החזרה: {new Date(loan.due_date).toLocaleDateString('he-IL')}
                        </Typography>
                      </Box>
                      {loan.loan_notes && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          הערות: {loan.loan_notes}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="שלח תזכורת במייל">
                    <IconButton edge="end" onClick={() => handleOpenEmailDialog(loan)}>
                      <EmailIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
              {index < alerts.overdue_loans.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Alert severity="success" sx={{ mt: 2 }}>
          אין השאלות באיחור - מצוין!
        </Alert>
      )}
    </Box>
  );

  // פאנל התראות על השאלות שמועד החזרתן קרב
  const UpcomingReturnsTab = () => (
    <Box sx={{ mt: 2 }}>
      {alerts.upcoming_returns.length > 0 ? (
        <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
          {alerts.upcoming_returns.map((loan, index) => (
            <React.Fragment key={`upcoming-${loan.id}`}>
              <ListItem 
                alignItems="flex-start"
                sx={{ 
                  py: 2,
                  bgcolor: getAlertBackground('upcoming', loan.severity),
                  borderRight: `4px solid ${loan.severity === 'high' ? '#2196f3' : loan.severity === 'medium' ? '#4caf50' : '#9e9e9e'}`
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: loan.severity === 'high' ? '#e3f2fd' : loan.severity === 'medium' ? '#e8f5e9' : '#f5f5f5' }}>
                    <AccessTimeIcon color={loan.severity === 'high' ? 'primary' : loan.severity === 'medium' ? 'success' : 'action'} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {getAlertTitle(loan)}
                      </Typography>
                      <Chip 
                        size="small" 
                        color={loan.severity === 'high' ? 'primary' : loan.severity === 'medium' ? 'success' : 'default'}
                        label={`${loan.days_remaining} ימים נותרו`}
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary" component="span">
                          {loan.student_name} ({loan.student_id})
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <EventIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary" component="span">
                          תאריך החזרה: {new Date(loan.due_date).toLocaleDateString('he-IL')}
                        </Typography>
                      </Box>
                      {loan.loan_notes && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          הערות: {loan.loan_notes}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="שלח תזכורת במייל">
                    <IconButton edge="end" onClick={() => handleOpenEmailDialog(loan)}>
                      <EmailIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
              {index < alerts.upcoming_returns.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Alert severity="info" sx={{ mt: 2 }}>
          אין השאלות שמועד החזרתן מתקרב בטווח של {alertSettings.daysThreshold} ימים.
        </Alert>
      )}
    </Box>
  );

  // פאנל התראות על מלאי נמוך
  const LowStockTab = () => (
    <Box sx={{ mt: 2 }}>
      {alerts.low_stock.length > 0 ? (
        <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
          {alerts.low_stock.map((item, index) => (
            <React.Fragment key={`stock-${item.id}`}>
              <ListItem 
                alignItems="flex-start"
                sx={{ 
                  py: 2,
                  bgcolor: getAlertBackground('low_stock', item.severity),
                  borderRight: `4px solid ${item.severity === 'high' ? '#ff9800' : item.severity === 'medium' ? '#ffc107' : '#9e9e9e'}`
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: item.severity === 'high' ? '#fff3e0' : item.severity === 'medium' ? '#fff8e1' : '#f5f5f5' }}>
                    <InventoryIcon color={item.severity === 'high' ? 'warning' : item.severity === 'medium' ? 'warning' : 'action'} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {item.name}
                      </Typography>
                      <Chip 
                        size="small" 
                        color={item.severity === 'high' ? 'warning' : item.severity === 'medium' ? 'warning' : 'default'}
                        variant={item.severity === 'high' ? 'filled' : 'outlined'}
                        label={`${item.stock_percent}% במלאי`}
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" component="span">
                          קטגוריה: {item.category}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" component="span">
                          כמות זמינה: {item.available_quantity} מתוך {item.quantity}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="שלח התראה במייל">
                    <IconButton edge="end" onClick={() => handleOpenEmailDialog(item)}>
                      <EmailIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
              {index < alerts.low_stock.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Alert severity="success" sx={{ mt: 2 }}>
          אין פריטים במלאי נמוך (מתחת ל-{alertSettings.stockThreshold}%).
        </Alert>
      )}
    </Box>
  );

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        width: '100%', 
        maxWidth: 800, 
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: 2,
        p: 3,
        position: 'relative'
      }}
    >
      {/* כותרת וכפתור סגירה */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: '#333' }}>
            מרכז התראות
          </Typography>
          <Typography variant="body2" color="text.secondary">
            עודכן לאחרונה: {alerts.summary?.last_updated ? new Date(alerts.summary.last_updated).toLocaleString('he-IL') : ''}
          </Typography>
        </Box>
        <Box>
          <Tooltip title="הגדרות התראות">
            <IconButton onClick={() => setSettingsDialogOpen(true)} sx={{ mr: 1 }}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* סיכום התראות */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Chip 
          icon={<ErrorIcon />} 
          color="error" 
          variant={alerts.summary?.overdue_count > 0 ? "filled" : "outlined"} 
          label={`${alerts.summary?.overdue_count || 0} השאלות באיחור`}
        />
        <Chip 
          icon={<AccessTimeIcon />} 
          color="primary" 
          variant={alerts.summary?.upcoming_count > 0 ? "filled" : "outlined"} 
          label={`${alerts.summary?.upcoming_count || 0} החזרות קרובות`}
        />
        <Chip 
          icon={<InventoryIcon />} 
          color="warning" 
          variant={alerts.summary?.low_stock_count > 0 ? "filled" : "outlined"} 
          label={`${alerts.summary?.low_stock_count || 0} פריטים במלאי נמוך`}
        />
        {alerts.summary?.high_severity_count > 0 && (
          <Chip 
            icon={<WarningIcon />} 
            color="error" 
            label={`${alerts.summary?.high_severity_count} התראות חשובות`}
          />
        )}
      </Box>
      
      {/* טאבים */}
      <Paper sx={{ mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="fullWidth" 
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab 
            label={
              <Badge color="error" badgeContent={alerts.summary?.overdue_count || 0} max={99}>
                השאלות באיחור
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge color="primary" badgeContent={alerts.summary?.upcoming_count || 0} max={99}>
                החזרות קרובות
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge color="warning" badgeContent={alerts.summary?.low_stock_count || 0} max={99}>
                מלאי נמוך
              </Badge>
            } 
          />
        </Tabs>
      </Paper>
      
      {/* שגיאה */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* טעינה */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* תוכן הטאב הנבחר */}
          {tabValue === 0 && <OverdueLoansTab />}
          {tabValue === 1 && <UpcomingReturnsTab />}
          {tabValue === 2 && <LowStockTab />}
        </>
      )}
      
      {/* דיאלוג שליחת מייל */}
      <Dialog open={emailDialogOpen} onClose={handleCloseEmailDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          שליחת התראה במייל
        </DialogTitle>
        <DialogContent>
          {emailSuccess ? (
            <Box sx={{ py: 2, textAlign: 'center' }}>
              <MarkEmailReadIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                האימייל נשלח בהצלחה!
              </Typography>
              <Typography color="text.secondary">
                ההתראה נשלחה בהצלחה לכתובת {recipient}
              </Typography>
            </Box>
          ) : (
            <>
              {emailError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {emailError}
                </Alert>
              )}
              
              <Typography variant="body1" sx={{ mb: 2 }}>
                שליחת התראה בנושא: <strong>{selectedAlert ? getAlertTitle(selectedAlert) : ''}</strong>
              </Typography>
              
              <TextField
                autoFocus
                margin="dense"
                id="recipient"
                label="כתובת אימייל"
                type="email"
                fullWidth
                variant="outlined"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                sx={{ mb: 2 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          {emailSuccess ? (
            <Button onClick={handleCloseEmailDialog} variant="contained" color="primary">
              סגור
            </Button>
          ) : (
            <>
              <Button onClick={handleCloseEmailDialog}>ביטול</Button>
              <Button 
                onClick={handleSendEmail} 
                variant="contained" 
                color="primary"
                disabled={!recipient || sendingEmail}
              >
                {sendingEmail ? <CircularProgress size={24} /> : 'שלח התראה'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
      
      {/* דיאלוג הגדרות */}
      <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          הגדרות התראות
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            התאם את הגדרות ההתראות כדי לשלוט בסוגי ההתראות שתרצה לראות.
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="days-threshold-label">סף ימים להתראה על החזרות קרובות</InputLabel>
            <Select
              labelId="days-threshold-label"
              id="days-threshold"
              value={alertSettings.daysThreshold}
              label="סף ימים להתראה על החזרות קרובות"
              onChange={(e) => setAlertSettings({ ...alertSettings, daysThreshold: e.target.value })}
            >
              <MenuItem value={1}>יום אחד</MenuItem>
              <MenuItem value={2}>יומיים</MenuItem>
              <MenuItem value={3}>3 ימים</MenuItem>
              <MenuItem value={5}>5 ימים</MenuItem>
              <MenuItem value={7}>שבוע</MenuItem>
              <MenuItem value={14}>שבועיים</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel id="stock-threshold-label">סף אחוזי מלאי להתראה</InputLabel>
            <Select
              labelId="stock-threshold-label"
              id="stock-threshold"
              value={alertSettings.stockThreshold}
              label="סף אחוזי מלאי להתראה"
              onChange={(e) => setAlertSettings({ ...alertSettings, stockThreshold: e.target.value })}
            >
              <MenuItem value={5}>5% (קריטי בלבד)</MenuItem>
              <MenuItem value={10}>10%</MenuItem>
              <MenuItem value={15}>15%</MenuItem>
              <MenuItem value={20}>20%</MenuItem>
              <MenuItem value={25}>25%</MenuItem>
              <MenuItem value={30}>30%</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>ביטול</Button>
          <Button onClick={handleSaveSettings} variant="contained" color="primary">
            שמור הגדרות
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default AlertsCenter;