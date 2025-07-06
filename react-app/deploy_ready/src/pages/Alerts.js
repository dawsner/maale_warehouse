import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Tabs, 
  Tab, 
  Divider,
  Chip,
  Stack, 
  Card, 
  CardContent, 
  Grid, 
  Button,
  TextField,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Snackbar,
  FormControlLabel,
  Switch,
  Badge
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  EventNote as EventNoteIcon,
  Inventory as InventoryIcon,
  Close as CloseIcon,
  Mail as MailIcon,
  Add as AddIcon,
  NotificationImportant as NotificationImportantIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { alertsAPI } from '../api/api';

// טאב פאנל עבור חלוקה ללשוניות
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`alerts-tabpanel-${index}`}
      aria-labelledby={`alerts-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// הפונקציה הראשית של דף ההתראות
function Alerts() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState({
    overdue_loans: [],
    upcoming_returns: [],
    low_stock: [],
    summary: { 
      total_alerts: 0,
      overdue_count: 0, 
      upcoming_count: 0, 
      low_stock_count: 0, 
      high_severity_count: 0
    }
  });
  
  const [tabValue, setTabValue] = useState(0);
  const [sendEmailDialogOpen, setSendEmailDialogOpen] = useState(false);
  const [emailTarget, setEmailTarget] = useState("");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  
  // סינון והגדרות התראות
  const [alertSettings, setAlertSettings] = useState({
    daysThreshold: 3,
    stockThreshold: 20,
    autoRefresh: false
  });
  
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  
  const navigate = useNavigate();
  
  // פונקציה לטעינת ההתראות מהשרת
  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const alertsData = await alertsAPI.getAlerts(
        alertSettings.daysThreshold,
        alertSettings.stockThreshold
      );
      
      console.log("Alerts data received:", alertsData);
      setAlerts(alertsData);
    } catch (error) {
      console.error("Error loading alerts:", error);
      setError("שגיאה בטעינת ההתראות. אנא נסה שנית מאוחר יותר.");
    } finally {
      setLoading(false);
    }
  };
  
  // טעינת ההתראות בעת טעינת הדף
  useEffect(() => {
    loadAlerts();
    
    // הגדרת רענון אוטומטי אם מופעל
    let intervalId;
    if (alertSettings.autoRefresh) {
      intervalId = setInterval(() => {
        loadAlerts();
      }, 60000); // רענון כל דקה
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [alertSettings.daysThreshold, alertSettings.stockThreshold, alertSettings.autoRefresh]);
  
  // פונקציה לשינוי הלשונית הנוכחית
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // פונקציה לפתיחת דיאלוג שליחת אימייל
  const handleOpenSendEmailDialog = (alert, alertType) => {
    setSelectedAlert({ ...alert, alertType });
    // אם יש אימייל כבר לאיש הקשר, נשתמש בו
    setEmailTarget(alert.email || "");
    setSendEmailDialogOpen(true);
  };
  
  // פונקציה לסגירת דיאלוג שליחת אימייל
  const handleCloseSendEmailDialog = () => {
    setSendEmailDialogOpen(false);
    setSelectedAlert(null);
    setEmailTarget("");
  };
  
  // פונקציה לשליחת התראת אימייל
  const handleSendEmail = async () => {
    if (!selectedAlert || !emailTarget) {
      setSnackbar({
        open: true,
        message: "חסרים נתונים - אנא מלא את כל השדות",
        severity: "error"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // תלוי בסוג ההתראה, נשלח מידע שונה
      const response = await alertsAPI.sendEmailAlert(
        selectedAlert.alertType === "overdue" ? "overdue" : 
          selectedAlert.alertType === "upcoming" ? "upcoming" : "low_stock",
        selectedAlert,
        emailTarget
      );
      
      console.log("Email sent response:", response);
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: "האימייל נשלח בהצלחה",
          severity: "success"
        });
        handleCloseSendEmailDialog();
      } else {
        throw new Error(response.message || "שגיאה בשליחת האימייל");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setSnackbar({
        open: true,
        message: `שגיאה בשליחת האימייל: ${error.message || "בעיה בלתי צפויה"}`,
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // פונקציה לסגירת הודעת snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // פונקציה לפתיחת דיאלוג הגדרות
  const handleOpenSettingsDialog = () => {
    setSettingsDialogOpen(true);
  };
  
  // פונקציה לסגירת דיאלוג הגדרות
  const handleCloseSettingsDialog = () => {
    setSettingsDialogOpen(false);
  };
  
  // פונקציה לשמירת הגדרות
  const handleSaveSettings = () => {
    setSettingsDialogOpen(false);
    // רענון ההתראות עם ההגדרות החדשות
    loadAlerts();
  };
  
  // פונקציה להצגת רמת החומרה של התראה
  const getSeverityChip = (severity) => {
    const severityConfig = {
      high: { color: "error", icon: <ErrorIcon />, label: "קריטי" },
      medium: { color: "warning", icon: <WarningIcon />, label: "בינוני" },
      low: { color: "info", icon: <InfoIcon />, label: "נמוך" }
    };
    
    const config = severityConfig[severity] || severityConfig.low;
    
    return (
      <Chip 
        icon={config.icon} 
        label={config.label} 
        color={config.color} 
        size="small" 
        sx={{ fontWeight: 'bold' }}
      />
    );
  };
  
  // כרטיס המציג את כל הסיכום של ההתראות
  const AlertsSummaryCard = () => (
    <Card elevation={3} sx={{ mb: 4, bgcolor: '#f8f9fa', borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <NotificationsIcon color="primary" sx={{ fontSize: 28, mr: 1 }} />
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            סיכום התראות
          </Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', bgcolor: alerts.summary.high_severity_count > 0 ? '#fdeded' : 'white', border: alerts.summary.high_severity_count > 0 ? '1px solid #ef5350' : '1px solid #e0e0e0' }}>
              <Typography variant="subtitle2" color="text.secondary">התראות קריטיות</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                <Badge badgeContent={alerts.summary.high_severity_count} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '1rem', height: '1.5rem', minWidth: '1.5rem' } }}>
                  <ErrorIcon color="error" sx={{ fontSize: 24, mx: 1 }} />
                </Badge>
                <Typography variant="h4" component="div" color={alerts.summary.high_severity_count > 0 ? "error" : "text.secondary"} sx={{ fontWeight: 'bold' }}>
                  {alerts.summary.high_severity_count}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary">השאלות באיחור</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                <EventNoteIcon color="primary" sx={{ fontSize: 24, mx: 1 }} />
                <Typography variant="h4" component="div" color="primary" sx={{ fontWeight: 'bold' }}>
                  {alerts.summary.overdue_count}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary">החזרות בקרוב</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                <InfoIcon color="info" sx={{ fontSize: 24, mx: 1 }} />
                <Typography variant="h4" component="div" color="info.main" sx={{ fontWeight: 'bold' }}>
                  {alerts.summary.upcoming_count}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary">מלאי נמוך</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                <InventoryIcon color="warning" sx={{ fontSize: 24, mx: 1 }} />
                <Typography variant="h4" component="div" color="warning.main" sx={{ fontWeight: 'bold' }}>
                  {alerts.summary.low_stock_count}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Typography variant="caption" color="text.secondary">
            עודכן לאחרונה: {alerts.summary.last_updated || "לא ידוע"}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
  
  // כרטיס המציג השאלה באיחור
  const OverdueLoanCard = ({ loan }) => (
    <Card sx={{ mb: 2, border: '1px solid #e0e0e0', borderRight: `4px solid ${loan.severity === 'high' ? '#d32f2f' : loan.severity === 'medium' ? '#ed6c02' : '#0288d1'}` }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" component="div">
              {loan.item_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              סטודנט/ית: {loan.student_name} ({loan.student_id})
            </Typography>
            
            <Grid container spacing={1} sx={{ mb: 1 }}>
              <Grid item>
                <Chip 
                  label={`תאריך השאלה: ${loan.loan_date.split(' ')[0]}`}
                  variant="outlined" 
                  size="small" 
                />
              </Grid>
              <Grid item>
                <Chip 
                  label={`תאריך יעד להחזרה: ${loan.due_date.split(' ')[0]}`}
                  variant="outlined" 
                  size="small" 
                  color="error"
                />
              </Grid>
            </Grid>
            
            {loan.loan_notes && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>הערות: </strong> {loan.loan_notes}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
            <Box sx={{ mb: 2 }}>
              {getSeverityChip(loan.severity)}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h5" component="div" color="error" sx={{ fontWeight: 'bold', ml: 1 }}>
                {loan.days_overdue}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ימים באיחור
              </Typography>
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                startIcon={<EmailIcon />}
                onClick={() => handleOpenSendEmailDialog(loan, "overdue")}
                size="small"
              >
                שלח תזכורת
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
  
  // כרטיס המציג החזרה קרובה
  const UpcomingReturnCard = ({ loan }) => (
    <Card sx={{ mb: 2, border: '1px solid #e0e0e0', borderRight: `4px solid ${loan.severity === 'high' ? '#d32f2f' : loan.severity === 'medium' ? '#ed6c02' : '#0288d1'}` }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" component="div">
              {loan.item_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              סטודנט/ית: {loan.student_name} ({loan.student_id})
            </Typography>
            
            <Grid container spacing={1} sx={{ mb: 1 }}>
              <Grid item>
                <Chip 
                  label={`תאריך השאלה: ${loan.loan_date.split(' ')[0]}`}
                  variant="outlined" 
                  size="small" 
                />
              </Grid>
              <Grid item>
                <Chip 
                  label={`תאריך יעד להחזרה: ${loan.due_date.split(' ')[0]}`}
                  variant="outlined" 
                  size="small" 
                  color="info"
                />
              </Grid>
            </Grid>
            
            {loan.loan_notes && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>הערות: </strong> {loan.loan_notes}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
            <Box sx={{ mb: 2 }}>
              {getSeverityChip(loan.severity)}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h5" component="div" color="info.main" sx={{ fontWeight: 'bold', ml: 1 }}>
                {loan.days_remaining}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ימים נותרו
              </Typography>
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                startIcon={<EmailIcon />}
                onClick={() => handleOpenSendEmailDialog(loan, "upcoming")}
                size="small"
              >
                שלח תזכורת
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
  
  // כרטיס המציג פריט עם מלאי נמוך
  const LowStockCard = ({ item }) => (
    <Card sx={{ mb: 2, border: '1px solid #e0e0e0', borderRight: `4px solid ${item.severity === 'high' ? '#d32f2f' : item.severity === 'medium' ? '#ed6c02' : '#0288d1'}` }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" component="div">
              {item.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              קטגוריה: {item.category}
            </Typography>
            
            <Grid container spacing={1} sx={{ mb: 1 }}>
              <Grid item>
                <Chip 
                  label={`כמות כוללת: ${item.quantity}`}
                  variant="outlined" 
                  size="small" 
                />
              </Grid>
              <Grid item>
                <Chip 
                  label={`כמות זמינה: ${item.available_quantity}`}
                  variant="outlined" 
                  size="small" 
                  color={item.severity === 'high' ? "error" : item.severity === 'medium' ? "warning" : "info"}
                />
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
            <Box sx={{ mb: 2 }}>
              {getSeverityChip(item.severity)}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h5" component="div" color={item.severity === 'high' ? "error" : item.severity === 'medium' ? "warning.main" : "info.main"} sx={{ fontWeight: 'bold', ml: 1 }}>
                {item.stock_percent}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                אחוז זמינות
              </Typography>
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                startIcon={<EmailIcon />}
                onClick={() => handleOpenSendEmailDialog(item, "low_stock")}
                size="small"
              >
                שלח התראה
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
  
  // דיאלוג לשליחת אימייל
  const SendEmailDialog = () => (
    <Dialog open={sendEmailDialogOpen} onClose={handleCloseSendEmailDialog} maxWidth="sm" fullWidth>
      <DialogTitle>
        שליחת התראה בדוא"ל
        <IconButton
          aria-label="close"
          onClick={handleCloseSendEmailDialog}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {selectedAlert && (
          <>
            <Alert severity={selectedAlert.severity === 'high' ? "error" : selectedAlert.severity === 'medium' ? "warning" : "info"} sx={{ mb: 3 }}>
              <AlertTitle>
                {selectedAlert.alertType === "overdue" ? "התראה על איחור בהחזרת ציוד" :
                 selectedAlert.alertType === "upcoming" ? "תזכורת על החזרת ציוד בקרוב" :
                 "התראה על מלאי נמוך"}
              </AlertTitle>
              {selectedAlert.alertType === "overdue" ? `פריט ${selectedAlert.item_name} באיחור של ${selectedAlert.days_overdue} ימים` :
               selectedAlert.alertType === "upcoming" ? `פריט ${selectedAlert.item_name} להחזרה בעוד ${selectedAlert.days_remaining} ימים` :
               `פריט ${selectedAlert.name} במלאי נמוך (${selectedAlert.stock_percent}%)`}
            </Alert>
            
            <TextField
              autoFocus
              margin="dense"
              label="כתובת דוא״ל"
              type="email"
              fullWidth
              variant="outlined"
              value={emailTarget}
              onChange={(e) => setEmailTarget(e.target.value)}
              required
              error={emailTarget === ""}
              helperText={emailTarget === "" ? "נא להזין כתובת דוא״ל" : ""}
              sx={{ mb: 3, direction: 'ltr' }}
            />
            
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              תצוגה מקדימה של תוכן ההודעה:
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa' }}>
              <Typography variant="body2">
                שלום,
              </Typography>
              
              {selectedAlert.alertType === "overdue" ? (
                <>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    ברצוננו להזכיר כי קיים ציוד שהושאל ועבר את מועד ההחזרה המתוכנן:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>פריט:</strong> {selectedAlert.item_name}<br />
                    <strong>תאריך השאלה:</strong> {selectedAlert.loan_date}<br />
                    <strong>תאריך החזרה מתוכנן:</strong> {selectedAlert.due_date}<br />
                    <strong>באיחור של:</strong> {selectedAlert.days_overdue} ימים
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    נודה על החזרת הציוד בהקדם האפשרי.
                  </Typography>
                </>
              ) : selectedAlert.alertType === "upcoming" ? (
                <>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    ברצוננו להזכיר כי מועד ההחזרה של הציוד הבא מתקרב:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>פריט:</strong> {selectedAlert.item_name}<br />
                    <strong>תאריך השאלה:</strong> {selectedAlert.loan_date}<br />
                    <strong>תאריך החזרה מתוכנן:</strong> {selectedAlert.due_date}<br />
                    <strong>זמן שנותר:</strong> {selectedAlert.days_remaining} ימים
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    אנא וודאו כי הציוד יוחזר בזמן.
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    ברצוננו להודיע כי כמות המלאי של הפריט הבא נמוכה:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>פריט:</strong> {selectedAlert.name}<br />
                    <strong>קטגוריה:</strong> {selectedAlert.category}<br />
                    <strong>כמות זמינה:</strong> {selectedAlert.available_quantity} מתוך {selectedAlert.quantity}<br />
                    <strong>אחוז במלאי:</strong> {selectedAlert.stock_percent}%
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    מומלץ לשקול הזמנה של פריטים נוספים.
                  </Typography>
                </>
              )}
            </Paper>
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleCloseSendEmailDialog}>ביטול</Button>
        <Button 
          onClick={handleSendEmail} 
          variant="contained" 
          color="primary" 
          startIcon={<MailIcon />}
          disabled={!emailTarget}
        >
          שלח דוא"ל
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  // דיאלוג הגדרות
  const SettingsDialog = () => (
    <Dialog open={settingsDialogOpen} onClose={handleCloseSettingsDialog} maxWidth="sm" fullWidth>
      <DialogTitle>
        הגדרות התראות
        <IconButton
          aria-label="close"
          onClick={handleCloseSettingsDialog}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 0 }}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              סף התראות
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="ימים להתראה על החזרות קרובות"
              type="number"
              InputProps={{ inputProps: { min: 1, max: 30 } }}
              value={alertSettings.daysThreshold}
              onChange={(e) => setAlertSettings({ ...alertSettings, daysThreshold: parseInt(e.target.value) || 3 })}
              helperText="התראות יוצגו על השאלות שמועד החזרתן מתקרב בטווח זה"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="אחוז סף למלאי נמוך"
              type="number"
              InputProps={{ inputProps: { min: 1, max: 100 } }}
              value={alertSettings.stockThreshold}
              onChange={(e) => setAlertSettings({ ...alertSettings, stockThreshold: parseInt(e.target.value) || 20 })}
              helperText="התראות יוצגו על פריטים שאחוז המלאי שלהם נמוך מערך זה"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              הגדרות כלליות
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={alertSettings.autoRefresh}
                  onChange={(e) => setAlertSettings({ ...alertSettings, autoRefresh: e.target.checked })}
                  color="primary"
                />
              }
              label="רענון אוטומטי של התראות (כל דקה)"
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleCloseSettingsDialog}>ביטול</Button>
        <Button onClick={handleSaveSettings} variant="contained" color="primary">
          שמור הגדרות
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  return (
    <Box sx={{ maxWidth: '100%', mb: 8 }}>
      {/* כותרת */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#373B5C' }}>
            מערכת התראות
          </Typography>
          <Typography variant="body1" color="text.secondary">
            ניהול התראות על השאלות, החזרות ומלאי
          </Typography>
        </Box>
        
        <Box>
          <Tooltip title="הגדרות">
            <IconButton color="primary" onClick={handleOpenSettingsDialog}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="רענן התראות">
            <IconButton 
              color="primary" 
              onClick={loadAlerts}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : <NotificationImportantIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* הודעת שגיאה */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* כרטיס סיכום */}
      {!loading && !error && <AlertsSummaryCard />}
      
      {/* טאבים */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" aria-label="alerts tabs">
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Badge badgeContent={alerts.summary.overdue_count} color="error" sx={{ mr: 1 }}>
                  <EventNoteIcon />
                </Badge>
                <Box>השאלות באיחור</Box>
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Badge badgeContent={alerts.summary.upcoming_count} color="info" sx={{ mr: 1 }}>
                  <InfoIcon />
                </Badge>
                <Box>החזרות קרובות</Box>
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Badge badgeContent={alerts.summary.low_stock_count} color="warning" sx={{ mr: 1 }}>
                  <InventoryIcon />
                </Badge>
                <Box>מלאי נמוך</Box>
              </Box>
            } 
          />
        </Tabs>
      </Box>
      
      {/* תוכן הטאבים */}
      <TabPanel value={tabValue} index={0}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : alerts.overdue_loans.length > 0 ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                {alerts.overdue_loans.length} השאלות באיחור
              </Typography>
            </Box>
            
            {alerts.overdue_loans.map((loan, index) => (
              <OverdueLoanCard key={`${loan.id}-${index}`} loan={loan} />
            ))}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6">אין השאלות באיחור</Typography>
            <Typography variant="body2" color="text.secondary">
              כל ההשאלות הוחזרו בזמן
            </Typography>
          </Box>
        )}
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : alerts.upcoming_returns.length > 0 ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                {alerts.upcoming_returns.length} החזרות קרובות
              </Typography>
            </Box>
            
            {alerts.upcoming_returns.map((loan, index) => (
              <UpcomingReturnCard key={`${loan.id}-${index}`} loan={loan} />
            ))}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <InfoIcon color="info" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6">אין החזרות קרובות</Typography>
            <Typography variant="body2" color="text.secondary">
              אין השאלות שמועד החזרתן קרב בטווח של {alertSettings.daysThreshold} ימים
            </Typography>
          </Box>
        )}
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : alerts.low_stock.length > 0 ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                {alerts.low_stock.length} פריטים במלאי נמוך
              </Typography>
            </Box>
            
            {alerts.low_stock.map((item, index) => (
              <LowStockCard key={`${item.id}-${index}`} item={item} />
            ))}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <InventoryIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6">אין פריטים במלאי נמוך</Typography>
            <Typography variant="body2" color="text.secondary">
              כל הפריטים במלאי מעל סף של {alertSettings.stockThreshold}%
            </Typography>
          </Box>
        )}
      </TabPanel>
      
      {/* דיאלוגים */}
      <SendEmailDialog />
      <SettingsDialog />
      
      {/* Snackbar להודעות */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Alerts;