import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Tabs, Tab, Chip, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, TablePagination, IconButton, Tooltip,
  Dialog, DialogActions, DialogContent, DialogTitle, 
  Alert, CircularProgress
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as ApprovedIcon,
  CheckCircle,
  Cancel as RejectedIcon,
  AccessTime as PendingIcon,
  EventAvailable as CompletedIcon
} from '@mui/icons-material';
import { reservationsAPI } from '../api/api';

const statusLabels = {
  pending: { label: 'ממתין לאישור', color: 'warning', icon: <PendingIcon /> },
  approved: { label: 'מאושר', color: 'success', icon: <ApprovedIcon /> },
  rejected: { label: 'נדחה', color: 'error', icon: <RejectedIcon /> },
  completed: { label: 'הושלם', color: 'info', icon: <CompletedIcon /> },
  cancelled: { label: 'בוטל', color: 'default', icon: <CloseIcon /> }
};

// קומפוננטה שמציגה את כל ההזמנות ומאפשרת ניהול שלהם
function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0); // 0 = pending, 1 = approved, 2 = all
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ message: '', severity: 'info', show: false });

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const data = await reservationsAPI.getReservations();
      setReservations(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch reservations:', err);
      setError('שגיאה בטעינת נתוני הזמנות');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0); // Reset to first page when changing tabs
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleActionClick = (reservation, type) => {
    setSelectedReservation(reservation);
    setActionType(type);
    setActionDialogOpen(true);
  };

  const handleActionConfirm = async () => {
    if (!selectedReservation || !actionType) return;

    setActionLoading(true);
    try {
      let newStatus = actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'completed';
      
      await reservationsAPI.updateReservationStatus(selectedReservation.id, newStatus);
      
      // עדכון הרשימה המקומית
      setReservations(prev => prev.map(res => 
        res.id === selectedReservation.id ? { ...res, status: newStatus } : res
      ));
      
      setAlertMessage({
        message: `ההזמנה ${actionType === 'approve' ? 'אושרה' : actionType === 'reject' ? 'נדחתה' : 'סומנה כהושלמה'} בהצלחה`,
        severity: 'success',
        show: true
      });

      setTimeout(() => {
        setAlertMessage(prev => ({ ...prev, show: false }));
      }, 5000);
    } catch (error) {
      console.error(`Error ${actionType}ing reservation:`, error);
      setAlertMessage({
        message: `שגיאה בעת ${actionType === 'approve' ? 'אישור' : actionType === 'reject' ? 'דחיית' : 'השלמת'} ההזמנה`,
        severity: 'error',
        show: true
      });
    } finally {
      setActionLoading(false);
      setActionDialogOpen(false);
    }
  };

  const handleActionCancel = () => {
    setActionDialogOpen(false);
  };

  // פילטור הזמנות לפי הלשונית הנבחרת
  const filteredReservations = reservations.filter(reservation => {
    if (tabValue === 0) return reservation.status === 'pending';
    if (tabValue === 1) return reservation.status === 'approved';
    return true; // כל ההזמנות
  });

  // חיתוך לפי דפים
  const paginatedReservations = filteredReservations.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
        ניהול הזמנות
      </Typography>

      {alertMessage.show && (
        <Alert 
          severity={alertMessage.severity} 
          sx={{ mb: 2 }}
          onClose={() => setAlertMessage(prev => ({ ...prev, show: false }))}
        >
          {alertMessage.message}
        </Alert>
      )}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label={`ממתינות לאישור (${reservations.filter(r => r.status === 'pending').length})`} />
          <Tab label={`מאושרות (${reservations.filter(r => r.status === 'approved').length})`} />
          <Tab label="כל ההזמנות" />
        </Tabs>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#F5F5F5' }}>
              <TableRow>
                <TableCell align="right">פריט</TableCell>
                <TableCell align="right">סטודנט</TableCell>
                <TableCell align="right">ת.ז.</TableCell>
                <TableCell align="right">כמות</TableCell>
                <TableCell align="right">מתאריך</TableCell>
                <TableCell align="right">עד תאריך</TableCell>
                <TableCell align="right">סטטוס</TableCell>
                <TableCell align="center">פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedReservations.length > 0 ? (
                paginatedReservations.map((reservation) => (
                  <TableRow key={reservation.id} hover>
                    <TableCell align="right">{reservation.item_name}</TableCell>
                    <TableCell align="right">{reservation.student_name}</TableCell>
                    <TableCell align="right">{reservation.student_id}</TableCell>
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
                    <TableCell align="center">
                      {reservation.status === 'pending' && (
                        <>
                          <Tooltip title="אשר">
                            <IconButton 
                              color="success"
                              onClick={() => handleActionClick(reservation, 'approve')}
                            >
                              <CheckIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="דחה">
                            <IconButton 
                              color="error"
                              onClick={() => handleActionClick(reservation, 'reject')}
                            >
                              <CloseIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {reservation.status === 'approved' && (
                        <Tooltip title="סמן כהושלם">
                          <IconButton 
                            color="info"
                            onClick={() => handleActionClick(reservation, 'complete')}
                          >
                            <CheckCircle />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    אין הזמנות להצגה
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredReservations.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="שורות בעמוד:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} מתוך ${count}`}
        />
      </Paper>

      {/* דיאלוג לאישור פעולה */}
      <Dialog
        open={actionDialogOpen}
        onClose={handleActionCancel}
      >
        <DialogTitle>
          {actionType === 'approve' && 'אישור הזמנה'}
          {actionType === 'reject' && 'דחיית הזמנה'}
          {actionType === 'complete' && 'סימון הזמנה כהושלמה'}
        </DialogTitle>
        <DialogContent>
          {selectedReservation && (
            <>
              <Typography variant="body1" gutterBottom>
                {actionType === 'approve' && 'האם לאשר את ההזמנה הבאה?'}
                {actionType === 'reject' && 'האם לדחות את ההזמנה הבאה?'}
                {actionType === 'complete' && 'האם לסמן את ההזמנה הבאה כהושלמה?'}
              </Typography>
              <Typography variant="body2">
                <strong>פריט:</strong> {selectedReservation.item_name}<br />
                <strong>סטודנט:</strong> {selectedReservation.student_name}<br />
                <strong>כמות:</strong> {selectedReservation.quantity}<br />
                <strong>תאריכים:</strong> {formatDate(selectedReservation.start_date)} - {formatDate(selectedReservation.end_date)}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleActionCancel} disabled={actionLoading}>
            ביטול
          </Button>
          <Button 
            onClick={handleActionConfirm} 
            color={actionType === 'approve' ? 'success' : actionType === 'reject' ? 'error' : 'primary'} 
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'אישור'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Reservations;