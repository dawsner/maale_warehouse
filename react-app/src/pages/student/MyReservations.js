import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Chip, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Alert, CircularProgress, Grid, Card, CardContent,
  Dialog, DialogActions, DialogContent, DialogTitle, DialogContentText
} from '@mui/material';
import {
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Cancel,
  AccessTime as PendingIcon,
  EventAvailable as CompletedIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { reservationsAPI } from '../../api/api';
import { useNavigate } from 'react-router-dom';

// סטטוסים עם איקונים וצבעים
const statusLabels = {
  pending: { label: 'ממתין לאישור', color: 'warning', icon: <PendingIcon /> },
  approved: { label: 'מאושר', color: 'success', icon: <ApprovedIcon /> },
  rejected: { label: 'נדחה', color: 'error', icon: <RejectedIcon /> },
  completed: { label: 'הושלם', color: 'info', icon: <CompletedIcon /> },
  cancelled: { label: 'בוטל', color: 'default', icon: <Cancel /> }
};

function MyReservations({ userId }) {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, [userId]);

  const fetchReservations = async () => {
    if (!userId) {
      setError('מזהה משתמש לא זמין');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await reservationsAPI.getUserReservations(userId);
      setReservations(data);
      
      // חישוב סטטיסטיקה
      const statsCalc = {
        total: data.length,
        pending: data.filter(r => r.status === 'pending').length,
        approved: data.filter(r => r.status === 'approved').length,
        rejected: data.filter(r => r.status === 'rejected').length,
        completed: data.filter(r => r.status === 'completed').length
      };
      
      setStats(statsCalc);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch reservations:', err);
      setError('שגיאה בטעינת נתוני הזמנות');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (reservation) => {
    setSelectedReservation(reservation);
    setDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedReservation) return;

    setCancelLoading(true);
    try {
      const result = await reservationsAPI.updateReservationStatus(selectedReservation.id, 'cancelled');
      
      if (result.success) {
        // עדכון הרשימה המקומית
        setReservations(prev => prev.map(res => 
          res.id === selectedReservation.id ? { ...res, status: 'cancelled' } : res
        ));
        
        // עדכון הסטטיסטיקה
        setStats(prev => ({
          ...prev,
          [selectedReservation.status]: prev[selectedReservation.status] - 1,
          cancelled: (prev.cancelled || 0) + 1
        }));
      }
    } catch (err) {
      console.error('Failed to cancel reservation:', err);
      setError('שגיאה בביטול ההזמנה');
    } finally {
      setCancelLoading(false);
      setDialogOpen(false);
    }
  };

  // מציג תאריך בפורמט עברי
  const formatDate = (dateString) => {
    if (!dateString) return 'לא צוין';
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom align="right">
        ההזמנות שלי
      </Typography>

      {/* כרטיסי סטטיסטיקה */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h5" align="center">
                {stats.total}
              </Typography>
              <Typography variant="body2" align="center" color="text.secondary">
                סה"כ הזמנות
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h5" align="center" color="warning.main">
                {stats.pending}
              </Typography>
              <Typography variant="body2" align="center" color="text.secondary">
                ממתינות לאישור
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h5" align="center" color="success.main">
                {stats.approved}
              </Typography>
              <Typography variant="body2" align="center" color="text.secondary">
                מאושרות
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h5" align="center" color="info.main">
                {stats.completed}
              </Typography>
              <Typography variant="body2" align="center" color="text.secondary">
                הושלמו
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* כפתור יצירת הזמנה חדשה */}
      <Box display="flex" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<CalendarIcon />}
          onClick={() => navigate('/create-reservation')}
        >
          הזמנה חדשה
        </Button>
      </Box>

      {/* טבלת הזמנות */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#F5F5F5' }}>
              <TableRow>
                <TableCell align="right">פריט</TableCell>
                <TableCell align="right">כמות</TableCell>
                <TableCell align="right">מתאריך</TableCell>
                <TableCell align="right">עד תאריך</TableCell>
                <TableCell align="right">סטטוס</TableCell>
                <TableCell align="right">הערות</TableCell>
                <TableCell align="center">פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reservations.length > 0 ? (
                reservations.map((reservation) => (
                  <TableRow key={reservation.id} hover>
                    <TableCell align="right">{reservation.item_name}</TableCell>
                    <TableCell align="right">{reservation.quantity}</TableCell>
                    <TableCell align="right">{formatDate(reservation.start_date)}</TableCell>
                    <TableCell align="right">{formatDate(reservation.end_date)}</TableCell>
                    <TableCell align="right">
                      <Chip
                        icon={statusLabels[reservation.status]?.icon}
                        label={statusLabels[reservation.status]?.label || reservation.status}
                        color={statusLabels[reservation.status]?.color || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {reservation.notes || '-'}
                    </TableCell>
                    <TableCell align="center">
                      {(reservation.status === 'pending' || reservation.status === 'approved') && (
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => handleCancelClick(reservation)}
                        >
                          בטל
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    אין הזמנות להצגה
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* דיאלוג אישור ביטול */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      >
        <DialogTitle>ביטול הזמנה</DialogTitle>
        <DialogContent>
          <DialogContentText>
            האם אתה בטוח שברצונך לבטל את ההזמנה הבאה?
          </DialogContentText>
          {selectedReservation && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>פריט:</strong> {selectedReservation.item_name}<br />
                <strong>כמות:</strong> {selectedReservation.quantity}<br />
                <strong>תאריכים:</strong> {formatDate(selectedReservation.start_date)} - {formatDate(selectedReservation.end_date)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={cancelLoading}>
            ביטול
          </Button>
          <Button 
            onClick={handleCancelConfirm} 
            color="error" 
            variant="contained"
            disabled={cancelLoading}
          >
            {cancelLoading ? <CircularProgress size={24} /> : 'אישור ביטול'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MyReservations;