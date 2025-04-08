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
  InputAdornment,
  Tab,
  Tabs,
  Checkbox,
  FormControlLabel,
  Divider,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { inventoryAPI } from '../api/api';

function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [currentItem, setCurrentItem] = useState({
    id: null,
    name: '',
    category: '',
    quantity: 0,
    notes: '',
    category_original: '',
    order_notes: '',
    ordered: false,
    checked_out: false,
    checked: false,
    checkout_notes: '',
    returned: false,
    return_notes: '',
    price_per_unit: 0,
    total_price: 0,
    unnnamed_11: '',
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
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      console.log('Trying to fetch inventory items...');
      const data = await inventoryAPI.getItems();
      console.log('Inventory data received:', data);
      setItems(data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('שגיאה בטעינת נתוני המלאי');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (item = null) => {
    if (item) {
      setCurrentItem({ ...item });
    } else {
      setCurrentItem({
        id: null,
        name: '',
        category: '',
        quantity: 0,
        notes: '',
        category_original: '',
        order_notes: '',
        ordered: false,
        checked_out: false,
        checked: false,
        checkout_notes: '',
        returned: false,
        return_notes: '',
        price_per_unit: 0,
        total_price: 0,
        unnnamed_11: '',
        director: '',
        producer: '',
        photographer: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentItem({
      ...currentItem,
      [name]: type === 'checkbox'
        ? checked
        : (type === 'number' || name === 'quantity' || name === 'price_per_unit' || name === 'total_price')
          ? parseFloat(value) || 0
          : value
    });
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSaveItem = async () => {
    try {
      setLoading(true);
      
      if (currentItem.id) {
        // עדכון פריט קיים
        await inventoryAPI.update(currentItem.id, currentItem);
        setSnackbar({
          open: true,
          message: 'הפריט עודכן בהצלחה',
          severity: 'success'
        });
      } else {
        // יצירת פריט חדש
        await inventoryAPI.create(currentItem);
        setSnackbar({
          open: true,
          message: 'הפריט נוסף בהצלחה',
          severity: 'success'
        });
      }
      
      // רענון רשימת הפריטים
      await fetchItems();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving item:', err);
      setSnackbar({
        open: true,
        message: 'שגיאה בשמירת הפריט',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק פריט זה?')) {
      try {
        setLoading(true);
        await inventoryAPI.delete(id);
        await fetchItems();
        setSnackbar({
          open: true,
          message: 'הפריט נמחק בהצלחה',
          severity: 'success'
        });
      } catch (err) {
        console.error('Error deleting item:', err);
        setSnackbar({
          open: true,
          message: 'שגיאה במחיקת הפריט',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleAvailability = async (id, currentAvailability) => {
    try {
      setLoading(true);
      await inventoryAPI.toggleAvailability(id, !currentAvailability);
      await fetchItems();
      setSnackbar({
        open: true,
        message: `הפריט ${!currentAvailability ? 'זמין' : 'לא זמין'} כעת`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Error toggling availability:', err);
      setSnackbar({
        open: true,
        message: 'שגיאה בעדכון זמינות הפריט',
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: 'bold', color: '#373B5C' }}>
          ניהול מלאי
        </Typography>
        <Typography variant="body1" sx={{ color: '#9197B3' }}>
          ניהול פריטי ציוד במערכת, עדכון כמויות וניהול זמינות
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
              placeholder="חיפוש לפי שם או קטגוריה..."
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
              onClick={() => handleOpenDialog()}
              sx={{ 
                borderRadius: '8px',
                py: 1,
                px: 3
              }}
            >
              הוסף פריט חדש
            </Button>
          </Grid>
        </Grid>

        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>קטגוריה</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>שם הפריט</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>הזמנה</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>הערות הזמנה</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>יצא</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>נבדק</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>הערות הוצאה</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>חזר</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>הערות החזרה</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>זמינות</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <TableRow key={item.id} hover sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="center">
                      {item.ordered ? 
                        <Chip 
                          label="הוזמן" 
                          color="primary" 
                          size="small" 
                          variant="outlined"
                          sx={{ fontWeight: 'medium' }}
                        /> : 
                        <Typography component="span" sx={{ color: 'text.disabled', fontSize: '0.9rem' }}>-</Typography>
                      }
                    </TableCell>
                    <TableCell>
                      {item.order_notes ? 
                        <Typography 
                          sx={{ 
                            fontSize: '0.85rem', 
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            direction: 'rtl',
                            color: item.order_notes.includes('מחסן') ? '#d32f2f' : '#1976d2'
                          }}
                        >
                          {item.order_notes}
                        </Typography> : 
                        <Typography component="span" sx={{ color: 'text.disabled', fontSize: '0.9rem' }}>-</Typography>
                      }
                    </TableCell>
                    <TableCell align="center">
                      {item.checked_out ? 
                        <Chip 
                          label="יצא" 
                          color="error" 
                          size="small"
                          sx={{ fontWeight: 'medium' }}
                        /> : 
                        <Typography component="span" sx={{ color: 'text.disabled', fontSize: '0.9rem' }}>-</Typography>
                      }
                    </TableCell>
                    <TableCell align="center">
                      {item.checked ? 
                        <Chip 
                          label="נבדק" 
                          color="success" 
                          size="small"
                          sx={{ fontWeight: 'medium' }}
                        /> : 
                        <Typography component="span" sx={{ color: 'text.disabled', fontSize: '0.9rem' }}>-</Typography>
                      }
                    </TableCell>
                    <TableCell>
                      {item.checkout_notes ? 
                        <Typography 
                          sx={{ 
                            fontSize: '0.85rem', 
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            direction: 'rtl',
                            color: item.checkout_notes.includes('מחסן') ? '#d32f2f' : '#1976d2'
                          }}
                        >
                          {item.checkout_notes}
                        </Typography> : 
                        <Typography component="span" sx={{ color: 'text.disabled', fontSize: '0.9rem' }}>-</Typography>
                      }
                    </TableCell>
                    <TableCell align="center">
                      {item.returned ? 
                        <Chip 
                          label="חזר" 
                          color="success" 
                          size="small"
                          sx={{ fontWeight: 'medium' }}
                        /> : 
                        (item.checked_out ? 
                          <Chip 
                            label="עדיין בחוץ" 
                            color="warning" 
                            size="small"
                            sx={{ fontWeight: 'medium' }}
                          /> : 
                          <Typography component="span" sx={{ color: 'text.disabled', fontSize: '0.9rem' }}>-</Typography>
                        )
                      }
                    </TableCell>
                    <TableCell>
                      {item.return_notes ? 
                        <Typography 
                          sx={{ 
                            fontSize: '0.85rem', 
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            direction: 'rtl'
                          }}
                        >
                          {item.return_notes}
                        </Typography> : 
                        <Typography component="span" sx={{ color: 'text.disabled', fontSize: '0.9rem' }}>-</Typography>
                      }
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={item.is_available ? "contained" : "outlined"}
                        color={item.is_available ? "success" : "error"}
                        size="small"
                        onClick={() => handleToggleAvailability(item.id, item.is_available)}
                        sx={{ minWidth: '90px' }}
                      >
                        {item.is_available ? "זמין" : "לא זמין"}
                      </Button>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => handleOpenDialog(item)} color="primary" size="small" sx={{ mx: 0.5 }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteItem(item.id)} color="error" size="small" sx={{ mx: 0.5 }}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    {loading ? 'טוען נתונים...' : 'לא נמצאו פריטים'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* דיאלוג הוספה/עריכת פריט */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          borderBottom: '1px solid #eaeaea', 
          pb: 2, 
          fontWeight: 'bold',
          fontSize: '1.2rem',
          color: '#1E2875'
        }}>
          {currentItem.id ? 'עריכת פריט' : 'הוספת פריט חדש'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, mt: 1 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="טאבים לעריכת פריט"
              variant="scrollable"
              textColor="primary"
              indicatorColor="primary"
              scrollButtons="auto"
              sx={{ 
                direction: 'rtl',
                '& .MuiTab-root': {
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  py: 1.5,
                  mx: 1
                }
              }}
            >
              <Tab label="פרטים בסיסיים" />
              <Tab label="הזמנה" />
              <Tab label="הוצאה והחזרה" />
              <Tab label="מידע נוסף" />
            </Tabs>
          </Box>
          
          {/* טאב 1: פרטים בסיסיים */}
          {tabValue === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="שם הפריט"
                  name="name"
                  fullWidth
                  required
                  value={currentItem.name}
                  onChange={handleInputChange}
                  sx={{ direction: 'rtl' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="קטגוריה"
                  name="category"
                  fullWidth
                  required
                  value={currentItem.category}
                  onChange={handleInputChange}
                  sx={{ direction: 'rtl' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="קטגוריה מקורית מהאקסל"
                  name="category_original"
                  fullWidth
                  value={currentItem.category_original}
                  onChange={handleInputChange}
                  sx={{ direction: 'rtl' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="כמות"
                  name="quantity"
                  type="number"
                  fullWidth
                  required
                  value={currentItem.quantity}
                  onChange={handleInputChange}
                  sx={{ direction: 'rtl' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="הערות"
                  name="notes"
                  fullWidth
                  multiline
                  rows={2}
                  value={currentItem.notes}
                  onChange={handleInputChange}
                  sx={{ direction: 'rtl' }}
                />
              </Grid>
            </Grid>
          )}
          
          {/* טאב 2: הזמנה */}
          {tabValue === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Boolean(currentItem.ordered)}
                      onChange={handleInputChange}
                      name="ordered"
                    />
                  }
                  label="האם הפריט הוזמן?"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="הערות על ההזמנה (מחסן באדום, סטודנט בכחול)"
                  name="order_notes"
                  fullWidth
                  multiline
                  rows={3}
                  value={currentItem.order_notes || ''}
                  onChange={handleInputChange}
                  sx={{ direction: 'rtl' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="במאית"
                  name="director"
                  fullWidth
                  value={currentItem.director || ''}
                  onChange={handleInputChange}
                  sx={{ direction: 'rtl' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="מפיקה"
                  name="producer"
                  fullWidth
                  value={currentItem.producer || ''}
                  onChange={handleInputChange}
                  sx={{ direction: 'rtl' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="צלמת"
                  name="photographer"
                  fullWidth
                  value={currentItem.photographer || ''}
                  onChange={handleInputChange}
                  sx={{ direction: 'rtl' }}
                />
              </Grid>
            </Grid>
          )}
          
          {/* טאב 3: הוצאה והחזרה */}
          {tabValue === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Boolean(currentItem.checked_out)}
                      onChange={handleInputChange}
                      name="checked_out"
                    />
                  }
                  label="יצא מהמחסן"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Boolean(currentItem.checked)}
                      onChange={handleInputChange}
                      name="checked"
                    />
                  }
                  label="נבדק לפני היציאה"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="הערות על ההוצאה (מחסן באדום, סטודנט בכחול)"
                  name="checkout_notes"
                  fullWidth
                  multiline
                  rows={3}
                  value={currentItem.checkout_notes || ''}
                  onChange={handleInputChange}
                  sx={{ direction: 'rtl' }}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Boolean(currentItem.returned)}
                      onChange={handleInputChange}
                      name="returned"
                    />
                  }
                  label="חזר למחסן"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="הערות על ההחזרה"
                  name="return_notes"
                  fullWidth
                  multiline
                  rows={3}
                  value={currentItem.return_notes || ''}
                  onChange={handleInputChange}
                  sx={{ direction: 'rtl' }}
                />
              </Grid>
            </Grid>
          )}
          
          {/* טאב 4: מידע נוסף */}
          {tabValue === 3 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="מחיר ליחידה"
                  name="price_per_unit"
                  type="number"
                  fullWidth
                  value={currentItem.price_per_unit || 0}
                  onChange={handleInputChange}
                  sx={{ direction: 'rtl' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="מחיר כולל"
                  name="total_price"
                  type="number"
                  fullWidth
                  value={currentItem.total_price || 0}
                  onChange={handleInputChange}
                  sx={{ direction: 'rtl' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="שדה נוסף מהאקסל"
                  name="unnnamed_11"
                  fullWidth
                  value={currentItem.unnnamed_11 || ''}
                  onChange={handleInputChange}
                  sx={{ direction: 'rtl' }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          borderTop: '1px solid #eaeaea', 
          pt: 2,
          pb: 2,
          px: 3
        }}>
          <Button 
            onClick={handleCloseDialog} 
            color="inherit"
            sx={{ borderRadius: '8px', px: 3 }}
          >
            ביטול
          </Button>
          <Button 
            onClick={handleSaveItem} 
            color="primary" 
            variant="contained"
            sx={{ 
              borderRadius: '8px', 
              px: 3,
              fontWeight: 'bold',
              boxShadow: 1
            }}
          >
            {currentItem.id ? 'עדכן פריט' : 'הוסף פריט'}
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

export default Inventory;
