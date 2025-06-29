import React, { useContext, useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Avatar,
  Chip,
  Grid,
  Paper,
  Divider,
  Alert,
  Button
} from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { loansAPI, reservationsAPI } from '../../api/api';

function Profile() {
  const { user } = useAuth();
  const [userLoans, setUserLoans] = useState([]);
  const [userReservations, setUserReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // קבלת השאלות של המשתמש
      const loansResponse = await loansAPI.getUserLoans(user.id);
      if (loansResponse && Array.isArray(loansResponse)) {
        setUserLoans(loansResponse);
      }

      // קבלת הזמנות של המשתמש
      const reservationsResponse = await reservationsAPI.getUserReservations(user.id);
      if (reservationsResponse && Array.isArray(reservationsResponse)) {
        setUserReservations(reservationsResponse);
      }

    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.id) {
      fetchUserData();
    }
  }, [user]);

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'פעילה';
      case 'pending': return 'בהמתנה';
      case 'approved': return 'מאושרת';
      case 'overdue': return 'באיחור';
      case 'returned': return 'הוחזרה';
      default: return status || 'לא ידוע';
    }
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">שגיאה בטעינת פרטי המשתמש</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* כותרת העמוד */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: 'bold', color: '#373B5C' }}>
          פרופיל אישי
        </Typography>
        <Typography variant="body1" sx={{ color: '#9197B3' }}>
          פרטים אישיים וסיכום פעילות
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* פרטים אישיים */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #CECECE', height: 'fit-content' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{ 
                  width: 80, 
                  height: 80, 
                  mb: 2, 
                  bgcolor: '#373B5C',
                  fontSize: '2rem'
                }}
              >
                {user.full_name ? user.full_name.charAt(0) : user.username.charAt(0)}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#373B5C', textAlign: 'center' }}>
                {user.full_name || user.username}
              </Typography>
              <Chip 
                label={user.role === 'student' ? 'סטודנט' : user.role}
                color="primary"
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon sx={{ color: '#9197B3', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: '#9197B3' }}>
                  שם משתמש: {user.username}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon sx={{ color: '#9197B3', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: '#9197B3' }}>
                  אימייל: {user.email || 'לא מוגדר'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon sx={{ color: '#9197B3', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: '#9197B3' }}>
                  שנת לימוד: {getStudyYearText(user.study_year)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon sx={{ color: '#9197B3', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: '#9197B3' }}>
                  מחלקה: {getBranchText(user.branch)}
                </Typography>
              </Box>

              {user.created_at && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon sx={{ color: '#9197B3', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: '#9197B3' }}>
                    חבר מאז: {new Date(user.created_at).toLocaleDateString('he-IL')}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* השאלות פעילות */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #CECECE', mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#373B5C' }}>
              השאלות פעילות ({userLoans.filter(loan => !loan.returned).length})
            </Typography>
            
            {userLoans.filter(loan => !loan.returned).length === 0 ? (
              <Typography variant="body2" sx={{ color: '#9197B3', textAlign: 'center', py: 2 }}>
                אין השאלות פעילות כרגע
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {userLoans.filter(loan => !loan.returned).slice(0, 5).map((loan) => (
                  <Card key={loan.id} sx={{ border: '1px solid #ECECEC' }}>
                    <CardContent sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {loan.item_name || 'פריט לא ידוע'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#9197B3' }}>
                            כמות: {loan.quantity} | תאריך החזרה: {new Date(loan.due_date).toLocaleDateString('he-IL')}
                          </Typography>
                        </Box>
                        <Chip
                          label={getStatusText(loan.status)}
                          color={getStatusColor(loan.status)}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>

          {/* הזמנות פעילות */}
          <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #CECECE' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#373B5C' }}>
              הזמנות פעילות ({userReservations.filter(res => res.status !== 'completed').length})
            </Typography>
            
            {userReservations.filter(res => res.status !== 'completed').length === 0 ? (
              <Typography variant="body2" sx={{ color: '#9197B3', textAlign: 'center', py: 2 }}>
                אין הזמנות פעילות כרגע
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {userReservations.filter(res => res.status !== 'completed').slice(0, 5).map((reservation) => (
                  <Card key={reservation.id} sx={{ border: '1px solid #ECECEC' }}>
                    <CardContent sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {reservation.item_name || 'פריט לא ידוע'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#9197B3' }}>
                            כמות: {reservation.quantity} | 
                            תאריכים: {new Date(reservation.start_date).toLocaleDateString('he-IL')} - {new Date(reservation.end_date).toLocaleDateString('he-IL')}
                          </Typography>
                        </Box>
                        <Chip
                          label={getStatusText(reservation.status)}
                          color={getStatusColor(reservation.status)}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Profile;