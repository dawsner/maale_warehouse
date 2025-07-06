import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { maintenanceAPI } from '../../api/maintenanceAPI';
import {
  Container, Box, Typography, Grid, Paper, Tabs, Tab, Button,
  Card, CardContent, Divider, Chip, Alert, CircularProgress,
  List, ListItem, ListItemText, FormControl, InputLabel,
  Select, MenuItem, TextField, Dialog, DialogActions,
  DialogContent, DialogTitle
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import heLocale from 'date-fns/locale/he';
import { styled } from '@mui/material/styles';
import BuildIcon from '@mui/icons-material/Build';
import HistoryIcon from '@mui/icons-material/History';
import EventIcon from '@mui/icons-material/Event';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`maintenance-tabpanel-${index}`}
      aria-labelledby={`maintenance-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const StatusChip = styled(Chip)(({ status, theme }) => {
  let color;
  
  switch (status) {
    case 'operational':
      color = '#4caf50';
      break;
    case 'in_maintenance':
      color = '#ff9800';
      break;
    case 'out_of_order':
      color = '#f44336';
      break;
    default:
      color = theme.palette.grey[500];
  }
  
  return {
    backgroundColor: color,
    color: '#fff',
    fontWeight: 'bold'
  };
});

// ממיר מחרוזת תאריך ISO לפורמט ישראלי
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('he-IL', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'operational':
      return 'תקין';
    case 'in_maintenance':
      return 'בתחזוקה';
    case 'out_of_order':
      return 'מושבת';
    default:
      return 'לא ידוע';
  }
};

const ItemMaintenance = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [maintenanceData, setMaintenanceData] = useState(null);
  const [itemDetails, setItemDetails] = useState(null);
  
  // דיאלוג עדכון סטטוס
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  
  // דיאלוג רשומת תחזוקה חדשה
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({
    maintenance_type: '',
    description: '',
    start_date: new Date(),
    end_date: null,
    performed_by: '',
    cost: 0,
    notes: ''
  });
  
  // דיאלוג הוספת תזכורת תחזוקה
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    maintenance_type: '',
    description: '',
    frequency_days: 90,
    next_due: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  });
  
  // דיאלוג הוספת מידע אחריות
  const [warrantyDialogOpen, setWarrantyDialogOpen] = useState(false);
  const [newWarranty, setNewWarranty] = useState({
    warranty_provider: '',
    warranty_number: '',
    start_date: new Date(),
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    contact_info: '',
    terms: ''
  });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // טעינת נתוני תחזוקה של הפריט
        const data = await maintenanceAPI.getItemMaintenanceData(itemId);
        setMaintenanceData(data);
        
        // שימור פרטי הפריט הבסיסיים
        if (data.item) {
          setItemDetails(data.item);
          
          // אתחול ערכי ברירת מחדל לדיאלוגים
          setNewStatus(data.status?.status || 'operational');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading maintenance data:', err);
        setError('אירעה שגיאה בטעינת נתוני תחזוקה. אנא נסה שנית.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [itemId]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleBack = () => {
    navigate('/maintenance');
  };
  
  // פונקציות לניהול דיאלוג סטטוס
  const openStatusDialog = () => {
    setStatusDialogOpen(true);
  };
  
  const closeStatusDialog = () => {
    setStatusDialogOpen(false);
  };
  
  const handleStatusChange = (event) => {
    setNewStatus(event.target.value);
  };
  
  const handleStatusNotesChange = (event) => {
    setStatusNotes(event.target.value);
  };
  
  const saveStatus = async () => {
    try {
      await maintenanceAPI.updateItemMaintenanceStatus(
        itemId,
        newStatus,
        statusNotes,
        localStorage.getItem('userId')
      );
      
      // רענון נתונים
      const data = await maintenanceAPI.getItemMaintenanceData(itemId);
      setMaintenanceData(data);
      closeStatusDialog();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('אירעה שגיאה בעדכון סטטוס התחזוקה.');
    }
  };
  
  // פונקציות לניהול דיאלוג רשומת תחזוקה חדשה
  const openRecordDialog = () => {
    setRecordDialogOpen(true);
  };
  
  const closeRecordDialog = () => {
    setRecordDialogOpen(false);
  };
  
  const handleRecordChange = (field) => (event) => {
    setNewRecord({
      ...newRecord,
      [field]: event.target.value
    });
  };
  
  const handleDateChange = (field) => (date) => {
    setNewRecord({
      ...newRecord,
      [field]: date
    });
  };
  
  const saveRecord = async () => {
    try {
      await maintenanceAPI.addMaintenanceRecord({
        item_id: itemId,
        maintenance_type: newRecord.maintenance_type,
        description: newRecord.description,
        start_date: newRecord.start_date.toISOString().split('T')[0],
        end_date: newRecord.end_date ? newRecord.end_date.toISOString().split('T')[0] : null,
        performed_by: newRecord.performed_by,
        cost: parseFloat(newRecord.cost) || 0,
        notes: newRecord.notes,
        user_id: localStorage.getItem('userId')
      });
      
      // רענון נתונים
      const data = await maintenanceAPI.getItemMaintenanceData(itemId);
      setMaintenanceData(data);
      closeRecordDialog();
      
      // איפוס הטופס
      setNewRecord({
        maintenance_type: '',
        description: '',
        start_date: new Date(),
        end_date: null,
        performed_by: '',
        cost: 0,
        notes: ''
      });
    } catch (err) {
      console.error('Error adding maintenance record:', err);
      setError('אירעה שגיאה בהוספת רשומת תחזוקה.');
    }
  };
  
  // פונקציות לניהול דיאלוג תזכורות תחזוקה
  const openScheduleDialog = () => {
    setScheduleDialogOpen(true);
  };
  
  const closeScheduleDialog = () => {
    setScheduleDialogOpen(false);
  };
  
  const handleScheduleChange = (field) => (event) => {
    setNewSchedule({
      ...newSchedule,
      [field]: event.target.value
    });
  };
  
  const handleScheduleDateChange = (date) => {
    setNewSchedule({
      ...newSchedule,
      next_due: date
    });
  };
  
  const saveSchedule = async () => {
    try {
      await maintenanceAPI.addMaintenanceSchedule({
        item_id: itemId,
        maintenance_type: newSchedule.maintenance_type,
        description: newSchedule.description,
        frequency_days: parseInt(newSchedule.frequency_days),
        next_due: newSchedule.next_due.toISOString().split('T')[0],
        user_id: localStorage.getItem('userId')
      });
      
      // רענון נתונים
      const data = await maintenanceAPI.getItemMaintenanceData(itemId);
      setMaintenanceData(data);
      closeScheduleDialog();
      
      // איפוס הטופס
      setNewSchedule({
        maintenance_type: '',
        description: '',
        frequency_days: 90,
        next_due: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      });
    } catch (err) {
      console.error('Error adding maintenance schedule:', err);
      setError('אירעה שגיאה בהוספת תזכורת תחזוקה.');
    }
  };
  
  // פונקציות לניהול דיאלוג מידע אחריות
  const openWarrantyDialog = () => {
    setWarrantyDialogOpen(true);
  };
  
  const closeWarrantyDialog = () => {
    setWarrantyDialogOpen(false);
  };
  
  const handleWarrantyChange = (field) => (event) => {
    setNewWarranty({
      ...newWarranty,
      [field]: event.target.value
    });
  };
  
  const handleWarrantyDateChange = (field) => (date) => {
    setNewWarranty({
      ...newWarranty,
      [field]: date
    });
  };
  
  const saveWarranty = async () => {
    try {
      await maintenanceAPI.addWarrantyInfo({
        item_id: itemId,
        warranty_provider: newWarranty.warranty_provider,
        warranty_number: newWarranty.warranty_number,
        start_date: newWarranty.start_date.toISOString().split('T')[0],
        end_date: newWarranty.end_date.toISOString().split('T')[0],
        contact_info: newWarranty.contact_info,
        terms: newWarranty.terms
      });
      
      // רענון נתונים
      const data = await maintenanceAPI.getItemMaintenanceData(itemId);
      setMaintenanceData(data);
      closeWarrantyDialog();
    } catch (err) {
      console.error('Error adding warranty info:', err);
      setError('אירעה שגיאה בהוספת מידע אחריות.');
    }
  };
  
  const handleDeleteWarranty = async () => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את מידע האחריות?')) {
      try {
        await maintenanceAPI.deleteWarrantyInfo(itemId);
        
        // רענון נתונים
        const data = await maintenanceAPI.getItemMaintenanceData(itemId);
        setMaintenanceData(data);
      } catch (err) {
        console.error('Error deleting warranty info:', err);
        setError('אירעה שגיאה במחיקת מידע האחריות.');
      }
    }
  };
  
  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את תזכורת התחזוקה?')) {
      try {
        await maintenanceAPI.deleteMaintenanceSchedule(scheduleId);
        
        // רענון נתונים
        const data = await maintenanceAPI.getItemMaintenanceData(itemId);
        setMaintenanceData(data);
      } catch (err) {
        console.error('Error deleting maintenance schedule:', err);
        setError('אירעה שגיאה במחיקת תזכורת התחזוקה.');
      }
    }
  };
  
  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>
      </Container>
    );
  }
  
  if (!itemDetails) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 3 }}>פריט לא נמצא.</Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          sx={{ mt: 2 }}
          onClick={handleBack}
        >
          חזרה לדף ניהול תחזוקה
        </Button>
      </Container>
    );
  }
  
  return (
    <Container dir="rtl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 3 }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          חזרה
        </Button>
        <Typography variant="h4" component="h1">
          ניהול תחזוקה - {itemDetails.name}
        </Typography>
      </Box>
      
      {/* כרטיס פרטי הפריט */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h5" component="div">
                  {itemDetails.name}
                </Typography>
                {maintenanceData.status && (
                  <StatusChip 
                    label={getStatusLabel(maintenanceData.status.status)} 
                    status={maintenanceData.status.status}
                  />
                )}
              </Box>
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                קטגוריה: {itemDetails.category}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                כמות: {itemDetails.quantity}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                הערות: {itemDetails.notes || 'אין הערות'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                sx={{ mb: 1 }}
                onClick={openStatusDialog}
              >
                עדכון סטטוס תחזוקה
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                fullWidth
                onClick={openRecordDialog}
              >
                הוספת רשומת תחזוקה
              </Button>
            </Grid>
          </Grid>
          
          {maintenanceData.status && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                פרטי סטטוס תחזוקה נוכחי:
              </Typography>
              <Typography variant="body2">
                עודכן בתאריך: {formatDate(maintenanceData.status.updated_at)}
              </Typography>
              {maintenanceData.status.notes && (
                <Typography variant="body2">
                  הערות: {maintenanceData.status.notes}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* כרטיסיות לניהול תחזוקה */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<HistoryIcon />} label="היסטוריית תחזוקה" />
          <Tab icon={<EventIcon />} label="תזכורות תחזוקה" />
          <Tab icon={<VerifiedUserIcon />} label="אחריות יצרן" />
        </Tabs>
        
        {/* לשונית היסטוריית תחזוקה */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ textAlign: 'right', mb: 2 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={openRecordDialog}
            >
              הוספת רשומת תחזוקה חדשה
            </Button>
          </Box>
          
          {maintenanceData.records && maintenanceData.records.length > 0 ? (
            <List>
              {maintenanceData.records.map((record) => (
                <React.Fragment key={record.id}>
                  <ListItem
                    sx={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      mb: 2,
                      flexDirection: 'column',
                      alignItems: 'stretch'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Typography variant="h6">{record.maintenance_type}</Typography>
                      <Chip 
                        label={record.end_date ? 'הושלם' : 'בטיפול'} 
                        color={record.end_date ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                    <ListItemText 
                      primary={`תיאור: ${record.description}`}
                      secondary={
                        <>
                          <Typography variant="body2" component="span" display="block">
                            תאריך התחלה: {formatDate(record.start_date)}
                          </Typography>
                          {record.end_date && (
                            <Typography variant="body2" component="span" display="block">
                              תאריך סיום: {formatDate(record.end_date)}
                            </Typography>
                          )}
                          {record.performed_by && (
                            <Typography variant="body2" component="span" display="block">
                              בוצע ע"י: {record.performed_by}
                            </Typography>
                          )}
                          {record.cost > 0 && (
                            <Typography variant="body2" component="span" display="block">
                              עלות: ₪{record.cost}
                            </Typography>
                          )}
                          {record.notes && (
                            <Typography variant="body2" component="span" display="block">
                              הערות: {record.notes}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Alert severity="info">
              אין רשומות תחזוקה לפריט זה. הוסף רשומה חדשה כדי לתעד פעולות תחזוקה.
            </Alert>
          )}
        </TabPanel>
        
        {/* לשונית תזכורות תחזוקה */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ textAlign: 'right', mb: 2 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={openScheduleDialog}
            >
              הוספת תזכורת תחזוקה חדשה
            </Button>
          </Box>
          
          {maintenanceData.schedules && maintenanceData.schedules.length > 0 ? (
            <List>
              {maintenanceData.schedules.map((schedule) => (
                <React.Fragment key={schedule.id}>
                  <ListItem
                    sx={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      mb: 2,
                      flexDirection: 'column',
                      alignItems: 'stretch'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Typography variant="h6">{schedule.maintenance_type}</Typography>
                      <Chip 
                        label={`${schedule.days_remaining} ימים`} 
                        color={schedule.days_remaining <= 7 ? 'error' : 'warning'}
                        size="small"
                      />
                    </Box>
                    <ListItemText 
                      primary={schedule.description}
                      secondary={
                        <>
                          <Typography variant="body2" component="span" display="block">
                            מועד יעד הבא: {formatDate(schedule.next_due)}
                          </Typography>
                          <Typography variant="body2" component="span" display="block">
                            תדירות: כל {schedule.frequency_days} ימים
                          </Typography>
                          {schedule.last_performed && (
                            <Typography variant="body2" component="span" display="block">
                              בוצע לאחרונה: {formatDate(schedule.last_performed)}
                            </Typography>
                          )}
                        </>
                      }
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <Button 
                        variant="outlined" 
                        color="error" 
                        size="small"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                      >
                        מחק תזכורת
                      </Button>
                    </Box>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Alert severity="info">
              אין תזכורות תחזוקה לפריט זה. הוסף תזכורת חדשה כדי לקבל התראות על תחזוקה תקופתית.
            </Alert>
          )}
        </TabPanel>
        
        {/* לשונית אחריות יצרן */}
        <TabPanel value={tabValue} index={2}>
          {maintenanceData.warranty ? (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">פרטי אחריות יצרן</Typography>
                  <Chip 
                    label={maintenanceData.warranty.is_active ? 'בתוקף' : 'פג תוקף'} 
                    color={maintenanceData.warranty.is_active ? 'success' : 'error'}
                  />
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>ספק האחריות:</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {maintenanceData.warranty.warranty_provider}
                    </Typography>
                    
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>מספר אחריות:</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {maintenanceData.warranty.warranty_number}
                    </Typography>
                    
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>פרטי קשר:</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {maintenanceData.warranty.contact_info || 'לא צוין'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>תאריך התחלה:</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {formatDate(maintenanceData.warranty.start_date)}
                    </Typography>
                    
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>תאריך סיום:</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {formatDate(maintenanceData.warranty.end_date)}
                    </Typography>
                  </Grid>
                  
                  {maintenanceData.warranty.terms && (
                    <Grid item xs={12}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>תנאי אחריות:</Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {maintenanceData.warranty.terms}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    sx={{ mr: 1 }}
                    onClick={openWarrantyDialog}
                  >
                    עדכון אחריות
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="error"
                    onClick={handleDeleteWarranty}
                  >
                    מחיקת אחריות
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                אין מידע אחריות יצרן לפריט זה.
              </Alert>
              <Button 
                variant="contained"
                onClick={openWarrantyDialog}
              >
                הוספת פרטי אחריות
              </Button>
            </Box>
          )}
        </TabPanel>
      </Paper>
      
      {/* דיאלוג עדכון סטטוס */}
      <Dialog open={statusDialogOpen} onClose={closeStatusDialog} maxWidth="sm" fullWidth>
        <DialogTitle>עדכון סטטוס תחזוקה</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="status-select-label">סטטוס</InputLabel>
              <Select
                labelId="status-select-label"
                value={newStatus}
                label="סטטוס"
                onChange={handleStatusChange}
              >
                <MenuItem value="operational">תקין</MenuItem>
                <MenuItem value="in_maintenance">בתחזוקה</MenuItem>
                <MenuItem value="out_of_order">מושבת</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="הערות"
              multiline
              rows={4}
              fullWidth
              value={statusNotes}
              onChange={handleStatusNotesChange}
              placeholder="הוסף הערות לגבי סטטוס התחזוקה (אופציונלי)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeStatusDialog}>ביטול</Button>
          <Button onClick={saveStatus} variant="contained">שמירה</Button>
        </DialogActions>
      </Dialog>
      
      {/* דיאלוג רשומת תחזוקה חדשה */}
      <Dialog open={recordDialogOpen} onClose={closeRecordDialog} maxWidth="md" fullWidth>
        <DialogTitle>הוספת רשומת תחזוקה</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="סוג תחזוקה"
                fullWidth
                required
                value={newRecord.maintenance_type}
                onChange={handleRecordChange('maintenance_type')}
                placeholder="לדוגמה: תיקון, בדיקה תקופתית, החלפת חלק"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="בוצע על ידי"
                fullWidth
                value={newRecord.performed_by}
                onChange={handleRecordChange('performed_by')}
                placeholder="שם הטכנאי או החברה"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="תיאור"
                fullWidth
                required
                multiline
                rows={2}
                value={newRecord.description}
                onChange={handleRecordChange('description')}
                placeholder="תיאור מפורט של פעולת התחזוקה"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={heLocale}>
                <DatePicker
                  label="תאריך התחלה"
                  value={newRecord.start_date}
                  onChange={handleDateChange('start_date')}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={heLocale}>
                <DatePicker
                  label="תאריך סיום (אופציונלי)"
                  value={newRecord.end_date}
                  onChange={handleDateChange('end_date')}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="עלות (₪)"
                type="number"
                fullWidth
                value={newRecord.cost}
                onChange={handleRecordChange('cost')}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="הערות"
                multiline
                rows={3}
                fullWidth
                value={newRecord.notes}
                onChange={handleRecordChange('notes')}
                placeholder="הערות נוספות"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRecordDialog}>ביטול</Button>
          <Button 
            onClick={saveRecord} 
            variant="contained"
            disabled={!newRecord.maintenance_type || !newRecord.description}
          >
            שמירה
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* דיאלוג תזכורת תחזוקה */}
      <Dialog open={scheduleDialogOpen} onClose={closeScheduleDialog} maxWidth="sm" fullWidth>
        <DialogTitle>הוספת תזכורת תחזוקה</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="סוג תחזוקה"
                fullWidth
                required
                value={newSchedule.maintenance_type}
                onChange={handleScheduleChange('maintenance_type')}
                placeholder="לדוגמה: כיול, ניקוי, בדיקה תקופתית"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="תיאור"
                fullWidth
                multiline
                rows={2}
                value={newSchedule.description}
                onChange={handleScheduleChange('description')}
                placeholder="תיאור של פעולת התחזוקה הנדרשת"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="תדירות (ימים)"
                type="number"
                fullWidth
                required
                value={newSchedule.frequency_days}
                onChange={handleScheduleChange('frequency_days')}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={heLocale}>
                <DatePicker
                  label="מועד יעד הבא"
                  value={newSchedule.next_due}
                  onChange={handleScheduleDateChange}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeScheduleDialog}>ביטול</Button>
          <Button 
            onClick={saveSchedule} 
            variant="contained"
            disabled={!newSchedule.maintenance_type || !newSchedule.frequency_days}
          >
            שמירה
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* דיאלוג אחריות יצרן */}
      <Dialog open={warrantyDialogOpen} onClose={closeWarrantyDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {maintenanceData.warranty ? 'עדכון פרטי אחריות' : 'הוספת פרטי אחריות'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="ספק האחריות"
                fullWidth
                required
                value={newWarranty.warranty_provider}
                onChange={handleWarrantyChange('warranty_provider')}
                placeholder="שם היצרן או נותן האחריות"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="מספר אחריות"
                fullWidth
                required
                value={newWarranty.warranty_number}
                onChange={handleWarrantyChange('warranty_number')}
                placeholder="מספר חוזה, תעודה או הסכם אחריות"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={heLocale}>
                <DatePicker
                  label="תאריך התחלה"
                  value={newWarranty.start_date}
                  onChange={handleWarrantyDateChange('start_date')}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={heLocale}>
                <DatePicker
                  label="תאריך סיום"
                  value={newWarranty.end_date}
                  onChange={handleWarrantyDateChange('end_date')}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="פרטי קשר"
                fullWidth
                value={newWarranty.contact_info}
                onChange={handleWarrantyChange('contact_info')}
                placeholder="טלפון, אימייל או פרטי קשר אחרים לשירות לקוחות"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="תנאי אחריות"
                multiline
                rows={3}
                fullWidth
                value={newWarranty.terms}
                onChange={handleWarrantyChange('terms')}
                placeholder="פירוט תנאי האחריות, מגבלות, או מידע חשוב נוסף"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeWarrantyDialog}>ביטול</Button>
          <Button 
            onClick={saveWarranty} 
            variant="contained"
            disabled={
              !newWarranty.warranty_provider || 
              !newWarranty.warranty_number || 
              !newWarranty.start_date || 
              !newWarranty.end_date
            }
          >
            שמירה
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ItemMaintenance;