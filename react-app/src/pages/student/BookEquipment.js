import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Button,
  TextField,
  Grid,
  Alert,
  MenuItem,
  Snackbar,
  LinearProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { inventoryAPI, reservationsAPI } from '../../api/api';

function BookEquipment({ userId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [reservation, setReservation] = useState({
    itemId: '',
    quantity: 1,
    startDate: new Date(),
    endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // שבוע מהיום
    notes: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.getAll();
      // סינון רק פריטים זמינים
      const availableItems = response.data.filter(item => item.is_available && item.quantity > 0);
      setItems(availableItems);
      setError('');
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('שגיאה בטעינת נתוני המלאי');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReservation({
      ...reservation,
      [name]: name === 'quantity' ? parseInt(value, 10) || 1 : value
    });
  };

  const handleStartDateChange = (date) => {
    setReservation({
      ...reservation,
      startDate: date,
      // אם תאריך הסיום מוקדם מתאריך ההתחלה, עדכן אותו
      endDate: date > reservation.endDate ? new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000) : reservation.endDate
    });
  };

  const handleEndDateChange = (date) => {
    setReservation({
      ...reservation,
      endDate: date
    });
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateStep1()) {
      return;
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const validateStep1 = () => {
    if (!reservation.itemId) {
      setError('יש לבחור פריט');
      return false;
    }
    
    if (reservation.quantity < 1) {
      setError('הכמות חייבת להיות לפחות 1');
      return false;
    }
    
    const selectedItem = items.find(item => item.id === reservation.itemId);
    if (selectedItem && reservation.quantity > selectedItem.quantity) {
      setError(`הכמות המבוקשת גדולה מהכמות הזמינה (${selectedItem.quantity})`);
      return false;
    }
    
    // בדיקת תאריכים
    if (reservation.startDate >= reservation.endDate) {
      setError('תאריך הסיום חייב להיות מאוחר מתאריך ההתחלה');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!userId) {
      setError('משתמש לא מזוהה, יש להתחבר מחדש');
      return;
    }
    
    try {
      setLoading(true);
      
      const selectedItem = items.find(item => item.id === reservation.itemId);
      
      // בניית אובייקט ההזמנה
      const reservationData = {
        itemId: reservation.itemId,
        studentName: '', // יתמלא על ידי השרת מפרטי המשתמש
        studentId: '', // יתמלא על ידי השרת מפרטי המשתמש
        quantity: reservation.quantity,
        startDate: reservation.startDate.toISOString(),
        endDate: reservation.endDate.toISOFormat(),
        userId: userId,
        notes: reservation.notes,
        status: 'pending'
      };
      
      // שליחת ההזמנה לשרת
      await reservationsAPI.create(reservationData);
      
      // איפוס טופס ההזמנה והצגת הודעת הצלחה
      setReservation({
        itemId: '',
        quantity: 1,
        startDate: new Date(),
        endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        notes: ''
      });
      
      setSnackbar({
        open: true,
        message: 'ההזמנה נשלחה בהצלחה וממתינה לאישור',
        severity: 'success'
      });
      
      // חזרה לשלב הראשון
      setActiveStep(0);
      
    } catch (err) {
      console.error('Error creating reservation:', err);
      setError('שגיאה ביצירת ההזמנה');
      setSnackbar({
        open: true,
        message: 'שגיאה ביצירת ההזמנה',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const steps = ['בחירת פריט', 'מידע נוסף', 'סיכום'];

  const selectedItem = items.find(item => item.id === reservation.itemId);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: 'bold', color: '#373B5C' }}>
          הזמנת ציוד
        </Typography>
        <Typography variant="body1" sx={{ color: '#9197B3' }}>
          מילוי טופס להזמנת ציוד חדש
        </Typography>
      </Box>
      
      <Paper sx={{ p: 4, mb: 4, borderRadius: 2, border: '1px solid #CECECE' }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {loading && <LinearProgress sx={{ mb: 3 }} />}
        
        {/* שלב 1: בחירת פריט */}
        {activeStep === 0 && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  select
                  name="itemId"
                  label="בחר פריט"
                  fullWidth
                  value={reservation.itemId}
                  onChange={handleInputChange}
                  sx={{ direction: 'rtl' }}
                >
                  {items.map(item => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name} (כמות זמינה: {item.quantity})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="כמות מבוקשת"
                  name="quantity"
                  type="number"
                  fullWidth
                  value={reservation.quantity}
                  onChange={handleInputChange}
                  inputProps={{ min: 1, max: selectedItem ? selectedItem.quantity : 1 }}
                  sx={{ direction: 'rtl' }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="מתאריך"
                    value={reservation.startDate}
                    onChange={handleStartDateChange}
                    minDate={new Date()}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth sx={{ direction: 'rtl' }} />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="עד תאריך"
                    value={reservation.endDate}
                    onChange={handleEndDateChange}
                    minDate={reservation.startDate}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth sx={{ direction: 'rtl' }} />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {/* שלב 2: מידע נוסף */}
        {activeStep === 1 && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="הערות להזמנה"
                  name="notes"
                  multiline
                  rows={4}
                  fullWidth
                  value={reservation.notes}
                  onChange={handleInputChange}
                  sx={{ direction: 'rtl' }}
                  placeholder="פרט את מטרת ההזמנה, דרישות מיוחדות או מידע נוסף שיעזור לצוות המחסן"
                />
              </Grid>
            </Grid>
          </Box>
        )}
        
        {/* שלב 3: סיכום */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              סיכום ההזמנה
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={4} sx={{ fontWeight: 'bold' }}>פריט:</Grid>
              <Grid item xs={8}>{selectedItem ? selectedItem.name : ''}</Grid>
              
              <Grid item xs={4} sx={{ fontWeight: 'bold' }}>כמות:</Grid>
              <Grid item xs={8}>{reservation.quantity}</Grid>
              
              <Grid item xs={4} sx={{ fontWeight: 'bold' }}>תאריך התחלה:</Grid>
              <Grid item xs={8}>{reservation.startDate.toLocaleDateString('he-IL')}</Grid>
              
              <Grid item xs={4} sx={{ fontWeight: 'bold' }}>תאריך סיום:</Grid>
              <Grid item xs={8}>{reservation.endDate.toLocaleDateString('he-IL')}</Grid>
              
              <Grid item xs={4} sx={{ fontWeight: 'bold' }}>הערות:</Grid>
              <Grid item xs={8}>{reservation.notes || 'אין'}</Grid>
            </Grid>
            
            <Alert severity="info" sx={{ mt: 3 }}>
              ההזמנה תישלח לאישור צוות המחסן. תקבל הודעה כאשר ההזמנה תאושר.
            </Alert>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            color="inherit"
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            חזרה
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              שלח הזמנה
            </Button>
          ) : (
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleNext}
            >
              המשך
            </Button>
          )}
        </Box>
      </Paper>
      
      {/* הודעות מערכת */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default BookEquipment;
