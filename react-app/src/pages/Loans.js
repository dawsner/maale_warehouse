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
  Alert,
  Snackbar,
  LinearProgress,
  Tab,
  Tabs,
  InputAdornment,
  Chip,
  MenuItem,
  Divider
} from '@mui/material';
// Temporarily removed date picker due to compatibility issues
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { loansAPI, inventoryAPI } from '../api/api';

function Loans() {
  const [loans, setLoans] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [returnNotes, setReturnNotes] = useState('');
  const [currentLoan, setCurrentLoan] = useState(null);
  const [newLoan, setNewLoan] = useState({
    itemId: '',
    studentName: '',
    studentId: '',
    quantity: 1,
    dueDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // שבוע מהיום
    notes: '',
    director: '',
    producer: '',
    photographer: '',
    pricePerUnit: 0,
    totalPrice: 0
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchLoans();
    fetchInventory();
  }, []);

  useEffect(() => {
    if (newLoan.itemId && newLoan.quantity) {
      const selectedItem = inventory.find(item => item.id === newLoan.itemId);
      if (selectedItem && selectedItem.price_per_unit) {
        const totalPrice = selectedItem.price_per_unit * newLoan.quantity;
        setNewLoan(prev => ({
          ...prev,
          pricePerUnit: selectedItem.price_per_unit,
          totalPrice
        }));
      }
    }
  }, [newLoan.itemId, newLoan.quantity, inventory]);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await loansAPI.getAll();
      setLoans(response.data);
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
      const response = await inventoryAPI.getAll();
      setInventory(response.data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
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
    
    if (name === 'quantity') {
      const numValue = parseInt(value, 10) || 0;
      const selectedItem = inventory.find(item => item.id === newLoan.itemId);
      const pricePerUnit = selectedItem ? selectedItem.price_per_unit || 0 : 0;
      
      setNewLoan({
        ...newLoan,
        quantity: numValue,
        totalPrice: numValue * pricePerUnit
      });
    } else if (name === 'itemId') {
      const selectedItem = inventory.find(item => item.id === value);
      const pricePerUnit = selectedItem ? selectedItem.price_per_unit || 0 : 0;
      
      setNewLoan({
        ...newLoan,
        itemId: value,
        pricePerUnit,
        totalPrice: newLoan.quantity * pricePerUnit
      });
    } else {
      setNewLoan({
        ...newLoan,
        [name]: value
      });
    }
  };

  const handleDateChange = (date) => {
    setNewLoan({
      ...newLoan,
      dueDate: date
    });
  };

  const handleCreateLoan = async () => {
    if (!newLoan.itemId || !newLoan.studentName || !newLoan.studentId || !newLoan.quantity || !newLoan.dueDate) {
      setSnackbar({
        open: true,
        message: 'יש למלא את כל שדות החובה',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      await loansAPI.create(newLoan);
      setSnackbar({
        open: true,
        message: 'ההשאלה נוצרה בהצלחה',
        severity: 'success'
      });
      setOpenDialog(false);
      setNewLoan({
        itemId: '',
        studentName: '',
        studentId: '',
        quantity: 1,
        dueDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        notes: '',
        director: '',
        producer: '',
        photographer: '',
        pricePerUnit: 0,
        totalPrice: 0
      });
      await fetchLoans();
    } catch (err) {
      console.error('Error creating loan:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'שגיאה ביצירת השאלה',
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
      await loansAPI.return(currentLoan.id, returnNotes);
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
        message: 'שגיאה בהחזרת הציוד',
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
        <DialogTitle>
          השאלת ציוד חדשה
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="בחירת פריט"
                name="itemId"
                fullWidth
                required
                value={newLoan.itemId}
                onChange={handleNewLoanChange}
                sx={{ direction: 'rtl' }}
              >
                {inventory
                  .filter(item => item.is_available && item.quantity > 0)
                  .map(item => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name} (כמות זמינה: {item.quantity})
                    </MenuItem>
                  ))
                }
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="כמות"
                name="quantity"
                type="number"
                fullWidth
                required
                value={newLoan.quantity}
                onChange={handleNewLoanChange}
                inputProps={{ min: 1 }}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="שם הסטודנט"
                name="studentName"
                fullWidth
                required
                value={newLoan.studentName}
                onChange={handleNewLoanChange}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="ת.ז סטודנט"
                name="studentId"
                fullWidth
                required
                value={newLoan.studentId}
                onChange={handleNewLoanChange}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="תאריך החזרה"
                name="dueDate"
                type="date"
                fullWidth
                required
                value={newLoan.dueDate instanceof Date ? newLoan.dueDate.toISOString().split('T')[0] : ''}
                onChange={e => {
                  const newDate = new Date(e.target.value);
                  handleDateChange(newDate);
                }}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            
            {/* שדות נוספים */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1, color: '#373B5C', fontWeight: 'bold' }}>
                פרטי הפקה
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                label="במאי"
                name="director"
                fullWidth
                value={newLoan.director}
                onChange={handleNewLoanChange}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="מפיק"
                name="producer"
                fullWidth
                value={newLoan.producer}
                onChange={handleNewLoanChange}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="צלם"
                name="photographer"
                fullWidth
                value={newLoan.photographer}
                onChange={handleNewLoanChange}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="מחיר ליחידה"
                name="pricePerUnit"
                type="number"
                fullWidth
                value={newLoan.pricePerUnit}
                onChange={handleNewLoanChange}
                InputProps={{
                  readOnly: true,
                  startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                }}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="מחיר כולל"
                name="totalPrice"
                type="number"
                fullWidth
                value={newLoan.totalPrice}
                InputProps={{
                  readOnly: true,
                  startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                }}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="הערות"
                name="notes"
                fullWidth
                multiline
                rows={3}
                value={newLoan.notes}
                onChange={handleNewLoanChange}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="inherit">
            ביטול
          </Button>
          <Button onClick={handleCreateLoan} color="primary" variant="contained">
            יצירת השאלה
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* דיאלוג החזרת ציוד */}
      <Dialog open={openReturnDialog} onClose={handleReturnDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          החזרת ציוד
        </DialogTitle>
        <DialogContent>
          {currentLoan && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                פרטי השאלה:
              </Typography>
              <Typography variant="body1">
                סטודנט: {currentLoan.student_name}
              </Typography>
              <Typography variant="body1">
                פריט: {currentLoan.item_name}
              </Typography>
              <Typography variant="body1">
                כמות: {currentLoan.quantity}
              </Typography>
              <Typography variant="body1">
                תאריך השאלה: {formatDate(currentLoan.loan_date)}
              </Typography>
              
              <TextField
                label="הערות החזרה"
                fullWidth
                multiline
                rows={4}
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                sx={{ mt: 3, direction: 'rtl' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReturnDialogClose} color="inherit">
            ביטול
          </Button>
          <Button 
            onClick={handleReturnLoan} 
            color="success" 
            variant="contained"
            startIcon={<AssignmentReturnIcon />}
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
