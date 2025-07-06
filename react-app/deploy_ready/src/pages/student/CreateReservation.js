import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField, 
  Button, 
  Grid, 
  Paper, 
  CircularProgress, 
  Alert,
  Chip,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Autocomplete,
  Checkbox,
  ListItemText,
  Stack,
  useTheme
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { reservationsAPI, inventoryAPI } from '../../api/api';
import { format } from 'date-fns';
import he from 'date-fns/locale/he';

// אייקונים לתיבת סימון
const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

function CreateReservation({ userId }) {
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [formData, setFormData] = useState({
    start_date: new Date(),
    end_date: new Date(new Date().setDate(new Date().getDate() + 3)),
    notes: ''
  });
  const [availabilityInfo, setAvailabilityInfo] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showExistingDialog, setShowExistingDialog] = useState(false);

  // פילטור פריטים לפי קטגוריה
  const filteredItems = useMemo(() => {
    return selectedCategory 
      ? inventory.filter(item => item.category === selectedCategory)
      : inventory;
  }, [inventory, selectedCategory]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("Trying to fetch inventory items...");
        console.log("Fetching inventory from API...");
        const response = await inventoryAPI.getInventory();
        console.log("Inventory response received:", response);

        if (response && Array.isArray(response)) {
          console.log("Inventory data received:", response);
          setInventory(response);
          
          // קטגוריות יחודיות
          const uniqueCategories = [...new Set(response.map(item => item.category))].filter(Boolean).sort();
          setCategories(uniqueCategories);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError('אירעה שגיאה בטעינת הנתונים');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

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
    <Box sx={{ width: '100%', mb: 4 }}>
      <Paper elevation={0} sx={{ 
        p: 0,
        mb: 3, 
        bgcolor: '#f8f9fa',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          p: 2, 
          bgcolor: '#1E2875', 
          color: 'white',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <Typography variant="h5" component="h1" gutterBottom align="right" sx={{ fontWeight: 'bold' }}>
            הזמנת ציוד מראש
          </Typography>
          <Typography variant="body2" align="right">
            בחר את הפריטים הדרושים לך ותאריכי השאלה
          </Typography>
        </Box>

        {formSuccess && (
          <Alert severity="success" sx={{ m: 2 }}>
            {formSuccess}
          </Alert>
        )}

        {formError && (
          <Alert severity="error" sx={{ m: 2 }}>
            {formError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* בחירת קטגוריה */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="category-label">קטגוריה</InputLabel>
                <Select
                  labelId="category-label"
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

            {/* בחירת פריטים - כאן אנחנו משתמשים ב-Autocomplete במקום Select למראה מודרני ופונקציונלי יותר */}
            <Grid item xs={12}>
              <Autocomplete
                multiple
                id="equipment-select"
                options={filteredItems}
                getOptionLabel={(option) => option.name}
                value={selectedItems}
                onChange={(event, newValue) => {
                  console.log("Selected items:", newValue);
                  setSelectedItems(newValue);
                  if (newValue.length > 0) {
                    setSelectedItem(newValue[0]);
                  } else {
                    setSelectedItem(null);
                  }
                  setAvailabilityInfo(null);
                }}
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Checkbox
                      icon={icon}
                      checkedIcon={checkedIcon}
                      style={{ marginRight: 8 }}
                      checked={selected}
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        קטגוריה: {option.category} | כמות זמינה: {option.quantity}
                      </Typography>
                    </Box>
                  </li>
                )}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id}
                      label={option.name}
                      sx={{ 
                        bgcolor: '#e3f2fd',
                        fontWeight: 500,
                        '& .MuiChip-deleteIcon': {
                          color: '#1e88e5'
                        }
                      }}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="בחר פריטים"
                    placeholder={selectedItems.length === 0 ? "חפש פריטים..." : ""}
                    required
                    fullWidth
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                disableCloseOnSelect
              />
            </Grid>

            {/* תאריכי הזמנה */}
            <Grid item xs={12} sm={6}>
              <Card variant="outlined" sx={{ 
                bgcolor: 'white', 
                borderColor: '#e0e0e0',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <CardContent>
                  <Typography variant="h6" component="div" gutterBottom sx={{ fontWeight: 500 }}>
                    תאריכי השאלה
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                      <Stack spacing={3}>
                        <DatePicker
                          label="מתאריך"
                          value={formData.start_date}
                          onChange={(date) => {
                            setFormData({
                              ...formData,
                              start_date: date,
                              end_date: formData.end_date < date ? date : formData.end_date
                            });
                            setAvailabilityInfo(null);
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              required: true,
                              variant: 'outlined'
                            }
                          }}
                          disablePast
                        />
                        <DatePicker
                          label="עד תאריך"
                          value={formData.end_date}
                          onChange={(date) => {
                            setFormData({
                              ...formData,
                              end_date: date
                            });
                            setAvailabilityInfo(null);
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              required: true,
                              variant: 'outlined'
                            }
                          }}
                          disablePast
                          minDate={formData.start_date}
                        />
                      </Stack>
                    </LocalizationProvider>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* הסבר על הכמות בהזמנה מרובה */}
            <Grid item xs={12} sm={6}>
              <Card variant="outlined" sx={{ 
                bgcolor: 'white', 
                borderColor: '#e0e0e0',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" component="div" gutterBottom sx={{ fontWeight: 500 }}>
                    מידע על הזמנת פריטים מרובים
                  </Typography>
                  <Box sx={{ mt: 2, flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      בהזמנה מרובה של פריטים, יוזמן פריט אחד מכל סוג שנבחר.
                      <br /><br />
                      ניתן להזמין מספר פריטים מאותו סוג על ידי יצירת הזמנה נוספת.
                      <br /><br />
                      פריטים שאינם זמינים בתאריכים המבוקשים יסומנו בהתאם.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
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
                variant="outlined"
                sx={{ bgcolor: 'white' }}
              />
            </Grid>

            {/* רשימת פריטים נבחרים */}
            {selectedItems.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" component="div" gutterBottom align="right" sx={{ fontWeight: 500, mt: 2 }}>
                  פריטים נבחרים ({selectedItems.length})
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'white', 
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}>
                  <Grid container spacing={2}>
                    {selectedItems.map((item) => (
                      <Grid item xs={12} sm={6} md={4} key={item.id}>
                        <Card elevation={0} sx={{ 
                          p: 1, 
                          bgcolor: '#f3f6f9',
                          border: '1px solid #e0e0e0',
                          transition: 'all 0.2s',
                          '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }
                        }}>
                          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                            <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500 }}>
                              {item.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              קטגוריה: {item.category}
                            </Typography>
                            {item.notes && (
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                הערות: {item.notes}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Grid>
            )}

            {/* בדיקת זמינות */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Button
                  variant="outlined"
                  onClick={checkAvailability}
                  disabled={selectedItems.length === 0 || availabilityLoading}
                  sx={{ 
                    bgcolor: 'white',
                    border: '1px solid #1E2875',
                    color: '#1E2875',
                    '&:hover': {
                      bgcolor: '#f0f4ff',
                      borderColor: '#1E2875',
                    }
                  }}
                  startIcon={availabilityLoading ? <CircularProgress size={20} /> : <InfoIcon />}
                >
                  בדוק זמינות פריטים
                </Button>

                {availabilityInfo && (
                  <Chip
                    label={availabilityInfo.is_available ? 'כל הפריטים זמינים להזמנה' : 'חלק מהפריטים אינם זמינים'}
                    color={availabilityInfo.is_available ? 'success' : 'error'}
                    icon={availabilityInfo.is_available ? <InfoIcon /> : <WarningIcon />}
                    sx={{ fontWeight: 500 }}
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
                  sx={{ 
                    bgcolor: '#1E2875',
                    '&:hover': {
                      bgcolor: '#161d52',
                    }
                  }}
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
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: '8px' }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
          הזמנות קיימות בתאריכים אלו
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText>
            קיימות הזמנות אחרות לפריטים אלו בתאריכים המבוקשים:
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            {availabilityInfo?.existing_reservations?.map((res, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
                  פריט: {res.item_name || 'לא צוין'}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      מתאריך: {res.start_date}<br />
                      עד תאריך: {res.end_date}<br />
                      כמות: {res.quantity}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      סטודנט: {res.student_name}<br />
                      סטטוס: <Chip 
                        size="small" 
                        label={res.status === 'approved' ? 'מאושר' : 'ממתין לאישור'} 
                        color={res.status === 'approved' ? 'success' : 'warning'}
                        sx={{ ml: 1 }} 
                      />
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Box>
          
          {/* סיכום זמינות */}
          {availabilityInfo?.items && availabilityInfo.items.length > 0 && (
            <Box sx={{ mt: 3, p: 3, bgcolor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                סיכום זמינות פריטים
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {availabilityInfo.items.map((item, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      p: 1,
                      borderRadius: '4px',
                      border: '1px solid',
                      borderColor: item.available_quantity > 0 ? '#c8e6c9' : '#ffcdd2',
                      bgcolor: item.available_quantity > 0 ? '#f1f8e9' : '#ffebee',
                    }}>
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {item.name}
                      </Typography>
                      <Chip 
                        size="small" 
                        label={item.available_quantity > 0 ? 'זמין' : 'לא זמין'} 
                        color={item.available_quantity > 0 ? 'success' : 'error'}
                        sx={{ ml: 1 }} 
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button 
            onClick={() => setShowExistingDialog(false)}
            variant="outlined"
            sx={{ mr: 1 }}
          >
            סגור
          </Button>
          <Button 
            onClick={() => setShowExistingDialog(false)}
            variant="contained"
            color="primary"
            sx={{ 
              bgcolor: '#1E2875',
              '&:hover': {
                bgcolor: '#161d52',
              }
            }}
          >
            הבנתי
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CreateReservation;