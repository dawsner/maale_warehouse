import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Button,
  InputAdornment,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { inventoryAPI } from '../../api/api';

function AvailableItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

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

  // קבלת כל הקטגוריות הייחודיות מהפריטים
  const categories = ['all', ...new Set(items.map(item => item.category))];

  // סינון פריטים לפי חיפוש וקטגוריה
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory && item.is_available && item.quantity > 0;
  });

  const categoryFilterHandler = (category) => {
    setCategoryFilter(category);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: 'bold', color: '#373B5C' }}>
          פריטים זמינים
        </Typography>
        <Typography variant="body1" sx={{ color: '#9197B3' }}>
          רשימת הציוד הזמין להשאלה או הזמנה
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
        </Grid>
        
        {/* סינון לפי קטגוריות */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {categories.map(category => (
            <Chip 
              key={category}
              label={category === 'all' ? 'הכל' : category}
              onClick={() => categoryFilterHandler(category)}
              color={categoryFilter === category ? 'primary' : 'default'}
              variant={categoryFilter === category ? 'filled' : 'outlined'}
              sx={{ 
                fontWeight: categoryFilter === category ? 'bold' : 'normal',
                px: 1
              }}
            />
          ))}
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>שם הפריט</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>קטגוריה</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>כמות זמינה</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>הערות</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>פעולות</TableCell>
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
                        variant="contained" 
                        size="small"
                        color="primary"
                        href="/book-equipment"
                      >
                        הזמן פריט
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    {loading ? 'טוען נתונים...' : 'לא נמצאו פריטים זמינים'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}

export default AvailableItems;
