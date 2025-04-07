import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  Chip,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Button
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventIcon from '@mui/icons-material/Event';
import InventoryIcon from '@mui/icons-material/Inventory';
import { loansAPI, reservationsAPI } from '../../api/api';

function MyEquipment({ userId }) {
  const [activeTab, setActiveTab] = useState(0);
  const [loans, setLoans] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) {
      fetchUserData(userId);
    }
  }, [userId]);

  const fetchUserData = async (userId) => {
    try {
      setLoading(true);
      const [loansResponse, reservationsResponse] = await Promise.all([
        loansAPI.getByUser(userId),
        reservationsAPI.getByUser(userId)
      ]);
      
      setLoans(loansResponse.data);
      setReservations(reservationsResponse.data);
      setError('');
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('שגיאה בטעינת נתוני הציוד');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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

  const getReservationStatus = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'ממתין לאישור', color: 'warning' };
      case 'approved':
        return { label: 'מאושר', color: 'success' };
      case 'rejected':
        return { label: 'נדחה', color: 'error' };
      case 'canceled':
        return { label: 'בוטל', color: 'default' };
      default:
        return { label: 'לא ידוע', color: 'default' };
    }
  };

  // סינון השאלות פעילות בלבד (שלא הוחזרו)
  const activeLoans = loans.filter(loan => !loan.return_date);
  // סינון השאלות שהוחזרו
  const returnedLoans = loans.filter(loan => loan.return_date);
  // סינון הזמנות ממתינות ומאושרות
  const activeReservations = reservations.filter(res => 
    res.status === 'pending' || res.status === 'approved'
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: 'bold', color: '#373B5C' }}>
          הציוד שלי
        </Typography>
        <Typography variant="body1" sx={{ color: '#9197B3' }}>
          צפייה בהשאלות והזמנות הציוד שלך
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* כרטיסי סיכום */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 2, 
              border: '1px solid #CECECE',
              height: '100%',
              backgroundColor: '#FAFBFF'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  backgroundColor: 'rgba(30, 40, 117, 0.1)', 
                  borderRadius: '50%', 
                  p: 1.5, 
                  mr: 2 
                }}>
                  <InventoryIcon sx={{ color: '#1E2875' }} />
                </Box>
                <Box>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                    ציוד מושאל
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9197B3' }}>
                    פריטים בהשאלה
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#373B5C' }}>
                {activeLoans.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 2, 
              border: '1px solid #CECECE',
              height: '100%',
              backgroundColor: '#FAFBFF'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  backgroundColor: 'rgba(250, 173, 20, 0.1)', 
                  borderRadius: '50%', 
                  p: 1.5, 
                  mr: 2 
                }}>
                  <EventIcon sx={{ color: '#FAAD14' }} />
                </Box>
                <Box>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                    הזמנות ממתינות
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9197B3' }}>
                    בתהליך אישור
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#373B5C' }}>
                {activeReservations.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 2, 
              border: '1px solid #CECECE',
              height: '100%',
              backgroundColor: '#FAFBFF'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  backgroundColor: 'rgba(82, 196, 26, 0.1)', 
                  borderRadius: '50%', 
                  p: 1.5, 
                  mr: 2 
                }}>
                  <AssignmentIcon sx={{ color: '#52C41A' }} />
                </Box>
                <Box>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                    היסטוריית השאלות
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9197B3' }}>
                    פריטים שהוחזרו
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#373B5C' }}>
                {returnedLoans.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #CECECE' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
            <Tab label="ציוד מושאל" />
            <Tab label="הזמנות" />
            <Tab label="היסטוריה" />
          </Tabs>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        {/* תצוגת השאלות פעילות */}
        {activeTab === 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>שם הפריט</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>כמות</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>תאריך השאלה</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>תאריך החזרה</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>סטטוס</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeLoans.length > 0 ? (
                  activeLoans.map((loan) => {
                    const status = getLoanStatus(loan);
                    return (
                      <TableRow key={loan.id} hover>
                        <TableCell>{loan.item_name}</TableCell>
                        <TableCell>{loan.quantity}</TableCell>
                        <TableCell>{formatDate(loan.loan_date)}</TableCell>
                        <TableCell>{formatDate(loan.due_date)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={status.label} 
                            color={status.color} 
                            size="small" 
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      {loading ? 'טוען נתונים...' : 'אין ציוד בהשאלה כרגע'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {/* תצוגת הזמנות */}
        {activeTab === 1 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>שם הפריט</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>כמות</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>מתאריך</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>עד תאריך</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>סטטוס</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>פעולות</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reservations.length > 0 ? (
                  reservations.map((reservation) => {
                    const status = getReservationStatus(reservation.status);
                    return (
                      <TableRow key={reservation.id} hover>
                        <TableCell>{reservation.item_name}</TableCell>
                        <TableCell>{reservation.quantity}</TableCell>
                        <TableCell>{formatDate(reservation.start_date)}</TableCell>
                        <TableCell>{formatDate(reservation.end_date)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={status.label} 
                            color={status.color} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          {reservation.status === 'pending' && (
                            <Button size="small" color="error" variant="outlined">
                              בטל הזמנה
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      {loading ? 'טוען נתונים...' : 'אין הזמנות פעילות'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {/* היסטוריית השאלות */}
        {activeTab === 2 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>שם הפריט</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>כמות</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>תאריך השאלה</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>תאריך החזרה</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>הערות</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {returnedLoans.length > 0 ? (
                  returnedLoans.map((loan) => (
                    <TableRow key={loan.id} hover>
                      <TableCell>{loan.item_name}</TableCell>
                      <TableCell>{loan.quantity}</TableCell>
                      <TableCell>{formatDate(loan.loan_date)}</TableCell>
                      <TableCell>{formatDate(loan.return_date)}</TableCell>
                      <TableCell>{loan.return_notes || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      {loading ? 'טוען נתונים...' : 'אין היסטוריית השאלות'}
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

export default MyEquipment;
