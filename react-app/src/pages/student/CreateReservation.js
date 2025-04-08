import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, FormControl, InputLabel, Select,
  MenuItem, TextField, Button, Alert, CircularProgress, Card,
  CardContent, Divider, Chip, Tooltip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, DialogContentText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { he } from 'date-fns/locale';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import { inventoryAPI, reservationsAPI } from '../../api/api';
import { format } from 'date-fns';

function CreateReservation({ userId }) {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    item_id: '',
    quantity: 1,
    start_date: new Date(),
    end_date: new Date(new Date().setDate(new Date().getDate() + 3)),
    notes: ''
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [availabilityInfo, setAvailabilityInfo] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showExistingDialog, setShowExistingDialog] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  // טעינת פרטי משתמש וציוד זמין
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // תפיסת פרטי מידע על המשתמש מהרכיב ההורה, או מה-localStorage
        const userToken = localStorage.getItem('token');
        if (!userToken) throw new Error('לא נמצא טוקן משתמש');
        
        // טעינת פריטי מלאי זמינים
        const inventoryData = await inventoryAPI.getItems();
        const availableItems = inventoryData.filter(item => item.is_available);
        
        // חילוץ רשימת קטגוריות ייחודיות מהמלאי
        const uniqueCategories = [...new Set(availableItems.map(item => item.category))];
        
        setInventory(availableItems);
        setCategories(uniqueCategories);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
        setError('שגיאה בטעינת נתונים');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // פונקציה לבדיקת זמינות
  const checkAvailability = async () => {
    if (!formData.item_id) {
      setFormError('יש לבחור פריט');
      return;
    }

    setAvailabilityLoading(true);
    setFormError(null);
    
    try {
      const result = await reservationsAPI.checkItemAvailability(
        formData.item_id,
        format(formData.start_date, 'yyyy-MM-dd'),
        format(formData.end_date, 'yyyy-MM-dd'),
        formData.quantity
      );
      
      setAvailabilityInfo(result);
      
      if (result.existing_reservations?.length > 0) {
        setShowExistingDialog(true);
      }
    } catch (err) {
      console.error('Failed to check availability:', err);
      setFormError('שגיאה בבדיקת זמינות');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // שליחת הטופס
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.item_id) {
      setFormError('יש לבחור פריט');
      return;
    }
    
    if (!availabilityInfo || !availabilityInfo.is_available) {
      setFormError('יש לבדוק זמינות תחילה');
      return;
    }
    
    setSubmitLoading(true);
    setFormError(null);
    
    try {
      const selectedInventoryItem = inventory.find(item => item.id.toString() === formData.item_id.toString());
      
      if (!selectedInventoryItem) {
        throw new Error('פריט לא נמצא');
      }
      
      const response = await reservationsAPI.createReservation({
        item_id: formData.item_id,
        quantity: formData.quantity,
        start_date: format(formData.start_date, 'yyyy-MM-dd'),
        end_date: format(formData.end_date, 'yyyy-MM-dd'),
        notes: formData.notes,
        student_name: userInfo?.full_name || '',
        student_id: userInfo?.username || '',
        user_id: userId
      });
      
      if (response.success) {
        setFormSuccess('ההזמנה נוצרה בהצלחה!');
        
        // איפוס הטופס
        setFormData({
          item_id: '',
          quantity: 1,
          start_date: new Date(),
          end_date: new Date(new Date().setDate(new Date().getDate() + 3)),
          notes: ''
        });
        
        setSelectedItem(null);
        setAvailabilityInfo(null);
        
        // העברה לדף ההזמנות של המשתמש לאחר 2 שניות
        setTimeout(() => {
          navigate('/my-reservations');
        }, 2000);
      } else {
        setFormError(response.message || 'שגיאה ביצירת ההזמנה');
      }
    } catch (err) {
      console.error('Failed to create reservation:', err);
      setFormError('שגיאה ביצירת ההזמנה');
    } finally {
      setSubmitLoading(false);
    }
  };

  // פונקציה לעדכון בחירת פריט
  const handleItemSelection = (itemId) => {
    setFormData({
      ...formData,
      item_id: itemId,
      quantity: 1 // איפוס כמות בבחירת פריט חדש
    });
    
    const item = inventory.find(i => i.id.toString() === itemId.toString());
    setSelectedItem(item);
    setAvailabilityInfo(null); // איפוס מידע על זמינות
  };

  // פונקציה לפילטור פריטים לפי קטגוריה
  const filteredItems = selectedCategory 
    ? inventory.filter(item => item.category === selectedCategory)
    : inventory;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom align="right">
        הזמנת ציוד מראש
      </Typography>

      {formSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {formSuccess}
        </Alert>
      )}

      {formError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formError}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* בחירת קטגוריה */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>קטגוריה</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="קטגוריה"
                >
                  <MenuItem value="">
                    <em>כל הקטגוריות</em>
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* בחירת פריט */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>בחר פריט</InputLabel>
                <Select
                  value={formData.item_id}
                  onChange={(e) => handleItemSelection(e.target.value)}
                  label="בחר פריט"
                >
                  <MenuItem value="">
                    <em>בחר פריט</em>
                  </MenuItem>
                  {filteredItems.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name} (כמות כוללת: {item.quantity})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* פרטי פריט נבחר */}
            {selectedItem && (
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" component="div" gutterBottom>
                      {selectedItem.name}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          קטגוריה: {selectedItem.category}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          כמות כוללת: {selectedItem.quantity}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        {selectedItem.notes && (
                          <Typography variant="body2" color="text.secondary">
                            הערות: {selectedItem.notes}
                          </Typography>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* תאריכי הזמנה */}
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                <DatePicker
                  label="מתאריך"
                  value={formData.start_date}
                  onChange={(date) => {
                    setFormData({
                      ...formData,
                      start_date: date,
                      // אם תאריך סיום קודם לתאריך התחלה, עדכן אותו
                      end_date: formData.end_date < date ? date : formData.end_date
                    });
                    setAvailabilityInfo(null); // איפוס מידע על זמינות
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    }
                  }}
                  disablePast
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                <DatePicker
                  label="עד תאריך"
                  value={formData.end_date}
                  onChange={(date) => {
                    setFormData({
                      ...formData,
                      end_date: date
                    });
                    setAvailabilityInfo(null); // איפוס מידע על זמינות
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    }
                  }}
                  disablePast
                  minDate={formData.start_date}
                />
              </LocalizationProvider>
            </Grid>

            {/* הכמות המבוקשת */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="כמות"
                type="number"
                value={formData.quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (isNaN(value) || value < 1) return;
                  setFormData({
                    ...formData,
                    quantity: value
                  });
                  setAvailabilityInfo(null); // איפוס מידע על זמינות
                }}
                fullWidth
                required
                inputProps={{
                  min: 1,
                  max: selectedItem?.quantity || 1
                }}
              />
            </Grid>

            {/* הערות */}
            <Grid item xs={12}>
              <TextField
                label="הערות"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({
                  ...formData,
                  notes: e.target.value
                })}
                fullWidth
              />
            </Grid>

            {/* בדיקת זמינות */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Button
                  variant="outlined"
                  onClick={checkAvailability}
                  disabled={!formData.item_id || availabilityLoading}
                  startIcon={availabilityLoading ? <CircularProgress size={20} /> : null}
                >
                  בדוק זמינות
                </Button>

                {availabilityInfo && (
                  <Chip
                    label={availabilityInfo.is_available ? 'זמין להזמנה' : 'לא זמין בתאריכים אלו'}
                    color={availabilityInfo.is_available ? 'success' : 'error'}
                    icon={availabilityInfo.is_available ? <InfoIcon /> : <WarningIcon />}
                  />
                )}
              </Box>
            </Grid>

            {/* כפתורי פעולה */}
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }} />
              <Box display="flex" justifyContent="flex-end">
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={!availabilityInfo?.is_available || submitLoading}
                  startIcon={submitLoading ? <CircularProgress size={20} /> : null}
                >
                  שלח בקשת הזמנה
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* דיאלוג הצגת הזמנות קיימות */}
      <Dialog
        open={showExistingDialog}
        onClose={() => setShowExistingDialog(false)}
      >
        <DialogTitle>הזמנות קיימות בתאריכים אלו</DialogTitle>
        <DialogContent>
          <DialogContentText>
            קיימות הזמנות אחרות לפריט זה בתאריכים המבוקשים:
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            {availabilityInfo?.existing_reservations?.map((res, index) => (
              <Paper key={index} sx={{ p: 2, mb: 1 }}>
                <Typography variant="body2">
                  מתאריך: {res.start_date}<br />
                  עד תאריך: {res.end_date}<br />
                  כמות: {res.quantity}<br />
                  סטודנט: {res.student_name}<br />
                  סטטוס: <Chip 
                    size="small" 
                    label={res.status === 'approved' ? 'מאושר' : 'ממתין לאישור'} 
                    color={res.status === 'approved' ? 'success' : 'warning'}
                    sx={{ ml: 1 }} 
                  />
                </Typography>
              </Paper>
            ))}
          </Box>
          <Typography variant="body1" sx={{ mt: 2 }}>
            כמות זמינה בתאריכים אלו: {availabilityInfo?.item?.available_quantity || 0}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExistingDialog(false)}>סגור</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CreateReservation;