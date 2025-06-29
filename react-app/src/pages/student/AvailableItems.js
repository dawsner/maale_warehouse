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
  Button,
  InputAdornment,
  Chip,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SchoolIcon from '@mui/icons-material/School';
import { inventoryAPI } from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';

function AvailableItems() {
  const authContext = useAuth();
  const user = authContext?.user;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
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
      console.log('Inventory data received:', response.data?.length, 'items');
      setItems(response.data || []);
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
  const categories = ['all', ...new Set((items || []).map(item => item.category))];

  // המרת שנת לימוד למספר
  const studyYearToNumber = (studyYear) => {
    switch (studyYear) {
      case 'first': return '1';
      case 'second': return '2';
      case 'third': return '3';
      default: return null;
    }
  };

  // סינון פריטים לפי חיפוש, קטגוריה והרשאות שנת לימוד
  const filteredItems = (items || []).filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    
    // בדיקת הרשאות שנת לימוד
    let hasPermission = true;
    if (user && user.study_year && item.allowed_years) {
      const userYearNumber = studyYearToNumber(user.study_year);
      if (userYearNumber) {
        // בדיקה אם שנת הלימוד של המשתמש מופיעה ב-allowed_years
        const allowedYearsList = item.allowed_years.split(',').map(y => y.trim());
        hasPermission = allowedYearsList.includes(userYearNumber);
        
        // דיבאג לבדיקה
        if (!hasPermission) {
          console.log(`User year: ${userYearNumber}, Item allowed years: ${allowedYearsList}, Permission: ${hasPermission}`);
        }
      }
    }
    
    return matchesSearch && matchesCategory && item.is_available && item.quantity > 0 && hasPermission;
  });

  // דיבאג נוסף
  console.log(`User: ${user?.username}, Study Year: ${user?.study_year}, Filtered Items: ${filteredItems.length}`);
  if (filteredItems.length === 0 && items.length > 0) {
    console.log('No items after filtering. User year:', user?.study_year, 'Items count:', items.length);
    // בדיקה זמנית לכל פריט
    console.log('Sample item permissions:', items[0]?.allowed_years, 'User year number:', studyYearToNumber(user?.study_year));
  }

  const categoryFilterHandler = (category) => {
    setCategoryFilter(category);
  };

  const getStudyYearText = (year) => {
    switch (year) {
      case 'first': return 'שנה א\'';
      case 'second': return 'שנה ב\'';
      case 'third': return 'שנה ג\'';
      default: return year || 'לא מוגדר';
    }
  };

  const getBranchText = (branch) => {
    switch (branch) {
      case 'main': return 'מחלקה ראשית';
      case 'haredi': return 'מחלקה חרדית';
      default: return branch || 'לא מוגדר';
    }
  };

  // רכיב כרטיסיה למובייל
  const ItemCard = ({ item }) => (
    <Card 
      sx={{ 
        mb: 2, 
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #CECECE'
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#373B5C' }}>
            {item.name}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Chip 
              label={item.category} 
              size="small" 
              sx={{ 
                backgroundColor: '#f5f5f5', 
                color: '#666',
                fontSize: '0.75rem'
              }} 
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                זמין:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1E2875' }}>
                {item.available_quantity} / {item.quantity}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            pt: 1 
          }}>
            <LinearProgress 
              variant="determinate" 
              value={(item.available_quantity / item.quantity) * 100}
              sx={{ 
                flexGrow: 1, 
                mr: 2,
                height: 6,
                borderRadius: 3,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: item.available_quantity > 0 ? '#4caf50' : '#f44336'
                }
              }}
            />
            <Typography 
              variant="caption" 
              sx={{ 
                color: item.available_quantity > 0 ? '#4caf50' : '#f44336',
                fontWeight: 'bold'
              }}
            >
              {item.available_quantity > 0 ? 'זמין' : 'אין במלאי'}
            </Typography>
          </Box>
          
          {item.notes && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {item.notes}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        mt: isMobile ? 2 : 4, 
        mb: 4,
        px: isMobile ? 1 : 3
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center', 
          gap: 2, 
          mb: 2 
        }}>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            component="h1" 
            sx={{ fontWeight: 'bold', color: '#373B5C' }}
          >
            פריטים זמינים
          </Typography>
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SchoolIcon sx={{ color: '#9197B3', fontSize: 20 }} />
              <Chip 
                label={`${getStudyYearText(user.study_year)} | ${getBranchText(user.branch)}`}
                size="small"
                sx={{ 
                  backgroundColor: '#373B5C', 
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>
          )}
        </Box>
        <Typography variant="body1" sx={{ color: '#9197B3' }}>
          רשימת הציוד הזמין להשאלה או הזמנה לפי ההרשאות שלך
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
        
        {/* תצוגה רספונסיבית */}
        {isMobile ? (
          // תצוגת כרטיסיות למובייל
          <Box>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  לא נמצאו פריטים העונים על הקריטריונים
                </Typography>
              </Paper>
            )}
          </Box>
        ) : (
          // תצוגת טבלה לדסקטופ
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
        )}
      </Paper>
    </Container>
  );
}

export default AvailableItems;
