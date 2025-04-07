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
  InputAdornment
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
  const [currentItem, setCurrentItem] = useState({
    id: null,
    name: '',
    category: '',
    quantity: 0,
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
      setItems(response.data);
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
        notes: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem({
      ...currentItem,
      [name]: name === 'quantity' ? parseInt(value, 10) || 0 : value
    });
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
                <TableCell sx={{ fontWeight: 'bold' }}>שם הפריט</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>קטגוריה</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>כמות</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>הערות</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>זמינות</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.notes}</TableCell>
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
                      <IconButton onClick={() => handleOpenDialog(item)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteItem(item.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    {loading ? 'טוען נתונים...' : 'לא נמצאו פריטים'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* דיאלוג הוספה/עריכת פריט */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentItem.id ? 'עריכת פריט' : 'הוספת פריט חדש'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
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
            <Grid item xs={12}>
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
                rows={3}
                value={currentItem.notes}
                onChange={handleInputChange}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            ביטול
          </Button>
          <Button onClick={handleSaveItem} color="primary" variant="contained">
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
