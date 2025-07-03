import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Alert,
  Snackbar,
  LinearProgress,
  Tab,
  Tabs,
  InputAdornment,
  Chip
} from '@mui/material';
// Temporarily removed date picker due to compatibility issues
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { loansAPI, inventoryAPI, studentsAPI } from '../api/api';

function Loans() {
  const [loans, setLoans] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [returnNotes, setReturnNotes] = useState('');
  const [currentLoan, setCurrentLoan] = useState(null);
  const [newLoan, setNewLoan] = useState({
    selectedItems: [], // משנה לרשימה של פריטים נבחרים
    studentId: '', // מזהה הסטודנט במערכת
    studentName: '',
    dueDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // שבוע מהיום
    notes: '',
    director: '',
    producer: '',
    photographer: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchLoans();
    fetchInventory();
    fetchStudents();
  }, []);

  // הסרנו את החישוב של מחיר כי הציוד מושאל בחינם

  const fetchLoans = async () => {
    try {
      setLoading(true);
      console.log('Fetching loans...');
      const response = await loansAPI.getLoans();
      console.log('Loans response:', response);
      setLoans(response.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching loans:', err);
      setError('שגיאה בטעינת נתוני ההשאלות');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      console.log('Fetching inventory...');
      const response = await inventoryAPI.getItems();
      console.log('Inventory response:', response);
      setInventory(response || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      console.log('Fetching students...');
      const response = await studentsAPI.getStudents();
      console.log('Students response:', response);
      setStudents(response || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // סינון השאלות לפי סטטוס ומחרוזת חיפוש
  const filteredLoans = loans.filter(loan => {
    const isActive = loan.return_date === null;
    const matchesTab = (tabValue === 0) || (tabValue === 1 && isActive) || (tabValue === 2 && !isActive);
    
    const matchesSearch = 
      (loan.student_name && loan.student_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (loan.student_id && loan.student_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (loan.item_name && loan.item_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesTab && matchesSearch;
  });

  const handleDialogOpen = () => {
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleReturnDialogOpen = (loan) => {
    setCurrentLoan(loan);
    setReturnNotes('');
    setOpenReturnDialog(true);
  };

  const handleReturnDialogClose = () => {
    setOpenReturnDialog(false);
    setCurrentLoan(null);
  };

  const handleNewLoanChange = (e) => {
    const { name, value } = e.target;
    setNewLoan({
      ...newLoan,
      [name]: value
    });
  };

  // פונקציה לעדכון נתוני סטודנט כאשר נבחר סטודנט
  const handleStudentSelect = (e) => {
    const studentId = e.target.value;
    const selectedStudent = students.find(student => student.id === parseInt(studentId));
    
    if (selectedStudent) {
      setNewLoan({
        ...newLoan,
        studentId: selectedStudent.id,
        studentName: selectedStudent.full_name || selectedStudent.username
      });
    }
  };

  // פונקציה להוספת פריט חדש לרשימה
  const addItemToLoan = () => {
    const newItem = {
      itemId: '',
      quantity: 1,
      id: Date.now() // מזהה זמני
    };
    setNewLoan({
      ...newLoan,
      selectedItems: [...newLoan.selectedItems, newItem]
    });
  };

  // פונקציה להסרת פריט מהרשימה
  const removeItemFromLoan = (itemIndex) => {
    const updatedItems = newLoan.selectedItems.filter((_, index) => index !== itemIndex);
    setNewLoan({
      ...newLoan,
      selectedItems: updatedItems
    });
  };

  // פונקציה לעדכון פריט ברשימה
  const updateSelectedItem = (itemIndex, field, value) => {
    const updatedItems = newLoan.selectedItems.map((item, index) => {
      if (index === itemIndex) {
        return { ...item, [field]: field === 'quantity' ? parseInt(value, 10) || 1 : value };
      }
      return item;
    });
    setNewLoan({
      ...newLoan,
      selectedItems: updatedItems
    });
  };

  const handleDateChange = (date) => {
    setNewLoan({
      ...newLoan,
      dueDate: date
    });
  };

  const handleCreateLoan = async () => {
    // בדיקת תקינות - צריך לפחות פריט אחד
    if (newLoan.selectedItems.length === 0 || !newLoan.studentName || !newLoan.studentId || !newLoan.dueDate) {
      setSnackbar({
        open: true,
        message: 'יש למלא את כל שדות החובה ולבחור לפחות פריט אחד',
        severity: 'error'
      });
      return;
    }

    // בדיקה שכל הפריטים הנבחרים מוגדרים כראוי
    const invalidItems = newLoan.selectedItems.filter(item => !item.itemId || !item.quantity);
    if (invalidItems.length > 0) {
      setSnackbar({
        open: true,
        message: 'יש לבחור פריט וכמות עבור כל שורה',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Creating loans for multiple items:', newLoan);
      
      // יצירת השאלה נפרדת עבור כל פריט
      const loanPromises = newLoan.selectedItems.map(async (selectedItem) => {
        const loanData = {
          item_id: selectedItem.itemId,
          student_name: newLoan.studentName,
          student_id: newLoan.studentName, // משתמש בשם הסטודנט במקום ת.ז.
          quantity: selectedItem.quantity,
          due_date: newLoan.dueDate instanceof Date ? newLoan.dueDate.toISOString() : newLoan.dueDate,
          loan_notes: newLoan.notes,
          director: newLoan.director,
          producer: newLoan.producer,
          photographer: newLoan.photographer
        };
        
        return loansAPI.createLoan(loanData);
      });
      
      await Promise.all(loanPromises);
      
      setSnackbar({
        open: true,
        message: `נוצרו ${newLoan.selectedItems.length} השאלות בהצלחה`,
        severity: 'success'
      });
      setOpenDialog(false);
      setNewLoan({
        selectedItems: [],
        studentId: '',
        studentName: '',
        dueDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        notes: '',
        director: '',
        producer: '',
        photographer: ''
      });
      await fetchLoans();
    } catch (err) {
      console.error('Error creating loans:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'שגיאה ביצירת השאלות',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReturnLoan = async () => {
    if (!currentLoan) return;
    
    try {
      setLoading(true);
      console.log('Returning loan:', currentLoan.id, 'with notes:', returnNotes);
      
      await loansAPI.returnLoan(currentLoan.id, returnNotes);
      
      setSnackbar({
        open: true,
        message: 'הציוד הוחזר בהצלחה',
        severity: 'success'
      });
      handleReturnDialogClose();
      await fetchLoans();
    } catch (err) {
      console.error('Error returning loan:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'שגיאה בהחזרת הציוד',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'לא ידוע';
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
  };

  const getLoanStatus = (loan) => {
    if (loan.return_date) {
      return { label: 'הוחזר', color: 'success' };
    }
    
    const dueDate = new Date(loan.due_date);
    const today = new Date();
    
    if (dueDate < today) {
      return { label: 'באיחור', color: 'error' };
    }
    
    return { label: 'פעיל', color: 'primary' };
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: 'bold', color: '#373B5C' }}>
          ניהול השאלות
        </Typography>
        <Typography variant="body1" sx={{ color: '#9197B3' }}>
          ניהול השאלות ציוד לסטודנטים ומעקב אחר החזרות
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, border: '1px solid #CECECE' }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="חיפוש לפי שם סטודנט, ת.ז. או שם פריט..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ direction: 'rtl' }}
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleDialogOpen}
              sx={{ 
                borderRadius: '8px',
                py: 1,
                px: 3
              }}
            >
              השאלה חדשה
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
            <Tab label="כל ההשאלות" />
            <Tab label="השאלות פעילות" />
            <Tab label="ציוד שהוחזר" />
          </Tabs>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>שם הסטודנט</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>ת.ז</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>שם הפריט</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>כמות</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>תאריך השאלה</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>תאריך החזרה</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>סטטוס</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => {
                  const status = getLoanStatus(loan);
                  return (
                    <TableRow key={loan.id} hover>
                      <TableCell>{loan.student_name}</TableCell>
                      <TableCell>{loan.student_id}</TableCell>
                      <TableCell>{loan.item_name}</TableCell>
                      <TableCell>{loan.quantity}</TableCell>
                      <TableCell>{formatDate(loan.loan_date)}</TableCell>
                      <TableCell>{loan.return_date ? formatDate(loan.return_date) : '-'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={status.label} 
                          color={status.color} 
                          size="small" 
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton color="primary">
                          <VisibilityIcon />
                        </IconButton>
                        
                        {!loan.return_date && (
                          <IconButton 
                            color="success" 
                            onClick={() => handleReturnDialogOpen(loan)}
                          >
                            <AssignmentReturnIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {loading ? 'טוען נתונים...' : 'לא נמצאו השאלות'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* דיאלוג יצירת השאלה חדשה */}
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f8f8f8', borderBottom: '1px solid #eaeaea' }}>
          <Typography variant="h6" component="div" sx={{ color: '#373B5C', fontWeight: 'bold' }}>
            השאלת ציוד חדשה
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Box sx={{ mb: 3, p: 2, bgcolor: '#FAFBFF', borderRadius: 2, border: '1px solid #E5E8F5' }}>
              <Typography variant="body2" color="primary">
                השאלת ציוד לסטודנט. יש למלא את כל פרטי החובה המסומנים בכוכבית.
                הציוד הזמין מוצג ברשימה עם הכמות הזמינה במחסן.
              </Typography>
            </Box>
          
            <Grid container spacing={3}>
              {/* מידע בסיסי */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #CECECE' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#373B5C' }}>
                      פריטים לשאילה
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={addItemToLoan}
                      sx={{ color: '#373B5C', borderColor: '#373B5C' }}
                    >
                      הוסף פריט
                    </Button>
                  </Box>
                  
                  {/* רשימת פריטים נבחרים */}
                  {newLoan.selectedItems.length === 0 ? (
                    <Box sx={{ 
                      p: 3, 
                      textAlign: 'center', 
                      border: '2px dashed #CECECE', 
                      borderRadius: 2,
                      bgcolor: '#FAFBFF',
                      mb: 2
                    }}>
                      <Typography variant="body2" color="text.secondary">
                        לחץ על "הוסף פריט" כדי להתחיל לבחור ציוד להשאלה
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ mb: 2 }}>
                      {newLoan.selectedItems.map((selectedItem, index) => (
                        <Paper 
                          key={index} 
                          sx={{ 
                            p: 2, 
                            mb: 2, 
                            border: '1px solid #E5E8F5',
                            borderRadius: 2
                          }}
                        >
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={6}>
                              <TextField
                                select
                                label="בחירת פריט *"
                                fullWidth
                                required
                                value={selectedItem.itemId}
                                onChange={(e) => updateSelectedItem(index, 'itemId', e.target.value)}
                                sx={{ direction: 'rtl' }}
                                error={!selectedItem.itemId}
                                helperText={!selectedItem.itemId ? "חובה לבחור פריט" : ""}
                              >
                                <MenuItem value="" disabled>
                                  <em>בחר פריט</em>
                                </MenuItem>
                                {inventory
                                  .filter(item => item.is_available && item.available_quantity > 0)
                                  .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
                                  .map(item => (
                                    <MenuItem key={item.id} value={item.id}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                        <span>
                                          <strong>{item.category}</strong> - {item.name}
                                        </span>
                                        <span style={{ color: '#666' }}>
                                          (זמין: {item.available_quantity})
                                        </span>
                                      </Box>
                                    </MenuItem>
                                  ))
                                }
                              </TextField>
                            </Grid>
                            <Grid item xs={8} md={4}>
                              <TextField
                                label="כמות *"
                                type="number"
                                fullWidth
                                required
                                value={selectedItem.quantity}
                                onChange={(e) => updateSelectedItem(index, 'quantity', e.target.value)}
                                inputProps={{ 
                                  min: 1,
                                  max: selectedItem.itemId ? 
                                    inventory.find(item => item.id === selectedItem.itemId)?.available_quantity || 1 : 1 
                                }}
                                sx={{ direction: 'rtl' }}
                                error={selectedItem.quantity < 1}
                                helperText={selectedItem.quantity < 1 ? "כמות חייבת להיות 1 לפחות" : ""}
                              />
                            </Grid>
                            <Grid item xs={4} md={2}>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => removeItemFromLoan(index)}
                                sx={{ minWidth: 'auto', px: 1 }}
                              >
                                הסר
                              </Button>
                            </Grid>
                          </Grid>
                          
                          {/* הסרנו את הצגת המחיר כי הציוד מושאל בחינם */}
                        </Paper>
                      ))}
                      
                      {/* סיכום פריטים נבחרים */}
                      <Paper sx={{ p: 2, bgcolor: '#F0F4FF', border: '1px solid #1E2875' }}>
                        <Typography variant="h6" sx={{ color: '#1E2875', fontWeight: 'bold', textAlign: 'center' }}>
                          סה"כ פריטים נבחרים: {newLoan.selectedItems.length}
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                  
                  <Grid container spacing={2}>
                    
                    <Grid item xs={12}>
                      <TextField
                        select
                        label="בחר סטודנט *"
                        name="studentId"
                        fullWidth
                        required
                        value={newLoan.studentId}
                        onChange={handleStudentSelect}
                        sx={{ direction: 'rtl' }}
                        error={!newLoan.studentId}
                        helperText={!newLoan.studentId ? "חובה לבחור סטודנט" : ""}
                      >
                        <MenuItem value="">בחר סטודנט...</MenuItem>
                        {students.map((student) => (
                          <MenuItem key={student.id} value={student.id}>
                            {student.display_name || `${student.full_name || student.username} (${student.username})`}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="תאריך החזרה מתוכנן *"
                        name="dueDate"
                        type="date"
                        fullWidth
                        required
                        value={newLoan.dueDate instanceof Date ? newLoan.dueDate.toISOString().split('T')[0] : ''}
                        onChange={e => {
                          const newDate = new Date(e.target.value);
                          handleDateChange(newDate);
                        }}
                        InputLabelProps={{ shrink: true }}
                        sx={{ direction: 'rtl' }}
                        error={!newLoan.dueDate}
                        helperText={!newLoan.dueDate ? "חובה לבחור תאריך החזרה" : ""}
                      />
                    </Grid>

                    {newLoan.itemId && (
                      <Grid item xs={12}>
                        {/* הצגת פרטי הפריט הנבחר */}
                        <Box sx={{ 
                          mt: 2, 
                          p: 2, 
                          bgcolor: '#F5F8FF', 
                          borderRadius: 1,
                          border: '1px solid #E0E7FF'
                        }}>
                          {(() => {
                            const selectedItem = inventory.find(item => item.id === newLoan.itemId);
                            return selectedItem ? (
                              <>
                                <Typography variant="subtitle2" sx={{ mb: 1, color: '#1E2875' }}>
                                  פרטי הפריט הנבחר
                                </Typography>
                                <Grid container spacing={1}>
                                  <Grid item xs={12} md={4}>
                                    <Typography variant="body2" color="textSecondary">שם:</Typography>
                                    <Typography variant="body1">{selectedItem.name}</Typography>
                                  </Grid>
                                  <Grid item xs={12} md={4}>
                                    <Typography variant="body2" color="textSecondary">קטגוריה:</Typography>
                                    <Typography variant="body1">{selectedItem.category}</Typography>
                                  </Grid>
                                  <Grid item xs={12} md={4}>
                                    <Typography variant="body2" color="textSecondary">במלאי:</Typography>
                                    <Typography variant="body1">{selectedItem.available_quantity} / {selectedItem.quantity}</Typography>
                                  </Grid>
                                  {selectedItem.notes && (
                                    <Grid item xs={12}>
                                      <Typography variant="body2" color="textSecondary">הערות על הפריט:</Typography>
                                      <Typography variant="body1">{selectedItem.notes}</Typography>
                                    </Grid>
                                  )}
                                </Grid>
                              </>
                            ) : null;
                          })()}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>
              
              {/* פרטי הפקה */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #CECECE' }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: '#373B5C' }}>
                    פרטי הפקה
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="במאי"
                        name="director"
                        fullWidth
                        value={newLoan.director}
                        onChange={handleNewLoanChange}
                        sx={{ direction: 'rtl' }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="מפיק"
                        name="producer"
                        fullWidth
                        value={newLoan.producer}
                        onChange={handleNewLoanChange}
                        sx={{ direction: 'rtl' }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="צלם"
                        name="photographer"
                        fullWidth
                        value={newLoan.photographer}
                        onChange={handleNewLoanChange}
                        sx={{ direction: 'rtl' }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              {/* הערות */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #CECECE' }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: '#373B5C' }}>
                    הערות נוספות
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="הערות להשאלה"
                        name="notes"
                        fullWidth
                        multiline
                        rows={3}
                        value={newLoan.notes}
                        onChange={handleNewLoanChange}
                        sx={{ direction: 'rtl' }}
                        placeholder="הערות להשאלה, פרטים נוספים, או הוראות מיוחדות"
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #eaeaea', p: 2 }}>
          <Button onClick={handleDialogClose} color="inherit">
            ביטול
          </Button>
          <Button 
            onClick={handleCreateLoan} 
            color="primary" 
            variant="contained"
            disabled={!newLoan.studentId || newLoan.selectedItems.length === 0 || !newLoan.dueDate || newLoan.selectedItems.some(item => !item.itemId || item.quantity < 1)}
            sx={{ borderRadius: '8px', px: 3 }}
            startIcon={<AddIcon />}
          >
            יצירת השאלה
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* דיאלוג החזרת ציוד */}
      <Dialog open={openReturnDialog} onClose={handleReturnDialogClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f8f8f8', borderBottom: '1px solid #eaeaea' }}>
          <Typography variant="h6" component="div" sx={{ color: '#373B5C', fontWeight: 'bold' }}>
            החזרת ציוד
          </Typography>
        </DialogTitle>
        <DialogContent>
          {currentLoan && (
            <Box sx={{ mt: 3, p: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #CECECE', height: '100%' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#373B5C' }}>
                      פרטי השאלה
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', minWidth: '120px' }}>שם הסטודנט:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{currentLoan.student_name}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', minWidth: '120px' }}>ת.ז. סטודנט:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{currentLoan.student_id}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', minWidth: '120px' }}>פריט:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{currentLoan.item_name}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', minWidth: '120px' }}>קטגוריה:</Typography>
                        <Typography variant="body1">{currentLoan.category}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', minWidth: '120px' }}>כמות:</Typography>
                        <Typography variant="body1">{currentLoan.quantity}</Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #CECECE', height: '100%' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#373B5C' }}>
                      פרטי זמנים
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', minWidth: '120px' }}>תאריך השאלה:</Typography>
                        <Typography variant="body1">{formatDate(currentLoan.checkout_date)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', minWidth: '120px' }}>תאריך החזרה מתוכנן:</Typography>
                        <Typography variant="body1">{formatDate(currentLoan.due_date)}</Typography>
                      </Box>
                      
                      {/* בדיקה האם יש איחור */}
                      {currentLoan.due_date && new Date(currentLoan.due_date) < new Date() && (
                        <Box sx={{ 
                          bgcolor: '#FFF4F4', 
                          p: 1, 
                          borderRadius: 1, 
                          border: '1px solid #FFCDD2',
                          mt: 1 
                        }}>
                          <Typography variant="body2" color="error">
                            שים לב: ההשאלה באיחור של {Math.ceil((new Date() - new Date(currentLoan.due_date)) / (1000 * 60 * 60 * 24))} ימים
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>
                
                {/* הערות השאלה ופקה אם ישנן */}
                {(currentLoan.loan_notes || currentLoan.director || currentLoan.producer || currentLoan.photographer) && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #CECECE' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#373B5C' }}>
                        פרטים נוספים
                      </Typography>
                      
                      <Grid container spacing={2}>
                        {currentLoan.director && (
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2" sx={{ color: '#666' }}>במאי:</Typography>
                            <Typography variant="body1">{currentLoan.director}</Typography>
                          </Grid>
                        )}
                        
                        {currentLoan.producer && (
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2" sx={{ color: '#666' }}>מפיק:</Typography>
                            <Typography variant="body1">{currentLoan.producer}</Typography>
                          </Grid>
                        )}
                        
                        {currentLoan.photographer && (
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2" sx={{ color: '#666' }}>צלם:</Typography>
                            <Typography variant="body1">{currentLoan.photographer}</Typography>
                          </Grid>
                        )}
                        
                        {currentLoan.loan_notes && (
                          <Grid item xs={12}>
                            <Typography variant="body2" sx={{ color: '#666' }}>הערות השאלה:</Typography>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                mt: 0.5, 
                                p: 1.5, 
                                bgcolor: '#f5f5f5', 
                                borderRadius: 1,
                                whiteSpace: 'pre-line'
                              }}
                            >
                              {currentLoan.loan_notes}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </Grid>
                )}
                
                {/* פורם החזרה */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #CECECE', mt: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#373B5C' }}>
                      פרטי החזרה
                    </Typography>
                    
                    <TextField
                      label="הערות החזרה"
                      fullWidth
                      multiline
                      rows={4}
                      value={returnNotes}
                      onChange={(e) => setReturnNotes(e.target.value)}
                      sx={{ direction: 'rtl' }}
                      placeholder="תיאור מצב הציוד בעת החזרה, נזקים אם ישנם, או הערות אחרות"
                    />
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #eaeaea', p: 2 }}>
          <Button onClick={handleReturnDialogClose} color="inherit">
            ביטול
          </Button>
          <Button 
            onClick={handleReturnLoan} 
            color="success" 
            variant="contained"
            startIcon={<AssignmentReturnIcon />}
            sx={{ borderRadius: '8px', px: 3 }}
          >
            אישור החזרה
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* הודעות מערכת */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Loans;
