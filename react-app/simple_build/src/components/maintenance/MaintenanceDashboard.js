import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Card, CardContent, 
  Grid, Paper, Divider, Chip, Button, Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { maintenanceAPI } from '../../api/maintenanceAPI';
import BuildIcon from '@mui/icons-material/Build';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventIcon from '@mui/icons-material/Event';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(2),
  color: theme.palette.text.primary,
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
}));

const StatusChip = styled(Chip)(({ status, theme }) => {
  let color;
  
  switch (status) {
    case 'operational':
      color = '#4caf50';
      break;
    case 'in_maintenance':
      color = '#ff9800';
      break;
    case 'out_of_order':
      color = '#f44336';
      break;
    case 'warning':
      color = '#ff9800';
      break;
    default:
      color = theme.palette.grey[500];
  }
  
  return {
    backgroundColor: color,
    color: '#fff',
    fontWeight: 'bold'
  };
});

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

const MaintenanceDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // טעינת נתוני תחזוקה בטעינת הדף
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // טעינת סקירה כללית
        const overviewData = await maintenanceAPI.getMaintenanceOverview();
        setOverview(overviewData);
        
        // טעינת תזכורות קרובות
        const upcomingData = await maintenanceAPI.getUpcomingMaintenanceSchedules(30);
        setUpcomingMaintenance(upcomingData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading maintenance data:', err);
        setError('אירעה שגיאה בטעינת נתוני תחזוקה. אנא נסה שנית.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // ניווט לדף עריכת תחזוקה של פריט
  const handleEditMaintenanceItem = (itemId) => {
    navigate(`/maintenance/item/${itemId}`);
  };
  
  // ניווט לניהול תזכורות תחזוקה
  const handleViewSchedules = () => {
    navigate('/maintenance/schedules');
  };
  
  if (loading) {
    return (
      <Container>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography>טוען נתוני תחזוקה...</Typography>
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
    <Container maxWidth="xl">
      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 3, mb: 4, textAlign: 'right' }}>
        <BuildIcon sx={{ ml: 1 }} />
        מערכת ניהול תחזוקה ותיקונים
      </Typography>
      
      {/* כרטיסיות מצב כללי */}
      <Grid container spacing={3} mb={4} dir="rtl">
        <Grid item xs={12} md={3}>
          <Item>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BuildIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">פריטים בתחזוקה</Typography>
            </Box>
            <Typography variant="h3" align="center" sx={{ my: 2, fontWeight: 'bold', color: '#ff9800' }}>
              {overview?.in_maintenance_count || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              מתוך {overview?.total_issues_count || 0} בעיות פתוחות
            </Typography>
          </Item>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Item>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WarningIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="h6">מושבתים</Typography>
            </Box>
            <Typography variant="h3" align="center" sx={{ my: 2, fontWeight: 'bold', color: '#f44336' }}>
              {overview?.out_of_order_count || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              פריטים שאינם שמישים
            </Typography>
          </Item>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Item>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EventIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">תזכורות קרובות</Typography>
            </Box>
            <Typography variant="h3" align="center" sx={{ my: 2, fontWeight: 'bold', color: '#2196f3' }}>
              {upcomingMaintenance?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              ב-30 הימים הקרובים
            </Typography>
            {upcomingMaintenance?.length > 0 && (
              <Button 
                variant="outlined" 
                onClick={handleViewSchedules} 
                sx={{ mt: 'auto', alignSelf: 'center' }}
              >
                צפייה בתזכורות
              </Button>
            )}
          </Item>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Item>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <VerifiedUserIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">באחריות</Typography>
            </Box>
            <Typography variant="h3" align="center" sx={{ my: 2, fontWeight: 'bold', color: '#4caf50' }}>
              {overview?.under_warranty_count || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              פריטים תחת אחריות יצרן
            </Typography>
          </Item>
        </Grid>
      </Grid>
      
      {/* פריטים בתחזוקה */}
      {overview?.in_maintenance_items?.length > 0 && (
        <Box mb={4}>
          <Typography variant="h5" gutterBottom align="right">
            פריטים בתהליך תחזוקה
          </Typography>
          <Grid container spacing={2} dir="rtl">
            {overview.in_maintenance_items.map((item) => (
              <Grid item xs={12} md={6} lg={4} key={item.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" component="div">
                        {item.name}
                      </Typography>
                      <StatusChip 
                        label={item.status === 'in_maintenance' ? 'בתחזוקה' : 'מושבת'} 
                        status={item.status}
                      />
                    </Box>
                    <Typography color="text.secondary" sx={{ mb: 1 }}>
                      קטגוריה: {item.category}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      הערות: {item.notes || 'אין הערות'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      תאריך עדכון: {formatDate(item.updated_at)}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button 
                        variant="contained" 
                        size="small" 
                        onClick={() => handleEditMaintenanceItem(item.item_id)}
                      >
                        ניהול תחזוקה
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
      
      {/* תזכורות תחזוקה קרובות */}
      {upcomingMaintenance && Array.isArray(upcomingMaintenance) && upcomingMaintenance.length > 0 && (
        <Box mb={4}>
          <Typography variant="h5" gutterBottom align="right">
            תזכורות תחזוקה קרובות
          </Typography>
          <Grid container spacing={2} dir="rtl">
            {Array.isArray(upcomingMaintenance) && upcomingMaintenance.slice(0, 6).map((schedule) => (
              <Grid item xs={12} md={6} lg={4} key={schedule.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" component="div">
                        {schedule.item_name}
                      </Typography>
                      <Chip 
                        label={`${schedule.days_remaining} ימים`} 
                        color={schedule.days_remaining <= 7 ? "error" : "warning"}
                      />
                    </Box>
                    <Typography color="text.secondary" sx={{ mb: 1 }}>
                      סוג תחזוקה: {schedule.maintenance_type}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      תיאור: {schedule.description || '-'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      תאריך יעד: {formatDate(schedule.next_due)}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button 
                        variant="contained" 
                        size="small" 
                        onClick={() => handleEditMaintenanceItem(schedule.item_id)}
                      >
                        ניהול תחזוקה
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          {Array.isArray(upcomingMaintenance) && upcomingMaintenance.length > 6 && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button 
                variant="outlined" 
                onClick={handleViewSchedules}
              >
                הצג את כל התזכורות ({upcomingMaintenance.length})
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
};

export default MaintenanceDashboard;