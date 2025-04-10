import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Card, 
  CardContent,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';

// Material UI Icons
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import MovieIcon from '@mui/icons-material/Movie';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import WarningIcon from '@mui/icons-material/Warning';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';

// Chart libraries 
import { PieChart, Pie, ResponsiveContainer, Cell, Tooltip as RechartsTooltip } from 'recharts';

import { dashboardAPI } from '../api/api';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const COLORS = ['#1E2875', '#3F51B5', '#EC407A', '#FF9800', '#4CAF50', '#9C27B0'];

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardAPI.getDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('שגיאה בטעינת נתוני הדשבורד. נא לרענן את הדף.');
    } finally {
      setLoading(false);
    }
  };

  // עזרה בעיבוד נתונים לתרשימים
  const prepareAvailabilityData = () => {
    if (!dashboardData || !dashboardData.inventory_summary || !dashboardData.inventory_summary.availability) {
      return [];
    }

    const { available, unavailable } = dashboardData.inventory_summary.availability;
    return [
      { name: 'זמין', value: available || 0 },
      { name: 'לא זמין', value: unavailable || 0 }
    ];
  };

  const prepareCategoryData = () => {
    if (!dashboardData || !dashboardData.inventory_summary || !dashboardData.inventory_summary.categories) {
      return [];
    }

    // לוקח רק את 5 הקטגוריות הגדולות ביותר
    return dashboardData.inventory_summary.categories
      .slice(0, 5)
      .map(category => ({
        name: category.name,
        value: category.total_quantity
      }));
  };

  // רינדור של תצוגות שונות
  const renderSummaryCards = () => {
    if (!dashboardData || !dashboardData.inventory_summary) {
      return (
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid key={item} item xs={12} md={3}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress />
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      );
    }

    const { total_items, total_quantity, category_count, loaned_items } = dashboardData.inventory_summary.overview;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              background: 'linear-gradient(45deg, #1E2875 30%, #3F51B5 90%)',
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography component="h2" variant="h6" fontWeight="bold">
                סך פריטים
              </Typography>
              <InventoryIcon />
            </Box>
            <Typography component="p" variant="h3" sx={{ my: 'auto', fontWeight: 'bold' }}>
              {total_items}
            </Typography>
            <Typography variant="body2">סה"כ {total_quantity} יחידות במלאי</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              background: 'linear-gradient(45deg, #EC407A 30%, #F48FB1 90%)',
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography component="h2" variant="h6" fontWeight="bold">
                פריטים מושאלים
              </Typography>
              <AssignmentReturnIcon />
            </Box>
            <Typography component="p" variant="h3" sx={{ my: 'auto', fontWeight: 'bold' }}>
              {loaned_items}
            </Typography>
            <Typography variant="body2">פריטים שנמצאים כרגע בשימוש</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              background: 'linear-gradient(45deg, #FF9800 30%, #FFCC80 90%)',
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography component="h2" variant="h6" fontWeight="bold">
                קטגוריות
              </Typography>
              <CategoryIcon />
            </Box>
            <Typography component="p" variant="h3" sx={{ my: 'auto', fontWeight: 'bold' }}>
              {category_count}
            </Typography>
            <Typography variant="body2">סוגי ציוד שונים במלאי</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              background: 'linear-gradient(45deg, #4CAF50 30%, #A5D6A7 90%)',
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography component="h2" variant="h6" fontWeight="bold">
                {dashboardData.upcoming_reservations ? dashboardData.upcoming_reservations.length : 0} הזמנות
              </Typography>
              <BookmarkIcon />
            </Box>
            <Typography component="p" variant="h3" sx={{ my: 'auto', fontWeight: 'bold' }}>
              {dashboardData.active_loans ? dashboardData.active_loans.length : 0}
            </Typography>
            <Typography variant="body2">השאלות פעילות במערכת</Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderAvailabilityChart = () => {
    const data = prepareAvailabilityData();
    
    return (
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography component="h2" variant="h6" fontWeight="bold" mb={2}>
          זמינות ציוד
        </Typography>
        <Box sx={{ height: 250, display: 'flex', justifyContent: 'center' }}>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <Typography variant="body1" color="text.secondary" align="center">
                אין נתונים להצגה
              </Typography>
            </Box>
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" align="center" mt={2}>
          יחס בין פריטי המלאי הזמינים לאלו שאינם זמינים
        </Typography>
      </Paper>
    );
  };

  const renderCategoryChart = () => {
    const data = prepareCategoryData();
    
    return (
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography component="h2" variant="h6" fontWeight="bold" mb={2}>
          התפלגות לפי קטגוריות
        </Typography>
        <Box sx={{ height: 250, display: 'flex', justifyContent: 'center' }}>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <Typography variant="body1" color="text.secondary" align="center">
                אין נתונים להצגה
              </Typography>
            </Box>
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" align="center" mt={2}>
          התפלגות פריטים לפי 5 הקטגוריות המובילות
        </Typography>
      </Paper>
    );
  };

  const renderActiveLoans = () => {
    if (!dashboardData || !dashboardData.active_loans) {
      return (
        <Paper sx={{ p: 2, height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        </Paper>
      );
    }

    const { active_loans } = dashboardData;

    return (
      <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography component="h2" variant="h6" fontWeight="bold">
            השאלות פעילות
          </Typography>
          <Chip 
            label={`${active_loans.length} השאלות`} 
            color="primary" 
            size="small" 
          />
        </Box>
        
        {active_loans.length > 0 ? (
          <List sx={{ width: '100%' }}>
            {active_loans.map((loan, index) => (
              <React.Fragment key={loan.id}>
                <ListItem
                  sx={{
                    borderRight: '4px solid #1E2875',
                    mb: 1,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                  }}
                >
                  <ListItemIcon>
                    <MovieIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${loan.item_name} (${loan.quantity} יח')`}
                    secondary={
                      <React.Fragment>
                        <Typography component="span" variant="body2" color="text.primary">
                          {loan.student_name}
                        </Typography>
                        {` — להחזרה עד ${loan.due_date}`}
                      </React.Fragment>
                    }
                  />
                </ListItem>
                {index < active_loans.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <Typography variant="body2" color="text.secondary">
              אין השאלות פעילות כרגע
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  const renderOverdueLoans = () => {
    if (!dashboardData || !dashboardData.overdue_loans) {
      return (
        <Paper sx={{ p: 2, height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        </Paper>
      );
    }

    const { overdue_loans } = dashboardData;

    return (
      <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography component="h2" variant="h6" fontWeight="bold" color="error">
            פריטים בפיגור
          </Typography>
          <Chip 
            label={`${overdue_loans.length} באיחור`} 
            color="error" 
            size="small" 
            icon={<WarningIcon />}
          />
        </Box>
        
        {overdue_loans.length > 0 ? (
          <List sx={{ width: '100%' }}>
            {overdue_loans.map((loan, index) => (
              <React.Fragment key={loan.id}>
                <ListItem
                  sx={{
                    borderRight: '4px solid #f44336',
                    mb: 1,
                    bgcolor: 'rgba(244, 67, 54, 0.08)',
                    borderRadius: 1,
                  }}
                >
                  <ListItemIcon>
                    <WarningIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${loan.item_name} (${loan.quantity} יח')`}
                    secondary={
                      <React.Fragment>
                        <Typography component="span" variant="body2" color="text.primary">
                          {loan.student_name}
                        </Typography>
                        {` — באיחור של ${loan.days_overdue} ימים`}
                      </React.Fragment>
                    }
                  />
                </ListItem>
                {index < overdue_loans.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
            <Alert severity="success" sx={{ width: '100%' }}>
              אין פריטים בפיגור! כל הכבוד.
            </Alert>
          </Box>
        )}
      </Paper>
    );
  };

  const renderUpcomingReservations = () => {
    if (!dashboardData || !dashboardData.upcoming_reservations) {
      return (
        <Paper sx={{ p: 2, height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        </Paper>
      );
    }

    const { upcoming_reservations } = dashboardData;

    return (
      <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography component="h2" variant="h6" fontWeight="bold">
            הזמנות קרובות
          </Typography>
          <Chip 
            label={`${upcoming_reservations.length} הזמנות`} 
            color="primary" 
            variant="outlined"
            size="small" 
            icon={<ScheduleIcon />}
          />
        </Box>
        
        {upcoming_reservations.length > 0 ? (
          <List sx={{ width: '100%' }}>
            {upcoming_reservations.map((reservation, index) => (
              <React.Fragment key={reservation.id}>
                <ListItem
                  sx={{
                    borderRight: '4px solid #FF9800',
                    mb: 1,
                    bgcolor: 'rgba(255, 152, 0, 0.08)',
                    borderRadius: 1,
                  }}
                >
                  <ListItemIcon>
                    <ScheduleIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${reservation.item_name} (${reservation.quantity} יח')`}
                    secondary={
                      <React.Fragment>
                        <Typography component="span" variant="body2" color="text.primary">
                          {reservation.student_name}
                        </Typography>
                        {` — מ-${reservation.start_date} עד ${reservation.end_date}`}
                      </React.Fragment>
                    }
                  />
                  <Chip 
                    label={reservation.status === 'pending' ? 'ממתין לאישור' : 'מאושר'} 
                    color={reservation.status === 'pending' ? 'warning' : 'success'} 
                    size="small" 
                    sx={{ ml: 1 }}
                  />
                </ListItem>
                {index < upcoming_reservations.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <Typography variant="body2" color="text.secondary">
              אין הזמנות קרובות כרגע
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  const renderPopularItems = () => {
    if (!dashboardData || !dashboardData.popular_items) {
      return (
        <Paper sx={{ p: 2, height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        </Paper>
      );
    }

    const { popular_items } = dashboardData;

    return (
      <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography component="h2" variant="h6" fontWeight="bold">
            פריטים פופולריים
          </Typography>
          <TrendingUpIcon color="primary" />
        </Box>
        
        {popular_items.length > 0 ? (
          <List sx={{ width: '100%' }}>
            {popular_items.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem
                  sx={{
                    mb: 1,
                    borderRadius: 1,
                  }}
                >
                  <ListItemText
                    primary={item.name}
                    secondary={`קטגוריה: ${item.category}`}
                  />
                  <Chip 
                    label={`${item.loan_count} השאלות`} 
                    color="primary" 
                    size="small" 
                    sx={{ ml: 1 }}
                  />
                </ListItem>
                {index < popular_items.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <Typography variant="body2" color="text.secondary">
              אין מספיק נתונים להצגת פריטים פופולריים
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  const renderLowStockItems = () => {
    if (!dashboardData || !dashboardData.low_stock_items) {
      return (
        <Paper sx={{ p: 2, height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        </Paper>
      );
    }

    const { low_stock_items } = dashboardData;

    return (
      <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography component="h2" variant="h6" fontWeight="bold" color="warning.main">
            מלאי נמוך
          </Typography>
          <Chip 
            label={`${low_stock_items.length} פריטים`} 
            color="warning" 
            size="small" 
            icon={<WarningIcon />}
          />
        </Box>
        
        {low_stock_items.length > 0 ? (
          <List sx={{ width: '100%' }}>
            {low_stock_items.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem
                  sx={{
                    borderRight: '4px solid #FF9800',
                    mb: 1,
                    bgcolor: 'rgba(255, 152, 0, 0.08)',
                    borderRadius: 1,
                  }}
                >
                  <ListItemText
                    primary={item.name}
                    secondary={`קטגוריה: ${item.category}`}
                  />
                  <Box sx={{ minWidth: 120 }}>
                    <Typography variant="body2" color="text.secondary" align="center" mb={0.5}>
                      {item.available_quantity}/{item.total_quantity} זמינים
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={item.percent_available} 
                      color={item.percent_available < 10 ? "error" : "warning"} 
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                </ListItem>
                {index < low_stock_items.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
            <Alert severity="success" sx={{ width: '100%' }}>
              כל הפריטים במלאי מספיק!
            </Alert>
          </Box>
        )}
      </Paper>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      
      {/* כותרת וכפתורים */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography component="h1" variant="h4" fontWeight="bold">
          דשבורד ניהול מחסן
        </Typography>
        <Box>
          <Tooltip title="רענן נתונים">
            <IconButton onClick={fetchDashboardData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="הגדרות">
            <IconButton>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 3 }} />}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {/* כרטיסי סיכום */}
      {renderSummaryCards()}

      {/* שורת תרשימים */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          {renderAvailabilityChart()}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderCategoryChart()}
        </Grid>
      </Grid>

      {/* שורת רשימות */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          {renderActiveLoans()}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderOverdueLoans()}
        </Grid>
      </Grid>

      {/* שורת רשימות נוספת */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          {renderUpcomingReservations()}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderLowStockItems()}
        </Grid>
      </Grid>

      {/* רשימה אחרונה - פריטים פופולריים */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          {renderPopularItems()}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;