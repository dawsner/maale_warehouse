import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Container, Typography, Paper, Stepper, Step, StepLabel, 
  Button, Grid, Card, CardContent, CardMedia, CardActionArea, 
  TextField, Alert, CircularProgress, Chip, Divider, 
  List, ListItem, ListItemText, ListItemIcon, Checkbox, 
  FormControlLabel, Switch, Stack, Snackbar, FormHelperText,
  IconButton, TableContainer, Table
} from '@mui/material';
import { 
  CameraAlt as CameraIcon, 
  Mic as MicIcon, 
  Highlight as LightIcon, 
  Construction as GripIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  AddCircle as AddIcon,
  ArrowBack as BackIcon,
  KeyboardArrowLeft as LeftIcon,
  KeyboardArrowRight as RightIcon,
  EventNote as EventNoteIcon
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import { inventoryAPI, reservationsAPI } from '../../api/api';

// תבניות הפקה מוגדרות מראש
const PRODUCTION_TEMPLATES = {
  CAMERA: {
    id: 'camera',
    name: 'מערך מצלמה וינטג\'',
    description: 'ציוד מצלמה מיוחד לצילומים בסגנון וינטג\'',
    icon: <CameraIcon fontSize="large" sx={{ color: '#1E2875' }} />,
    categories: ['מצלמה', 'עדשות', 'פילטרים', 'מייצב'],
    recommendedCombinations: [
      { 
        name: 'מערך בסיסי', 
        items: ['מצלמת פילם אנלוגית', 'עדשת 50mm', 'מעמד תלת רגלי'] 
      },
      { 
        name: 'מערך מורחב', 
        items: ['מצלמת פילם אנלוגית', 'עדשת 50mm', 'עדשת 85mm', 'מעמד תלת רגלי', 'מייצב ידני'] 
      }
    ]
  },
  SOUND: {
    id: 'sound',
    name: 'מערך סאונד וינטג\'',
    description: 'ציוד הקלטת סאונד לסגנון וינטג\'',
    icon: <MicIcon fontSize="large" sx={{ color: '#1E2875' }} />,
    categories: ['מיקרופונים', 'הקלטה', 'אביזרי סאונד'],
    recommendedCombinations: [
      { 
        name: 'מערך בסיסי', 
        items: ['מיקרופון דינמי קלאסי', 'מקליט אנלוגי', 'חצובה למיקרופון'] 
      },
      { 
        name: 'מערך מורחב', 
        items: ['מיקרופון דינמי קלאסי', 'מיקרופון סרט', 'מקליט אנלוגי', 'חצובה למיקרופון', 'מגן רוח'] 
      }
    ]
  },
  LIGHTING: {
    id: 'lighting',
    name: 'מערך תאורה וינטג\'',
    description: 'פתרונות תאורה ליצירת מראה וינטג\'',
    icon: <LightIcon fontSize="large" sx={{ color: '#1E2875' }} />,
    categories: ['מנורות', 'פנסים', 'מסננים', 'מחזירי אור'],
    recommendedCombinations: [
      { 
        name: 'מערך בסיסי', 
        items: ['פנס לד עם מסנן צהוב', 'מחזיר אור זהוב', 'חצובת תאורה'] 
      },
      { 
        name: 'מערך מורחב', 
        items: ['פנס לד עם מסנן צהוב', 'פנס טנגסטן', 'מחזיר אור זהוב', 'מסנן מפזר אור', 'חצובת תאורה'] 
      }
    ]
  },
  GRIP: {
    id: 'grip',
    name: 'מערך גריפ וינטג\'',
    description: 'ציוד גריפ ואביזרים עבור סגנון וינטג\'',
    icon: <GripIcon fontSize="large" sx={{ color: '#1E2875' }} />,
    categories: ['חצובות', 'מסילות', 'תומכים', 'אביזרי מצלמה נוספים'],
    recommendedCombinations: [
      { 
        name: 'מערך בסיסי', 
        items: ['מסילה למצלמה', 'תומך כתף וינטג\'', 'פלטפורמה למצלמה'] 
      },
      { 
        name: 'מערך מורחב', 
        items: ['מסילה למצלמה', 'תומך כתף וינטג\'', 'פלטפורמה למצלמה', 'זרוע גמישה', 'מעמד Dolly'] 
      }
    ]
  }
};

// מיפוי קטגוריות לשדות בבסיס הנתונים
const CATEGORY_MAPPING = {
  'מצלמה': ['מצלמה', 'מצלמות', 'אביזרי מצלמה', 'אביזרי מצלמה נוספים'],
  'עדשות': ['עדשות', 'עדשה'],
  'פילטרים': ['פילטרים', 'מסננים', 'פילטר'],
  'מייצב': ['מייצב', 'מייצבים', 'אביזרי מצלמה נוספים'],
  'מיקרופונים': ['מיקרופון', 'מיקרופונים', 'סאונד'],
  'הקלטה': ['הקלטה', 'מקליט', 'מכשירי הקלטה', 'סאונד'],
  'אביזרי סאונד': ['אביזרי סאונד', 'ציוד סאונד', 'סאונד'],
  'מנורות': ['תאורה', 'מנורות', 'פנסים'],
  'פנסים': ['תאורה', 'פנסים'],
  'מסננים': ['פילטרים', 'מסננים', 'אביזרי תאורה'],
  'מחזירי אור': ['מחזיר אור', 'רפלקטור', 'אביזרי תאורה'],
  'חצובות': ['חצובה', 'חצובות', 'אביזרי מצלמה נוספים'],
  'מסילות': ['מסילה', 'מסילות', 'גריפ'],
  'תומכים': ['תומך', 'תומכים', 'גריפ', 'אביזרי מצלמה נוספים'],
};

function VintageOrderWizard({ userId }) {
  const navigate = useNavigate();
  
  // State
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [formData, setFormData] = useState({
    start_date: new Date(),
    end_date: new Date(new Date().setDate(new Date().getDate() + 3)),
    student_name: '',
    student_id: '',
    notes: ''
  });
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [currentBundle, setCurrentBundle] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [availabilityInfo, setAvailabilityInfo] = useState({});

  // שלבי האשף
  const steps = ['בחירת תבנית', 'בחירת פריטים', 'פרטי הזמנה', 'סיכום'];

  // טעינת המלאי בעת טעינת הדף
  useEffect(() => {
    console.log('VintageOrderWizard: טעינת המלאי');
    fetchInventory();
  }, []);

  // פונקציה לטעינת המלאי
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.getAll();
      // סינון פריטים זמינים (לא משנה אם is_available הוא true או false, רק שיש כמות זמינה)
      const availableItems = response.filter(item => item.quantity > 0);
      console.log(`נמצאו ${availableItems.length} פריטים זמינים מתוך ${response.length} סך הכל`);
      setInventory(availableItems);
      setError(null);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('שגיאה בטעינת נתוני המלאי');
    } finally {
      setLoading(false);
    }
  };

  // סינון פריטים לפי קטגוריות של התבנית הנבחרת
  const filteredItems = useMemo(() => {
    if (!selectedTemplate || !inventory.length) return [];
    
    // הקטגוריות של התבנית הנבחרת
    const templateCategories = PRODUCTION_TEMPLATES[selectedTemplate].categories;
    
    // מיפוי הקטגוריות למערכים של קטגוריות תואמות בבסיס הנתונים
    const mappedCategories = templateCategories.flatMap(
      category => CATEGORY_MAPPING[category] || []
    );
    
    // סינון המלאי לפי הקטגוריות המתאימות
    return inventory.filter(item => 
      mappedCategories.some(category => 
        item.category.includes(category) || category.includes(item.category)
      )
    );
  }, [selectedTemplate, inventory]);
  
  // הפריטים שהומלצו על ידי המערכת
  const recommendedItems = useMemo(() => {
    if (!selectedTemplate || !currentBundle || !inventory.length) return [];
    
    const template = PRODUCTION_TEMPLATES[selectedTemplate];
    const recommendedNames = template.recommendedCombinations
      .find(combo => combo.name === currentBundle)?.items || [];
      
    // חיפוש פריטים תואמים במלאי
    return inventory.filter(item => 
      recommendedNames.some(recName => 
        item.name.includes(recName) || recName.includes(item.name)
      )
    );
  }, [selectedTemplate, currentBundle, inventory]);

  // בדיקת זמינות של פריט בתאריכים הנבחרים
  const checkItemAvailability = async (itemId) => {
    try {
      const start = formData.start_date.toISOString().split('T')[0];
      const end = formData.end_date.toISOString().split('T')[0];
      
      const result = await reservationsAPI.checkAvailability({
        item_id: itemId,
        start_date: start,
        end_date: end,
        quantity: 1
      });
      
      return result;
    } catch (error) {
      console.error('Error checking availability:', error);
      return { available: false, error: 'שגיאה בבדיקת זמינות הפריט' };
    }
  };

  // בדיקת זמינות לכל הפריטים שנבחרו
  const checkAllItemsAvailability = async () => {
    if (selectedItems.length === 0) return;
    
    setLoading(true);
    try {
      const availabilityPromises = selectedItems.map(item => 
        checkItemAvailability(item.id)
      );
      
      const results = await Promise.all(availabilityPromises);
      
      // עדכון אובייקט הזמינות עם התוצאות
      const newAvailabilityInfo = {};
      selectedItems.forEach((item, index) => {
        newAvailabilityInfo[item.id] = results[index];
      });
      
      setAvailabilityInfo(newAvailabilityInfo);
    } catch (error) {
      console.error('Error checking all items availability:', error);
      setError('שגיאה בבדיקת זמינות הפריטים');
    } finally {
      setLoading(false);
    }
  };

  // טעינת זמינות כאשר משתנים התאריכים או הפריטים שנבחרו
  useEffect(() => {
    if (activeStep === 2 && selectedItems.length > 0) {
      checkAllItemsAvailability();
    }
  }, [formData.start_date, formData.end_date, activeStep]);

  // טיפול בשינוי שלב
  const handleNext = () => {
    if (activeStep === 2) {
      checkAllItemsAvailability();
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // טיפול בבחירת תבנית
  const handleTemplateSelect = (templateKey) => {
    setSelectedTemplate(templateKey);
    
    // בחירת החבילה המומלצת הראשונה כברירת מחדל
    const template = PRODUCTION_TEMPLATES[templateKey];
    if (template.recommendedCombinations.length > 0) {
      setCurrentBundle(template.recommendedCombinations[0].name);
    }
    
    // מעבר לשלב הבא
    handleNext();
  };

  // טיפול בבחירת חבילה מומלצת
  const handleBundleSelect = (bundleName) => {
    setCurrentBundle(bundleName);
    
    // מציאת פריטים תואמים
    const template = PRODUCTION_TEMPLATES[selectedTemplate];
    const recommendedNames = template.recommendedCombinations
      .find(combo => combo.name === bundleName)?.items || [];
      
    // ניקוי הבחירה הקודמת
    setSelectedItems([]);
    
    // סינון פריטים תואמים מהמלאי
    const matchingItems = inventory.filter(item => 
      recommendedNames.some(recName => 
        item.name.includes(recName) || recName.includes(item.name)
      )
    );
    
    // עדכון הפריטים שנבחרו
    setSelectedItems(matchingItems);
  };

  // טיפול בבחירת פריט
  const handleItemSelect = (item) => {
    const isItemSelected = selectedItems.some(selectedItem => selectedItem.id === item.id);
    
    if (isItemSelected) {
      // הסרת הפריט אם הוא כבר נבחר
      setSelectedItems(selectedItems.filter(selectedItem => selectedItem.id !== item.id));
    } else {
      // הוספת הפריט לרשימת הפריטים שנבחרו
      setSelectedItems([...selectedItems, item]);
    }
  };

  // טיפול בשינוי שדות הטופס
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // שליחת הטופס
  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      setSnackbar({
        open: true,
        message: 'יש לבחור לפחות פריט אחד',
        severity: 'error'
      });
      return;
    }
    
    if (!formData.student_name || !formData.student_id) {
      setSnackbar({
        open: true,
        message: 'יש למלא את כל שדות החובה',
        severity: 'error'
      });
      return;
    }
    
    setSubmitLoading(true);
    try {
      // יצירת מערך הבטחות של יצירת הזמנות עבור כל פריט
      const reservationPromises = selectedItems.map(item => {
        return reservationsAPI.createReservation({
          item_id: item.id,
          student_name: formData.student_name,
          student_id: formData.student_id,
          quantity: 1,
          start_date: formData.start_date.toISOString().split('T')[0],
          end_date: formData.end_date.toISOString().split('T')[0],
          user_id: userId,
          notes: `${formData.notes} [וינטג' סט: ${PRODUCTION_TEMPLATES[selectedTemplate].name}]`
        });
      });
      
      // המתנה להשלמת כל ההזמנות
      const results = await Promise.all(reservationPromises);
      
      // בדיקה שכל ההזמנות הצליחו
      const allSuccessful = results.every(result => result.success);
      
      if (allSuccessful) {
        setSnackbar({
          open: true,
          message: 'ההזמנה נוצרה בהצלחה!',
          severity: 'success'
        });
        
        // מעבר לדף ההזמנות של המשתמש אחרי 2 שניות
        setTimeout(() => {
          navigate('/my-reservations');
        }, 2000);
      } else {
        throw new Error('לא כל ההזמנות הושלמו בהצלחה');
      }
    } catch (error) {
      console.error('Error creating reservations:', error);
      setSnackbar({
        open: true,
        message: 'שגיאה ביצירת ההזמנה: ' + (error.message || 'אנא נסה שוב'),
        severity: 'error'
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // סגירת ההודעה
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // תצוגת טעינה
  if (loading && activeStep === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6">טוען נתונים...</Typography>
        </Box>
      </Container>
    );
  }

  // תצוגת שגיאה
  if (error && activeStep === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="outlined" 
          onClick={fetchInventory}
          startIcon={<InfoIcon />}
        >
          נסה שוב
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* כותרת */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: 'bold', color: '#373B5C' }}>
          אשף הזמנות ווינטג'
        </Typography>
        <Typography variant="body1" sx={{ color: '#9197B3' }}>
          צור הזמנה מותאמת אישית בסגנון ווינטג' עם תבניות מוכנות מראש
        </Typography>
      </Box>
      
      {/* שלבי האשף */}
      <Paper sx={{ p: 4, mb: 4, borderRadius: 2, border: '1px solid #CECECE' }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {/* תוכן השלב */}
        <Box sx={{ mt: 3, minHeight: '50vh' }}>
          {/* שלב 1: בחירת תבנית */}
          {activeStep === 0 && (
            <Grid container spacing={3}>
              {Object.entries(PRODUCTION_TEMPLATES).map(([key, template]) => (
                <Grid item xs={12} sm={6} key={key}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      borderRadius: 2, 
                      border: '1px solid #CECECE',
                      height: '100%',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 12px rgba(0,0,0,0.1)',
                        borderColor: '#1E2875'
                      }
                    }}
                  >
                    <CardActionArea 
                      onClick={() => handleTemplateSelect(key)} 
                      sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                    >
                      <Box 
                        sx={{ 
                          p: 2, 
                          display: 'flex', 
                          alignItems: 'center', 
                          bgcolor: 'rgba(30, 40, 117, 0.08)',
                          borderBottom: '1px solid #CECECE'
                        }}
                      >
                        <Box sx={{ mr: 2 }}>
                          {template.icon}
                        </Box>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                          {template.name}
                        </Typography>
                      </Box>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {template.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          קטגוריות:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {template.categories.map((category) => (
                            <Chip 
                              key={category} 
                              label={category} 
                              size="small" 
                              variant="outlined" 
                              sx={{ borderRadius: 1 }}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
          
          {/* שלב 2: בחירת פריטים */}
          {activeStep === 1 && selectedTemplate && (
            <>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                {PRODUCTION_TEMPLATES[selectedTemplate].name} - בחירת פריטים
              </Typography>
              
              {/* אפשרות להציג/להסתיר המלצות */}
              <FormControlLabel
                control={
                  <Switch 
                    checked={showRecommendations} 
                    onChange={(e) => setShowRecommendations(e.target.checked)}
                    color="primary"
                  />
                }
                label="הצג המלצות למערכים מוכנים"
                sx={{ mb: 3 }}
              />
              
              {/* המלצות למערכים */}
              {showRecommendations && (
                <Box sx={{ mb: 4 }}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(30, 40, 117, 0.05)', borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                      מערכים מומלצים:
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
                      {PRODUCTION_TEMPLATES[selectedTemplate].recommendedCombinations.map((combo) => (
                        <Button
                          key={combo.name}
                          variant={currentBundle === combo.name ? "contained" : "outlined"}
                          color="primary"
                          onClick={() => handleBundleSelect(combo.name)}
                          sx={{ minWidth: '150px', whiteSpace: 'nowrap' }}
                        >
                          {combo.name}
                        </Button>
                      ))}
                    </Stack>
                    
                    {currentBundle && recommendedItems.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          הפריטים במערך {currentBundle}:
                        </Typography>
                        <List dense>
                          {recommendedItems.map((item) => (
                            <ListItem key={item.id} sx={{ py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: '36px' }}>
                                <Checkbox
                                  edge="start"
                                  checked={selectedItems.some(selectedItem => selectedItem.id === item.id)}
                                  onClick={() => handleItemSelect(item)}
                                />
                              </ListItemIcon>
                              <ListItemText 
                                primary={item.name} 
                                secondary={`קטגוריה: ${item.category}`} 
                              />
                            </ListItem>
                          ))}
                        </List>
                        {recommendedItems.length === 0 && (
                          <Typography variant="body2" color="text.secondary">
                            לא נמצאו פריטים תואמים למערך זה במלאי הזמין.
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Paper>
                </Box>
              )}
              
              {/* רשימת פריטים זמינים */}
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                פריטים זמינים במלאי:
              </Typography>
              
              {filteredItems.length > 0 ? (
                <Grid container spacing={2}>
                  {filteredItems.map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item.id}>
                      <Card 
                        elevation={0}
                        sx={{ 
                          borderRadius: 2, 
                          border: '1px solid #CECECE',
                          borderColor: selectedItems.some(selectedItem => selectedItem.id === item.id) 
                            ? '#1E2875' 
                            : '#CECECE',
                          bgcolor: selectedItems.some(selectedItem => selectedItem.id === item.id) 
                            ? 'rgba(30, 40, 117, 0.05)' 
                            : 'transparent'
                        }}
                      >
                        <CardActionArea onClick={() => handleItemSelect(item)}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold' }}>
                                {item.name}
                              </Typography>
                              <Checkbox
                                checked={selectedItems.some(selectedItem => selectedItem.id === item.id)}
                                color="primary"
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              קטגוריה: {item.category}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Chip 
                                label={`כמות: ${item.quantity}`} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                              {recommendedItems.some(recItem => recItem.id === item.id) && (
                                <Chip 
                                  label="מומלץ" 
                                  size="small" 
                                  color="success" 
                                  variant="outlined"
                                  icon={<CheckIcon />}
                                />
                              )}
                            </Box>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">
                  לא נמצאו פריטים מתאימים לתבנית זו במלאי.
                </Alert>
              )}
              
              {/* סיכום הפריטים שנבחרו */}
              <Box sx={{ mt: 4 }}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#f9f9f9' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                    פריטים שנבחרו: {selectedItems.length}
                  </Typography>
                  
                  {selectedItems.length > 0 ? (
                    <List dense>
                      {selectedItems.map((item) => (
                        <ListItem key={item.id} secondaryAction={
                          <IconButton 
                            edge="end" 
                            aria-label="הסר" 
                            onClick={() => handleItemSelect(item)}
                            size="small"
                          >
                            <Chip 
                              label="הסר" 
                              size="small" 
                              color="error" 
                              variant="outlined"
                              onDelete={() => handleItemSelect(item)}
                            />
                          </IconButton>
                        }>
                          <ListItemText 
                            primary={item.name} 
                            secondary={`קטגוריה: ${item.category}`} 
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      טרם נבחרו פריטים. אנא בחר לפחות פריט אחד להמשך.
                    </Typography>
                  )}
                </Paper>
              </Box>
            </>
          )}
          
          {/* שלב 3: פרטי הזמנה */}
          {activeStep === 2 && (
            <>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                {PRODUCTION_TEMPLATES[selectedTemplate].name} - פרטי הזמנה
              </Typography>
              
              <Grid container spacing={3}>
                {/* פרטי הסטודנט */}
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                      פרטי הסטודנט
                    </Typography>
                    
                    <TextField
                      label="שם הסטודנט"
                      name="student_name"
                      value={formData.student_name}
                      onChange={handleInputChange}
                      fullWidth
                      margin="normal"
                      required
                      variant="outlined"
                    />
                    
                    <TextField
                      label="מספר ת.ז. / מספר סטודנט"
                      name="student_id"
                      value={formData.student_id}
                      onChange={handleInputChange}
                      fullWidth
                      margin="normal"
                      required
                      variant="outlined"
                    />
                    
                    <TextField
                      label="הערות להזמנה"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      fullWidth
                      margin="normal"
                      variant="outlined"
                      multiline
                      rows={3}
                    />
                  </Paper>
                </Grid>
                
                {/* בחירת תאריכים */}
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                      תאריכי ההזמנה
                    </Typography>
                    
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                      <Stack spacing={3}>
                        <DatePicker
                          label="מתאריך"
                          value={formData.start_date}
                          onChange={(newValue) => {
                            setFormData({
                              ...formData,
                              start_date: newValue
                            });
                            setAvailabilityInfo({});
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
                          onChange={(newValue) => {
                            setFormData({
                              ...formData,
                              end_date: newValue
                            });
                            setAvailabilityInfo({});
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
                    
                    {loading && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    )}
                    
                    {!loading && Object.keys(availabilityInfo).length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          בדיקת זמינות:
                        </Typography>
                        
                        {selectedItems.some(item => 
                          availabilityInfo[item.id] && !availabilityInfo[item.id].available
                        ) ? (
                          <Alert severity="warning" sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              שים לב! חלק מהפריטים אינם זמינים בתאריכים שנבחרו:
                            </Typography>
                            <List dense>
                              {selectedItems
                                .filter(item => availabilityInfo[item.id] && !availabilityInfo[item.id].available)
                                .map(item => (
                                  <ListItem key={item.id}>
                                    <ListItemText 
                                      primary={item.name} 
                                      secondary={availabilityInfo[item.id]?.message || 'לא זמין בתאריכים אלה'}
                                    />
                                  </ListItem>
                                ))
                              }
                            </List>
                          </Alert>
                        ) : (
                          <Alert severity="success">
                            כל הפריטים זמינים בתאריכים שנבחרו!
                          </Alert>
                        )}
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </>
          )}
          
          {/* שלב 4: סיכום */}
          {activeStep === 3 && (
            <>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                סיכום הזמנה - {PRODUCTION_TEMPLATES[selectedTemplate].name}
              </Typography>
              
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: '#f8f9fa' }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      פרטי סטודנט:
                    </Typography>
                    <Typography variant="body1">שם: {formData.student_name}</Typography>
                    <Typography variant="body1">מספר ת.ז.: {formData.student_id}</Typography>
                    {formData.notes && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>הערות:</Typography>
                        <Typography variant="body2">{formData.notes}</Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      תאריכי הזמנה:
                    </Typography>
                    <Typography variant="body1">
                      מתאריך: {formData.start_date.toLocaleDateString('he-IL')}
                    </Typography>
                    <Typography variant="body1">
                      עד תאריך: {formData.end_date.toLocaleDateString('he-IL')}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                      משך הזמנה: {Math.ceil((formData.end_date - formData.start_date) / (1000 * 60 * 60 * 24))} ימים
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
              
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                פריטים בהזמנה ({selectedItems.length}):
              </Typography>
              
              {selectedItems.length > 0 ? (
                <Paper sx={{ borderRadius: 2 }}>
                  <TableContainer>
                    <Table>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'right', padding: '12px 16px' }}>שם הפריט</th>
                          <th style={{ textAlign: 'right', padding: '12px 16px' }}>קטגוריה</th>
                          <th style={{ textAlign: 'center', padding: '12px 16px' }}>כמות</th>
                          <th style={{ textAlign: 'center', padding: '12px 16px' }}>סטטוס זמינות</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItems.map((item) => (
                          <tr key={item.id}>
                            <td style={{ textAlign: 'right', padding: '12px 16px' }}>{item.name}</td>
                            <td style={{ textAlign: 'right', padding: '12px 16px' }}>{item.category}</td>
                            <td style={{ textAlign: 'center', padding: '12px 16px' }}>1</td>
                            <td style={{ textAlign: 'center', padding: '12px 16px' }}>
                              {availabilityInfo[item.id]?.available === false ? (
                                <Chip 
                                  label="לא זמין" 
                                  size="small" 
                                  color="error" 
                                  variant="outlined"
                                  icon={<WarningIcon />}
                                />
                              ) : (
                                <Chip 
                                  label="זמין" 
                                  size="small" 
                                  color="success" 
                                  variant="outlined"
                                  icon={<CheckIcon />}
                                />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </TableContainer>
                </Paper>
              ) : (
                <Alert severity="warning">
                  לא נבחרו פריטים. אנא חזור לשלב הקודם ובחר פריטים להזמנה.
                </Alert>
              )}
              
              {/* אזהרה אם יש פריטים לא זמינים */}
              {selectedItems.some(item => 
                availabilityInfo[item.id] && !availabilityInfo[item.id].available
              ) && (
                <Alert severity="warning" sx={{ mt: 3 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    שים לב! חלק מהפריטים אינם זמינים בתאריכים שנבחרו.
                  </Typography>
                  <Typography variant="body2">
                    המערכת תיצור את ההזמנה עבור כל הפריטים, אך ייתכן שחלקם יידחו על ידי צוות המחסן.
                  </Typography>
                </Alert>
              )}
            </>
          )}
        </Box>
        
        {/* כפתורי ניווט */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, pt: 3, borderTop: '1px solid #CECECE' }}>
          <Button
            variant="outlined"
            onClick={activeStep === 0 ? () => navigate('/create-reservation') : handleBack}
            startIcon={<LeftIcon />}
            disabled={submitLoading}
          >
            {activeStep === 0 ? 'חזור להזמנה רגילה' : 'הקודם'}
          </Button>
          
          <Button
            variant={activeStep === steps.length - 1 ? "contained" : "outlined"}
            color="primary"
            onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
            endIcon={activeStep === steps.length - 1 ? <EventNoteIcon /> : <RightIcon />}
            disabled={(activeStep === 1 && selectedItems.length === 0) || submitLoading}
          >
            {submitLoading ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                שולח הזמנה...
              </>
            ) : (
              activeStep === steps.length - 1 ? 'צור הזמנה' : 'הבא'
            )}
          </Button>
        </Box>
      </Paper>
      
      {/* התראה */}
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
    </Container>
  );
}

export default VintageOrderWizard;