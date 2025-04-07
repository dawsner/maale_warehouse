import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Button,
  Grid,
  Alert,
  Snackbar,
  LinearProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import { importExportAPI } from '../api/api';

function ExcelImport() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const excelColumns = [
    { title: 'שם פריט', field: 'name', required: true },
    { title: 'קטגוריה', field: 'category', required: true },
    { title: 'כמות', field: 'quantity', required: true },
    { title: 'הערות', field: 'notes', required: false },
  ];

  const [columnMapping, setColumnMapping] = useState({
    name: '',
    category: '',
    quantity: '',
    notes: ''
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // בדיקה אם הקובץ הוא מסוג אקסל
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
        // נאפס את ההתקדמות הקודמת
        setSuccess(false);
        setError('');
        setPreviewData(null);
        
        // טעינת תצוגה מקדימה של הקובץ
        handlePreviewExcel(selectedFile);
      } else {
        setError('אנא בחר קובץ אקסל תקין (.xlsx או .xls)');
        setFile(null);
      }
    }
  };

  const handlePreviewExcel = async (file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'preview');
      
      const response = await importExportAPI.importData(formData);
      setPreviewData(response);
      
      // ניסיון לזהות אוטומטית את העמודות לפי הכותרות
      if (response && response.columns && response.columns.length > 0) {
        const newMapping = { ...columnMapping };
        
        // ניסיון להתאמה של שמות שדות
        response.columns.forEach(column => {
          const lowerColumn = column.toLowerCase();
          
          if (lowerColumn.includes('שם') || lowerColumn.includes('פריט') || lowerColumn.includes('name')) {
            newMapping.name = column;
          } else if (lowerColumn.includes('קטגוריה') || lowerColumn.includes('category')) {
            newMapping.category = column;
          } else if (lowerColumn.includes('כמות') || lowerColumn.includes('quantity')) {
            newMapping.quantity = column;
          } else if (lowerColumn.includes('הערות') || lowerColumn.includes('notes')) {
            newMapping.notes = column;
          }
        });
        
        setColumnMapping(newMapping);
      }
      
      setError('');
    } catch (err) {
      console.error('Error previewing Excel:', err);
      setError('אירעה שגיאה בטעינת תצוגה מקדימה של קובץ האקסל');
    } finally {
      setLoading(false);
    }
  };

  const handleColumnMappingChange = (field, value) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImportExcel = async () => {
    try {
      // בדיקה שכל השדות החובה מופו
      const requiredFields = excelColumns.filter(col => col.required).map(col => col.field);
      const missingFields = requiredFields.filter(field => !columnMapping[field]);
      
      if (missingFields.length > 0) {
        setError(`יש למפות את כל השדות הנדרשים: ${missingFields.join(', ')}`);
        return;
      }
      
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'import');
      formData.append('mapping', JSON.stringify(columnMapping));
      
      await importExportAPI.importData(formData);
      
      setSuccess(true);
      setSnackbar({
        open: true,
        message: 'הנתונים יובאו בהצלחה',
        severity: 'success'
      });
      
      // איפוס הטופס
      setFile(null);
      setPreviewData(null);
    } catch (err) {
      console.error('Error importing Excel:', err);
      setError('אירעה שגיאה בייבוא קובץ האקסל');
      setSnackbar({
        open: true,
        message: 'אירעה שגיאה בייבוא קובץ האקסל',
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
          ייבוא נתונים מאקסל
        </Typography>
        <Typography variant="body1" sx={{ color: '#9197B3' }}>
          העלאת קובץ אקסל וייבוא נתוניו למערכת
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, border: '1px solid #CECECE' }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', p: 3, border: '2px dashed #CECECE', borderRadius: 2, mb: 3 }}>
              {!file ? (
                <>
                  <input
                    accept=".xlsx,.xls"
                    id="excel-file-upload"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <label htmlFor="excel-file-upload">
                    <Button
                      variant="contained"
                      component="span"
                      startIcon={<UploadFileIcon />}
                      sx={{ mb: 2, borderRadius: '8px', py: 1, px: 3 }}
                    >
                      בחר קובץ אקסל
                    </Button>
                  </label>
                  <Typography variant="body2" color="textSecondary">
                    גרור קובץ לכאן או לחץ לבחירת קובץ
                  </Typography>
                </>
              ) : (
                <Box>
                  <CloudDoneIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {file.name}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setFile(null)}
                  >
                    הסר קובץ
                  </Button>
                </Box>
              )}
            </Box>
          </Grid>
          
          {loading && (
            <Grid item xs={12}>
              <LinearProgress sx={{ mb: 2 }} />
            </Grid>
          )}
          
          {previewData && previewData.columns && previewData.columns.length > 0 && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  מיפוי עמודות
                </Typography>
                <Typography variant="body2" sx={{ mb: 3, color: '#9197B3' }}>
                  יש לבחור לאיזה שדה במערכת מתאימה כל עמודה בקובץ האקסל
                </Typography>
                
                <Grid container spacing={2}>
                  {excelColumns.map((column) => (
                    <Grid item xs={12} sm={6} md={3} key={column.field}>
                      <FormControl fullWidth required={column.required}>
                        <InputLabel id={`${column.field}-label`}>
                          {column.title}
                          {column.required && ' *'}
                        </InputLabel>
                        <Select
                          labelId={`${column.field}-label`}
                          value={columnMapping[column.field]}
                          onChange={(e) => handleColumnMappingChange(column.field, e.target.value)}
                          label={`${column.title}${column.required ? ' *' : ''}`}
                        >
                          <MenuItem value="">
                            <em>בחר עמודה</em>
                          </MenuItem>
                          {previewData.columns.map((excelColumn) => (
                            <MenuItem key={excelColumn} value={excelColumn}>
                              {excelColumn}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                  תצוגה מקדימה
                </Typography>
                {previewData.preview && previewData.preview.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          {previewData.columns.map((column) => (
                            <TableCell key={column} sx={{ fontWeight: 'bold' }}>
                              {column}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {previewData.preview.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {previewData.columns.map((column, colIndex) => (
                              <TableCell key={`${rowIndex}-${colIndex}`}>
                                {row[column]}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">אין נתונים לתצוגה מקדימה</Alert>
                )}
              </Grid>
            </>
          )}
          
          <Grid item xs={12} sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              disabled={!file || loading || !previewData}
              onClick={handleImportExcel}
              sx={{ 
                borderRadius: '8px',
                py: 1,
                px: 4
              }}
            >
              {loading ? 'מייבא...' : 'ייבא נתונים'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default ExcelImport;