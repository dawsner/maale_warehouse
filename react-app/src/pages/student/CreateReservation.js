import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, FormControl, InputLabel, Select,
  MenuItem, TextField, Button, Alert, CircularProgress, Card,
  CardContent, Divider, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, DialogContentText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import he from 'date-fns/locale/he';
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
    start_date: new Date(),
    end_date: new Date(new Date().setDate(new Date().getDate() + 3)),
    notes: ''
  });
  const [selectedItems, setSelectedItems] = useState([]);  // מערך של פריטים נבחרים
  const [selectedItem, setSelectedItem] = useState(null);  // נשמר לתאימות עם קוד קיים
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

  // פונקציה לעדכון בחירת מספר פריטים
  const handleMultiItemSelection = (itemIds) => {
    // מוצאים את כל הפריטים שנבחרו
    const items = itemIds.map(id => inventory.find(item => item.id === id)).filter(Boolean);
    setSelectedItems(items);
    
    // אם יש פריט אחד לפחות, מעדכנים גם את selectedItem לתאימות עם קוד קיים
    if (items.length > 0) {
      setSelectedItem(items[0]);
    } else {
      setSelectedItem(null);
    }
    
    setAvailabilityInfo(null); // איפוס מידע על זמינות
  };

  // פונקציה לבדיקת זמינות
  const checkAvailability = async () => {
    if (selectedItems.length === 0) {
      setFormError('יש לבחור לפחות פריט אחד');
      return;
    }

    setAvailabilityLoading(true);
    setFormError(null);
    
    try {
      // בדיקת זמינות לכל הפריטים שנבחרו
      const availabilityPromises = selectedItems.map(item => 
        reservationsAPI.checkItemAvailability(
          item.id,
          format(formData.start_date, 'yyyy-MM-dd'),
          format(formData.end_date, 'yyyy-MM-dd'),
          1 // כמות בסיסית של פריט אחד מכל סוג
        )
      );
      
      const results = await Promise.all(availabilityPromises);
      
      // בודקים אם כל הפריטים זמינים
      const allAvailable = results.every(result => result.is_available);
      
      // אוסף הזמנות קיימות מכל הבדיקות
      const existingReservations = results.flatMap(result => result.existing_reservations || []);
      
      // יצירת אובייקט תוצאה משולב
      const combinedResult = {
        is_available: allAvailable,
        existing_reservations: existingReservations,
        items: results.map((result, index) => ({
          ...result.item,
          name: selectedItems[index].name,
          id: selectedItems[index].id
        }))
      };
      
      setAvailabilityInfo(combinedResult);
      
      if (existingReservations.length > 0) {
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
    
    if (selectedItems.length === 0) {
      setFormError('יש לבחור לפחות פריט אחד');
      return;
    }
    
    if (!availabilityInfo || !availabilityInfo.is_available) {
      setFormError('יש לבדוק זמינות תחילה');
      return;
    }
    
    setSubmitLoading(true);
    setFormError(null);
    
    try {
      // יצירת הזמנות עבור כל פריט שנבחר
      const reservationPromises = selectedItems.map(item => 
        reservationsAPI.createReservation({
          item_id: item.id,
          quantity: 1, // כל פריט בכמות של אחד
          start_date: format(formData.start_date, 'yyyy-MM-dd'),
          end_date: format(formData.end_date, 'yyyy-MM-dd'),
          notes: formData.notes,
          student_name: localStorage.getItem('user_fullname') || '',
          student_id: localStorage.getItem('username') || '',
          user_id: userId
        })
      );
      
      const responses = await Promise.all(reservationPromises);
      
      // בודקים אם כל ההזמנות נוצרו בהצלחה
      const allSuccessful = responses.every(response => response.success);
      
      if (allSuccessful) {
        setFormSuccess('ההזמנות נוצרו בהצלחה!');
        
        // איפוס הטופס
        setFormData({
          start_date: new Date(),
          end_date: new Date(new Date().setDate(new Date().getDate() + 3)),
          notes: ''
        });
        
        setSelectedItems([]);
        setSelectedItem(null);
        setAvailabilityInfo(null);
        
        // העברה לדף ההזמנות של המשתמש לאחר 2 שניות
        setTimeout(() => {
          navigate('/my-reservations');
        }, 2000);
      } else {
        setFormError('חלק מההזמנות לא נוצרו בהצלחה');
      }
    } catch (err) {
      console.error('Failed to create reservations:', err);
      setFormError('שגיאה ביצירת ההזמנות');
    } finally {
      setSubmitLoading(false);
    }
  };
  
  // פונקציה ישנה לתאימות - לא בשימוש יותר
  const handleItemSelection = (itemId) => {
    const item = inventory.find(i => i.id.toString() === itemId.toString());
    if (item) {
      setSelectedItems([item]);
      setSelectedItem(item);
    }
    setAvailabilityInfo(null);
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

            {/* בחירת פריטים (תמיכה בבחירה מרובה) */}
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>בחר פריטים</InputLabel>
                <Select
                  multiple
                  value={selectedItems.map(item => item.id)}
                  onChange={(e) => handleMultiItemSelection(e.target.value)}
                  label="בחר פריטים"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((itemId) => {
                        const item = inventory.find(i => i.id === itemId);
                        return (
                          <Chip key={itemId} label={item ? item.name : 'פריט'} size="small" />
                        );
                      })}
                    </Box>
                  )}
                >
                  {filteredItems.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{item.name}</span>
                        <span style={{ color: 'gray' }}>כמות זמינה: {item.quantity}</span>
                      </Box>
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

            {/* הסבר על הכמות בהזמנה מרובה */}
            <Grid item xs={12} sm={6}>
              <Box
                sx={{ 
                  p: 2, 
                  border: '1px solid rgba(0, 0, 0, 0.12)', 
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  בהזמנה מרובה של פריטים, יוזמן פריט אחד מכל סוג שנבחר.
                  <br />
                  ניתן להזמין מספר פריטים מאותו סוג על ידי יצירת הזמנה נוספת.
                </Typography>
              </Box>
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
                  disabled={selectedItems.length === 0 || availabilityLoading}
                  startIcon={availabilityLoading ? <CircularProgress size={20} /> : null}
                >
                  בדוק זמינות פריטים
                </Button>

                {availabilityInfo && (
                  <Chip
                    label={availabilityInfo.is_available ? 'כל הפריטים זמינים להזמנה' : 'חלק מהפריטים אינם זמינים'}
                    color={availabilityInfo.is_available ? 'success' : 'error'}
                    icon={availabilityInfo.is_available ? <InfoIcon /> : <WarningIcon />}
                  />
                )}
              </Box>
            </Grid>
            
            {/* רשימת פריטים נבחרים */}
            {selectedItems.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" component="div" gutterBottom align="right">
                  פריטים נבחרים ({selectedItems.length})
                </Typography>
                <Grid container spacing={2}>
                  {selectedItems.map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" component="div">
                            {item.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            קטגוריה: {item.category}
                          </Typography>
                          {item.notes && (
                            <Typography variant="body2" color="text.secondary">
                              הערות: {item.notes}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}

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
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>הזמנות קיימות בתאריכים אלו</DialogTitle>
        <DialogContent>
          <DialogContentText>
            קיימות הזמנות אחרות לפריטים אלו בתאריכים המבוקשים:
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            {availabilityInfo?.existing_reservations?.map((res, index) => (
              <Paper key={index} sx={{ p: 2, mb: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>פריט: {res.item_name || 'לא צוין'}</strong>
                </Typography>
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
          
          {/* סיכום זמינות */}
          {availabilityInfo?.items && availabilityInfo.items.length > 0 && (
            <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                סיכום זמינות פריטים
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {availabilityInfo.items.map((item, index) => (
                <Typography key={index} variant="body1" gutterBottom>
                  {item.name}: {item.available_quantity > 0 ? (
                    <Chip size="small" label="זמין" color="success" />
                  ) : (
                    <Chip size="small" label="לא זמין" color="error" />
                  )}
                </Typography>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExistingDialog(false)}>סגור</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CreateReservation;