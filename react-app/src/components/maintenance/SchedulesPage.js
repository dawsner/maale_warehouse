import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Grid, Card, CardContent,
  Divider, Chip, Button, Alert, CircularProgress,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { maintenanceAPI } from '../../api/maintenanceAPI';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventIcon from '@mui/icons-material/Event';
import DeleteIcon from '@mui/icons-material/Delete';
import BuildIcon from '@mui/icons-material/Build';

// ממיר מחרוזת תאריך ISO לפורמט ישראלי
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('he-IL', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
};

const SchedulesPage = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, upcoming, overdue
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // נטען את כל תזכורות התחזוקה העתידיות ל-90 יום
        const data = await maintenanceAPI.getUpcomingMaintenanceSchedules(90);
        setSchedules(data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error loading maintenance schedules:', err);
        setError('אירעה שגיאה בטעינת תזכורות תחזוקה. אנא נסה שנית.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleBack = () => {
    navigate('/maintenance');
  };
  
  const handleViewItem = (itemId) => {
    navigate(`/maintenance/item/${itemId}`);
  };
  
  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את תזכורת התחזוקה?')) {
      try {
        await maintenanceAPI.deleteMaintenanceSchedule(scheduleId);
        // עדכון הרשימה המקומית ללא קריאת API נוספת
        setSchedules(schedules.filter(schedule => schedule.id !== scheduleId));
      } catch (err) {
        console.error('Error deleting maintenance schedule:', err);
        setError('אירעה שגיאה במחיקת תזכורת התחזוקה.');
      }
    }
  };
  
  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };
  
  // סינון התזכורות לפי הפילטר שנבחר
  const filteredSchedules = schedules.filter(schedule => {
    if (filter === 'all') return true;
    if (filter === 'overdue') return schedule.days_remaining <= 0;
    if (filter === 'upcoming7') return schedule.days_remaining > 0 && schedule.days_remaining <= 7;
    if (filter === 'upcoming30') return schedule.days_remaining > 7 && schedule.days_remaining <= 30;
    if (filter === 'future') return schedule.days_remaining > 30;
    return true;
  });
  
  // מיון התזכורות לפי ימים נותרים (הכי דחוף קודם)
  const sortedSchedules = [...filteredSchedules].sort((a, b) => a.days_remaining - b.days_remaining);
  
  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container dir="rtl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 3 }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          חזרה
        </Button>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
          <EventIcon sx={{ mr: 1 }} />
          תזכורות תחזוקה
        </Typography>
      </Box>
      
      {/* סטטיסטיקות וסיכום */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#f44336', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>באיחור</Typography>
              <Typography variant="h3" align="center">
                {schedules.filter(s => s.days_remaining <= 0).length}
              </Typography>
              <Typography variant="body2" align="center">פריטים שזמן התחזוקה שלהם עבר</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#ff9800', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>השבוע</Typography>
              <Typography variant="h3" align="center">
                {schedules.filter(s => s.days_remaining > 0 && s.days_remaining <= 7).length}
              </Typography>
              <Typography variant="body2" align="center">פריטים לתחזוקה בשבוע הקרוב</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#2196f3', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>החודש</Typography>
              <Typography variant="h3" align="center">
                {schedules.filter(s => s.days_remaining > 7 && s.days_remaining <= 30).length}
              </Typography>
              <Typography variant="body2" align="center">פריטים לתחזוקה בחודש הקרוב</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#4caf50', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>עתידי</Typography>
              <Typography variant="h3" align="center">
                {schedules.filter(s => s.days_remaining > 30).length}
              </Typography>
              <Typography variant="body2" align="center">פריטים לתחזוקה בעתיד הרחוק</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* פילטר */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-start' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="filter-select-label">סינון תזכורות</InputLabel>
          <Select
            labelId="filter-select-label"
            value={filter}
            label="סינון תזכורות"
            onChange={handleFilterChange}
          >
            <MenuItem value="all">כל התזכורות</MenuItem>
            <MenuItem value="overdue">באיחור</MenuItem>
            <MenuItem value="upcoming7">השבוע (7 ימים)</MenuItem>
            <MenuItem value="upcoming30">החודש (30 ימים)</MenuItem>
            <MenuItem value="future">עתידי (מעל 30 ימים)</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* טבלת תזכורות */}
      {sortedSchedules.length > 0 ? (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>פריט</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>סוג תחזוקה</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>תאריך יעד</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>ימים נותרים</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>תדירות</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>ביצוע אחרון</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedSchedules.map((schedule) => (
                <TableRow key={schedule.id} sx={{ 
                  '&:hover': { backgroundColor: '#f9f9f9' },
                  backgroundColor: schedule.days_remaining <= 0 ? '#ffebee' : 
                                   schedule.days_remaining <= 7 ? '#fff8e1' : 
                                   'inherit'
                }}>
                  <TableCell align="right">{schedule.item_name}</TableCell>
                  <TableCell align="right">{schedule.maintenance_type}</TableCell>
                  <TableCell align="right">{formatDate(schedule.next_due)}</TableCell>
                  <TableCell align="right">
                    <Chip 
                      label={schedule.days_remaining <= 0 ? `באיחור ${Math.abs(schedule.days_remaining)} ימים` : `${schedule.days_remaining} ימים`}
                      color={
                        schedule.days_remaining <= 0 ? 'error' :
                        schedule.days_remaining <= 7 ? 'warning' :
                        schedule.days_remaining <= 30 ? 'primary' : 'success'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">כל {schedule.frequency_days} ימים</TableCell>
                  <TableCell align="right">{schedule.last_performed ? formatDate(schedule.last_performed) : 'לא בוצע'}</TableCell>
                  <TableCell align="center">
                    <Box>
                      <IconButton 
                        color="primary" 
                        onClick={() => handleViewItem(schedule.item_id)}
                        title="ניהול תחזוקה"
                      >
                        <BuildIcon />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        title="מחק תזכורת"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info">
          {filter === 'all' 
            ? 'אין תזכורות תחזוקה במערכת.' 
            : 'אין תזכורות תחזוקה התואמות לסינון שנבחר.'}
        </Alert>
      )}
    </Container>
  );
};

export default SchedulesPage;