import React, { useState, useEffect, useMemo } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  IconButton,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Alert,
  Snackbar,
  LinearProgress,
  InputAdornment,
  Tab,
  Tabs,
  Checkbox,
  FormControlLabel,
  Divider,
  Chip,
  Card,
  CardContent,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Badge,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  Switch,
  Stack,
  CircularProgress,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  Drawer,
  Breadcrumbs
} from '@mui/material';

// יבוא אייקונים
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CategoryIcon from '@mui/icons-material/Category';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import GridViewIcon from '@mui/icons-material/GridView';
import SortIcon from '@mui/icons-material/Sort';
import SettingsIcon from '@mui/icons-material/Settings';
import LinkIcon from '@mui/icons-material/Link';
import InventoryIcon from '@mui/icons-material/Inventory';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CloseIcon from '@mui/icons-material/Close';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import TuneIcon from '@mui/icons-material/Tune';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HistoryIcon from '@mui/icons-material/History';
import SaveIcon from '@mui/icons-material/Save';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import { inventoryAPI, importExportAPI } from '../api/api';

// מערך של צבעי קטגוריות
const CATEGORY_COLORS = {
  'מצלמות': '#4b7bec',
  'עדשות': '#a55eea',
  'אביזרי מצלמה': '#20bf6b',
  'תאורה': '#eb3b5a',
  'סאונד': '#fa8231',
  'חצובות': '#f7b731',
  'בום': '#0fb9b1',
  'אביזרי מצלמה נוספים': '#45aaf2',
  'אביזרי תאורה': '#fd9644',
  'אביזרי סאונד': '#2d98da',
  'ציוד כללי': '#8854d0',
  'default': '#778ca3'
};

function InventoryEnhanced() {
  // מצב היישום
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table', 'grid', 'cards'
  const [tabValue, setTabValue] = useState(0);
  const [orderBy, setOrderBy] = useState('category');
  const [order, setOrder] = useState('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [filters, setFilters] = useState({
    onlyAvailable: false,
    hasQuantity: false,
    ordered: null,
    checkedOut: null,
    checked: null,
    returned: null
  });
  const [currentItem, setCurrentItem] = useState({
    id: null,
    name: '',
    category: '',
    quantity: 0,
    notes: '',
    category_original: '',
    order_notes: '',
    ordered: false,
    checked_out: false,
    checked: false,
    checkout_notes: '',
    returned: false,
    return_notes: '',
    price_per_unit: 0,
    total_price: 0,
    unnnamed_11: '',
    director: '',
    producer: '',
    photographer: '',
    is_available: true
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [importProgress, setImportProgress] = useState(0);

  // מחזורי חיים
  useEffect(() => {
    fetchItems();
  }, []);

  // פונקציות עזר
  const fetchItems = async () => {
    try {
      setLoading(true);
      console.log('Trying to fetch inventory items...');
      const data = await inventoryAPI.getItems();
      console.log('Inventory data received:', data);
      setItems(data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('שגיאה בטעינת נתוני המלאי');
    } finally {
      setLoading(false);
    }
  };

  // שליפת כל הקטגוריות הקיימות
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(items.map(item => item.category))];
    return uniqueCategories.sort((a, b) => a.localeCompare(b));
  }, [items]);

  // סינון פריטים לפי קריטריונים
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // חיפוש בטקסט
      const matchesSearch = 
        (item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // סינון לפי קטגוריות
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(item.category);
      
      // סינון לפי פילטרים נוספים
      const matchesAvailability = !filters.onlyAvailable || item.is_available;
      const matchesQuantity = !filters.hasQuantity || (item.quantity > 0);
      
      // סינון לפי מצב (הוזמן, נבדק, יצא, חזר)
      const matchesOrdered = filters.ordered === null || item.ordered === filters.ordered;
      const matchesCheckedOut = filters.checkedOut === null || item.checked_out === filters.checkedOut;
      const matchesChecked = filters.checked === null || item.checked === filters.checked;
      const matchesReturned = filters.returned === null || item.returned === filters.returned;
      
      return matchesSearch && matchesCategory && matchesAvailability && 
        matchesQuantity && matchesOrdered && matchesCheckedOut && 
        matchesChecked && matchesReturned;
    });
  }, [
    items, 
    searchQuery, 
    selectedCategories, 
    filters.onlyAvailable,
    filters.hasQuantity,
    filters.ordered,
    filters.checkedOut,
    filters.checked,
    filters.returned
  ]);

  // מיון פריטים
  const sortedItems = useMemo(() => {
    const comparator = (a, b) => {
      let aValue = a[orderBy] || '';
      let bValue = b[orderBy] || '';
      
      if (typeof aValue === 'boolean') {
        aValue = aValue ? 1 : 0;
        bValue = bValue ? 1 : 0;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'asc' 
          ? aValue.localeCompare(bValue, 'he') 
          : bValue.localeCompare(aValue, 'he');
      }
      
      return 0;
    };
    
    return [...filteredItems].sort(comparator);
  }, [filteredItems, order, orderBy]);

  // דף נוכחי של פריטים (רלוונטי לתצוגת טבלה)
  const paginatedItems = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return sortedItems.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedItems, page, rowsPerPage]);

  // סטטיסטיקות מהירות
  const statsData = useMemo(() => {
    return {
      totalItems: items.length,
      totalCategories: categories.length,
      availableItems: items.filter(item => item.is_available).length,
      lowStockItems: items.filter(item => item.quantity < 2 && item.quantity > 0).length,
      outOfStockItems: items.filter(item => item.quantity === 0).length,
      checkedOutItems: items.filter(item => item.checked_out && !item.returned).length
    };
  }, [items, categories]);

  // טיפול בשינוי מיון
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // טיפול בשינוי חיפוש
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(0); // חזרה לעמוד הראשון כשמשנים חיפוש
  };

  // פתיחת דיאלוג עריכה/הוספה
  const handleOpenDialog = (item = null) => {
    if (item) {
      // עריכת פריט קיים
      setCurrentItem({ ...item });
    } else {
      // הוספת פריט חדש
      setCurrentItem({
        id: null,
        name: '',
        category: '',
        quantity: 0,
        notes: '',
        category_original: '',
        order_notes: '',
        ordered: false,
        checked_out: false,
        checked: false,
        checkout_notes: '',
        returned: false,
        return_notes: '',
        price_per_unit: 0,
        total_price: 0,
        unnnamed_11: '',
        director: '',
        producer: '',
        photographer: '',
        is_available: true
      });
    }
    setOpenDialog(true);
    setTabValue(0);
  };

  // סגירת דיאלוג
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // טיפול בשינויי שדות בטופס
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentItem({
      ...currentItem,
      [name]: type === 'checkbox'
        ? checked
        : (type === 'number' || name === 'quantity' || name === 'price_per_unit' || name === 'total_price')
          ? parseFloat(value) || 0
          : value
    });

    // אם השדה הוא price_per_unit או quantity, עדכן את total_price באופן אוטומטי
    if (name === 'price_per_unit' || name === 'quantity') {
      const newPricePerUnit = name === 'price_per_unit' ? parseFloat(value) || 0 : currentItem.price_per_unit;
      const newQuantity = name === 'quantity' ? parseFloat(value) || 0 : currentItem.quantity;
      
      setCurrentItem(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value,
        total_price: newPricePerUnit * newQuantity
      }));
    }
  };

  // שינוי קטגוריה באמצעות Autocomplete
  const handleCategoryChange = (event, newValue) => {
    if (newValue) {
      setCurrentItem({
        ...currentItem,
        category: newValue
      });
    }
  };

  // החלפת לשונית בדיאלוג
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // שמירת פריט
  const handleSaveItem = async () => {
    // וידוא שכל השדות הנדרשים מולאו
    if (!currentItem.name || !currentItem.category) {
      setSnackbar({
        open: true,
        message: 'נא למלא את כל שדות החובה (שם ושדה)',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      
      if (currentItem.id) {
        // עדכון פריט קיים
        await inventoryAPI.updateItem(currentItem.id, currentItem);
        setSnackbar({
          open: true,
          message: 'הפריט עודכן בהצלחה',
          severity: 'success'
        });
      } else {
        // יצירת פריט חדש
        await inventoryAPI.addItem(currentItem);
        setSnackbar({
          open: true,
          message: 'הפריט נוסף בהצלחה',
          severity: 'success'
        });
      }
      
      // רענון רשימת הפריטים
      await fetchItems();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving item:', err);
      setSnackbar({
        open: true,
        message: 'שגיאה בשמירת הפריט',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // מחיקת פריט
  const handleDeleteItem = async (id) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק פריט זה?')) {
      try {
        setLoading(true);
        await inventoryAPI.deleteItem(id);
        await fetchItems();
        setSnackbar({
          open: true,
          message: 'הפריט נמחק בהצלחה',
          severity: 'success'
        });
      } catch (err) {
        console.error('Error deleting item:', err);
        setSnackbar({
          open: true,
          message: 'שגיאה במחיקת הפריט',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // שינוי זמינות פריט
  const handleToggleAvailability = async (id, currentAvailability) => {
    try {
      setLoading(true);
      await inventoryAPI.toggleAvailability(id, !currentAvailability);
      await fetchItems();
      setSnackbar({
        open: true,
        message: `הפריט ${!currentAvailability ? 'זמין' : 'לא זמין'} כעת`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Error toggling availability:', err);
      setSnackbar({
        open: true,
        message: 'שגיאה בעדכון זמינות הפריט',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // ניהול סינון קטגוריות
  const handleCategoryFilterChange = (event, category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(cat => cat !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
    setPage(0); // חזרה לעמוד הראשון
  };

  // ניהול שינוי תצוגה
  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // פתיחה וסגירה של דיאלוג ייבוא
  const handleImportDialogOpen = () => {
    setImportDialogOpen(true);
    setSelectedFile(null);
    setPreviewData(null);
    setColumnMapping({});
  };

  const handleImportDialogClose = () => {
    setImportDialogOpen(false);
    setSelectedFile(null);
    setPreviewData(null);
    setColumnMapping({});
  };

  // טיפול בבחירת קובץ לייבוא
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // קבלת תצוגה מקדימה של הקובץ
      const previewResponse = await importExportAPI.previewImport(formData);
      setPreviewData(previewResponse.data);
      
      // יצירת מיפוי עמודות ברירת מחדל
      const defaultMapping = {};
      if (previewResponse.columns) {
        previewResponse.columns.forEach(col => {
          const targetField = guessTargetField(col);
          if (targetField) defaultMapping[col] = targetField;
        });
      }
      
      setColumnMapping(defaultMapping);
    } catch (error) {
      console.error('Error previewing import file:', error);
      setSnackbar({
        open: true,
        message: 'שגיאה בטעינת קובץ הייבוא',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // ניחוש שדה מטרה לפי שם עמודה
  const guessTargetField = (columnName) => {
    const lowerName = columnName.toLowerCase();
    
    if (lowerName.includes('שם') || lowerName.includes('פריט')) return 'name';
    if (lowerName.includes('קטגוריה')) return 'category';
    if (lowerName.includes('כמות')) return 'quantity';
    if (lowerName.includes('הערות') && !lowerName.includes('הזמנה') && !lowerName.includes('הוצאה') && !lowerName.includes('החזרה')) return 'notes';
    if (lowerName.includes('הזמנה') && lowerName.includes('הערות')) return 'order_notes';
    if (lowerName.includes('הוזמן') || lowerName === 'הזמנה') return 'ordered';
    if (lowerName.includes('יצא')) return 'checked_out';
    if (lowerName.includes('נבדק') || lowerName.includes('בדקתי')) return 'checked';
    if (lowerName.includes('הוצאה') && lowerName.includes('הערות')) return 'checkout_notes';
    if (lowerName.includes('חזר')) return 'returned';
    if (lowerName.includes('החזרה') && lowerName.includes('הערות')) return 'return_notes';
    if (lowerName.includes('מחיר') && lowerName.includes('יחידה')) return 'price_per_unit';
    if (lowerName.includes('מחיר') && lowerName.includes('כולל')) return 'total_price';
    if (lowerName.includes('במאי')) return 'director';
    if (lowerName.includes('מפיק')) return 'producer';
    if (lowerName.includes('צלם')) return 'photographer';
    
    return ''; // אם לא מצאנו התאמה
  };

  // שינוי מיפוי עמודות
  const handleMappingChange = (excelColumn, dbField) => {
    setColumnMapping({
      ...columnMapping,
      [excelColumn]: dbField
    });
  };

  // ביצוע ייבוא הקובץ עם המיפוי המוגדר
  const handleImportFile = async () => {
    if (!selectedFile) {
      setSnackbar({
        open: true,
        message: 'נא לבחור קובץ לייבוא',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      setImportProgress(0);
      
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 500);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('mapping', JSON.stringify(columnMapping));
      
      await importExportAPI.importData(formData);
      
      clearInterval(progressInterval);
      setImportProgress(100);
      
      setSnackbar({
        open: true,
        message: 'הקובץ יובא בהצלחה',
        severity: 'success'
      });
      
      await fetchItems();
      handleImportDialogClose();
    } catch (error) {
      console.error('Error importing file:', error);
      setSnackbar({
        open: true,
        message: 'שגיאה בייבוא הקובץ',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // ייצוא המלאי לאקסל
  const handleExportToExcel = async () => {
    try {
      setLoading(true);
      const exportData = await importExportAPI.exportData();

      // יצירת קישור להורדה
      const url = window.URL.createObjectURL(new Blob([exportData]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setSnackbar({
        open: true,
        message: 'הקובץ יוצא בהצלחה',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      setSnackbar({
        open: true,
        message: 'שגיאה בייצוא הנתונים',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // סגירת הודעת Snackbar
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // כפתורי דילוג לעמודים בדפדוף
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // שינוי מספר שורות בעמוד
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // פונקציה להצגת הצבע של קטגוריה
  const getCategoryColor = (category) => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
  };

  // עזר להצגת תאריכים
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
  };

  // פונקציה לאיפוס כל הפילטרים
  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setFilters({
      onlyAvailable: false,
      hasQuantity: false,
      ordered: null,
      checkedOut: null,
      checked: null,
      returned: null
    });
    setOrderBy('category');
    setOrder('asc');
    setPage(0);
  };

  // ======== UI Components ========

  // כרטיסי סטטיסטיקה מהירה
  const StatCards = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={2}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            border: '1px solid #e0e0e0',
            bgcolor: '#FAFAFA',
            height: '100%'
          }}
        >
          <Badge
            badgeContent={statsData.totalItems}
            color="primary"
            max={9999}
            sx={{ '& .MuiBadge-badge': { fontSize: '0.8rem', height: 'auto', p: 1 } }}
          >
            <InventoryIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
          </Badge>
          <Typography variant="body2" color="text.secondary" align="center">
            סה"כ פריטים
          </Typography>
        </Paper>
      </Grid>
      
      <Grid item xs={12} sm={6} md={2}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            border: '1px solid #e0e0e0',
            bgcolor: '#FAFAFA',
            height: '100%'
          }}
        >
          <Badge
            badgeContent={statsData.availableItems}
            color="success"
            max={9999}
            sx={{ '& .MuiBadge-badge': { fontSize: '0.8rem', height: 'auto', p: 1 } }}
          >
            <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
          </Badge>
          <Typography variant="body2" color="text.secondary" align="center">
            פריטים זמינים
          </Typography>
        </Paper>
      </Grid>
      
      <Grid item xs={12} sm={6} md={2}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            border: '1px solid #e0e0e0',
            bgcolor: '#FAFAFA',
            height: '100%'
          }}
        >
          <Badge
            badgeContent={statsData.totalCategories}
            color="info"
            max={9999}
            sx={{ '& .MuiBadge-badge': { fontSize: '0.8rem', height: 'auto', p: 1 } }}
          >
            <CategoryIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
          </Badge>
          <Typography variant="body2" color="text.secondary" align="center">
            קטגוריות
          </Typography>
        </Paper>
      </Grid>
      
      <Grid item xs={12} sm={6} md={2}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            border: '1px solid #e0e0e0',
            bgcolor: '#FAFAFA',
            height: '100%'
          }}
        >
          <Badge
            badgeContent={statsData.lowStockItems}
            color="warning"
            max={9999}
            sx={{ '& .MuiBadge-badge': { fontSize: '0.8rem', height: 'auto', p: 1 } }}
          >
            <WarningIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
          </Badge>
          <Typography variant="body2" color="text.secondary" align="center">
            מלאי מועט
          </Typography>
        </Paper>
      </Grid>
      
      <Grid item xs={12} sm={6} md={2}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            border: '1px solid #e0e0e0',
            bgcolor: '#FAFAFA',
            height: '100%'
          }}
        >
          <Badge
            badgeContent={statsData.outOfStockItems}
            color="error"
            max={9999}
            sx={{ '& .MuiBadge-badge': { fontSize: '0.8rem', height: 'auto', p: 1 } }}
          >
            <ErrorIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
          </Badge>
          <Typography variant="body2" color="text.secondary" align="center">
            אזל מהמלאי
          </Typography>
        </Paper>
      </Grid>
      
      <Grid item xs={12} sm={6} md={2}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            border: '1px solid #e0e0e0',
            bgcolor: '#FAFAFA',
            height: '100%'
          }}
        >
          <Badge
            badgeContent={statsData.checkedOutItems}
            color="secondary"
            max={9999}
            sx={{ '& .MuiBadge-badge': { fontSize: '0.8rem', height: 'auto', p: 1 } }}
          >
            <LocalShippingIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
          </Badge>
          <Typography variant="body2" color="text.secondary" align="center">
            בהשאלה
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );

  // סרגל פעולות
  const ActionToolbar = () => (
    <Box sx={{ mb: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          bgcolor: '#FAFAFA'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="חיפוש לפי שם, קטגוריה או תיאור..."
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
          
          <Grid item xs={12} sm={6} md={8}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'center', md: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<TuneIcon />}
                onClick={() => setOpenFilterDrawer(true)}
                color="primary"
                sx={{ borderRadius: 2 }}
              >
                סינון וחיתוך
              </Button>
              
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                aria-label="מצב תצוגה"
                size="small"
              >
                <ToggleButton value="table" aria-label="תצוגת טבלה">
                  <ViewListIcon />
                </ToggleButton>
                <ToggleButton value="grid" aria-label="תצוגת רשת">
                  <GridViewIcon />
                </ToggleButton>
                <ToggleButton value="cards" aria-label="תצוגת כרטיסים">
                  <ViewModuleIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={handleImportDialogOpen}
                color="primary"
                sx={{ borderRadius: 2 }}
              >
                ייבוא
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportToExcel}
                color="primary"
                sx={{ borderRadius: 2 }}
              >
                ייצוא
              </Button>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                color="primary"
                sx={{ borderRadius: 2 }}
              >
                הוסף פריט
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );

  // תצוגה בטקסט של פילטרים פעילים
  const ActiveFilters = () => {
    // בדיקה האם יש פילטרים פעילים
    const hasActiveFilters = 
      searchQuery.trim() !== '' || 
      selectedCategories.length > 0 || 
      filters.onlyAvailable || 
      filters.hasQuantity || 
      filters.ordered !== null || 
      filters.checkedOut !== null || 
      filters.checked !== null || 
      filters.returned !== null;
    
    if (!hasActiveFilters) return null;
    
    return (
      <Box sx={{ mb: 2 }}>
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: 2,
            border: '1px solid #e0e0e0',
            bgcolor: '#F5F8FF'
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle2" color="primary">
                סינון פעיל:
              </Typography>
              
              {searchQuery.trim() !== '' && (
                <Chip 
                  label={`חיפוש: ${searchQuery}`} 
                  onDelete={() => setSearchQuery('')}
                  size="small"
                  sx={{ borderRadius: 1 }}
                />
              )}
              
              {selectedCategories.map(cat => (
                <Chip 
                  key={cat}
                  label={`קטגוריה: ${cat}`} 
                  onDelete={() => handleCategoryFilterChange(null, cat)}
                  size="small"
                  sx={{ borderRadius: 1 }}
                />
              ))}
              
              {filters.onlyAvailable && (
                <Chip 
                  label="רק פריטים זמינים" 
                  onDelete={() => setFilters(prev => ({ ...prev, onlyAvailable: false }))}
                  size="small"
                  color="success"
                  sx={{ borderRadius: 1 }}
                />
              )}
              
              {filters.hasQuantity && (
                <Chip 
                  label="יש במלאי" 
                  onDelete={() => setFilters(prev => ({ ...prev, hasQuantity: false }))}
                  size="small"
                  color="primary"
                  sx={{ borderRadius: 1 }}
                />
              )}
              
              {filters.ordered !== null && (
                <Chip 
                  label={filters.ordered ? "הוזמן" : "לא הוזמן"} 
                  onDelete={() => setFilters(prev => ({ ...prev, ordered: null }))}
                  size="small"
                  sx={{ borderRadius: 1 }}
                />
              )}
              
              {filters.checkedOut !== null && (
                <Chip 
                  label={filters.checkedOut ? "יצא" : "לא יצא"} 
                  onDelete={() => setFilters(prev => ({ ...prev, checkedOut: null }))}
                  size="small"
                  sx={{ borderRadius: 1 }}
                />
              )}
              
              {filters.checked !== null && (
                <Chip 
                  label={filters.checked ? "נבדק" : "לא נבדק"} 
                  onDelete={() => setFilters(prev => ({ ...prev, checked: null }))}
                  size="small"
                  sx={{ borderRadius: 1 }}
                />
              )}
              
              {filters.returned !== null && (
                <Chip 
                  label={filters.returned ? "הוחזר" : "לא הוחזר"} 
                  onDelete={() => setFilters(prev => ({ ...prev, returned: null }))}
                  size="small"
                  sx={{ borderRadius: 1 }}
                />
              )}
            </Box>
            
            <Button 
              size="small" 
              onClick={resetAllFilters}
              color="primary"
              startIcon={<CloseIcon />}
            >
              נקה הכל
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  };

  // דיאלוג הוספה/עריכת פריט
  const ItemDialog = () => (
    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
      <DialogTitle sx={{ 
        borderBottom: '1px solid #eaeaea', 
        pb: 2, 
        bgcolor: '#f8f8f8',
      }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#1E2875' }}>
          {currentItem.id ? 'עריכת פריט' : 'הוספת פריט חדש'}
        </Typography>
        {currentItem.id && (
          <Typography variant="caption" display="block" sx={{ color: '#666' }}>
            מזהה פריט: {currentItem.id}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="טאבים לעריכת פריט"
            variant="scrollable"
            textColor="primary"
            indicatorColor="primary"
            scrollButtons="auto"
            sx={{ 
              direction: 'rtl',
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '0.9rem',
              }
            }}
          >
            <Tab label="פרטים בסיסיים" icon={<InfoIcon />} iconPosition="start" {...a11yProps(0)} />
            <Tab label="מידע על הזמנה" icon={<ShoppingCartIcon />} iconPosition="start" {...a11yProps(1)} />
            <Tab label="הוצאה והחזרה" icon={<AssignmentReturnIcon />} iconPosition="start" {...a11yProps(2)} />
            <Tab label="מידע נוסף" icon={<HistoryIcon />} iconPosition="start" {...a11yProps(3)} />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="שם הפריט *"
                name="name"
                value={currentItem.name || ''}
                onChange={handleInputChange}
                fullWidth
                required
                error={!currentItem.name}
                helperText={!currentItem.name ? "שדה חובה" : ""}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={categories}
                inputValue={currentItem.category || ''}
                onInputChange={handleCategoryChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="קטגוריה *"
                    name="category"
                    required
                    error={!currentItem.category}
                    helperText={!currentItem.category ? "שדה חובה" : ""}
                    sx={{ direction: 'rtl' }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="כמות *"
                name="quantity"
                type="number"
                value={currentItem.quantity || 0}
                onChange={handleInputChange}
                fullWidth
                required
                InputProps={{ inputProps: { min: 0 } }}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentItem.is_available || false}
                    onChange={(e) => setCurrentItem({...currentItem, is_available: e.target.checked})}
                    name="is_available"
                    color="success"
                  />
                }
                label="זמין במערכת"
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="הערות כלליות"
                name="notes"
                value={currentItem.notes || ''}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={currentItem.ordered || false}
                    onChange={handleInputChange}
                    name="ordered"
                    color="primary"
                  />
                }
                label="הוזמן"
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="הערות על ההזמנה (מחסן באדום. סטודנט בכחול)"
                name="order_notes"
                value={currentItem.order_notes || ''}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
                sx={{ direction: 'rtl' }}
                placeholder="הערות המחסן באדום, הערות סטודנט בכחול"
                helperText="הערות שמתחילות עם 'מחסן' יוצגו באדום, הערות שמתחילות עם 'סטודנט' יוצגו בכחול"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="מחיר ליחידה"
                name="price_per_unit"
                type="number"
                value={currentItem.price_per_unit || 0}
                onChange={handleInputChange}
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                }}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="מחיר כולל"
                name="total_price"
                type="number"
                value={currentItem.total_price || 0}
                onChange={handleInputChange}
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                  readOnly: true
                }}
                sx={{ direction: 'rtl' }}
                helperText="מחושב אוטומטית (מחיר ליחידה × כמות)"
              />
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f9f9f9', border: '1px solid #eee', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  פרטי מצב הפריט - מעקב אחר תהליך ההשאלה וההחזרה
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  bgcolor: currentItem.checked_out ? '#ffebee' : '#fafafa'
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={currentItem.checked_out || false}
                      onChange={handleInputChange}
                      name="checked_out"
                      color="error"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalShippingIcon color={currentItem.checked_out ? "error" : "disabled"} />
                      <Typography fontWeight={currentItem.checked_out ? 'bold' : 'normal'}>יצא</Typography>
                    </Box>
                  }
                  sx={{ direction: 'rtl' }}
                />
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  bgcolor: currentItem.checked ? '#e8f5e9' : '#fafafa'
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={currentItem.checked || false}
                      onChange={handleInputChange}
                      name="checked"
                      color="success"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckBoxIcon color={currentItem.checked ? "success" : "disabled"} />
                      <Typography fontWeight={currentItem.checked ? 'bold' : 'normal'}>נבדק</Typography>
                    </Box>
                  }
                  sx={{ direction: 'rtl' }}
                />
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  bgcolor: currentItem.returned ? '#e3f2fd' : '#fafafa'
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={currentItem.returned || false}
                      onChange={handleInputChange}
                      name="returned"
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AssignmentReturnIcon color={currentItem.returned ? "primary" : "disabled"} />
                      <Typography fontWeight={currentItem.returned ? 'bold' : 'normal'}>חזר</Typography>
                    </Box>
                  }
                  sx={{ direction: 'rtl' }}
                />
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="הערות על ההוצאה (מחסן באדום. סטודנט בכחול)"
                name="checkout_notes"
                value={currentItem.checkout_notes || ''}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="הערות על ההחזרה"
                name="return_notes"
                value={currentItem.return_notes || ''}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f9f9f9', border: '1px solid #eee', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  פרטי צוות הפקה ומידע נוסף שמתועד עבור הציוד
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="במאית"
                name="director"
                value={currentItem.director || ''}
                onChange={handleInputChange}
                fullWidth
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="מפיקה"
                name="producer"
                value={currentItem.producer || ''}
                onChange={handleInputChange}
                fullWidth
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="צלמת"
                name="photographer"
                value={currentItem.photographer || ''}
                onChange={handleInputChange}
                fullWidth
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="שדה נוסף"
                name="unnnamed_11"
                value={currentItem.unnnamed_11 || ''}
                onChange={handleInputChange}
                fullWidth
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="קטגוריה מקורית (מהאקסל)"
                name="category_original"
                value={currentItem.category_original || ''}
                onChange={handleInputChange}
                fullWidth
                disabled
                sx={{ direction: 'rtl' }}
              />
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #eaeaea', bgcolor: '#f8f8f8' }}>
        <Button onClick={handleCloseDialog} color="inherit">
          ביטול
        </Button>
        <Button 
          onClick={handleSaveItem} 
          variant="contained" 
          color="primary"
          startIcon={<SaveIcon />}
          disabled={!currentItem.name || !currentItem.category}
        >
          {currentItem.id ? 'עדכון פריט' : 'הוספת פריט'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // דיאלוג ייבוא מאקסל
  const ImportDialog = () => (
    <Dialog open={importDialogOpen} onClose={handleImportDialogClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid #eaeaea', bgcolor: '#f8f8f8' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#1E2875' }}>
          ייבוא נתונים מאקסל
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2 }}>
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">
              ייבוא נתונים מקובץ אקסל יאפשר לך להוסיף או לעדכן מספר רב של פריטים בבת אחת. 
              בחר קובץ אקסל (.xlsx) ומפה את העמודות שלו לשדות המערכת.
            </Typography>
          </Box>

          {!selectedFile && (
            <Box sx={{ my: 3, textAlign: 'center' }}>
              <input
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                id="raised-button-file"
                multiple={false}
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="raised-button-file">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  sx={{ borderRadius: 2, py: 1.5, px: 3 }}
                >
                  בחר קובץ אקסל
                </Button>
              </label>
            </Box>
          )}

          {selectedFile && !previewData && loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ mt: 2 }}>
                טוען תצוגה מקדימה...
              </Typography>
            </Box>
          )}

          {selectedFile && (
            <Box sx={{ my: 2 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  bgcolor: '#fafafa'
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  קובץ נבחר:
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </Typography>
                <Button
                  size="small"
                  onClick={() => setSelectedFile(null)}
                  sx={{ mt: 1 }}
                  startIcon={<CloseIcon />}
                >
                  הסר קובץ
                </Button>
              </Paper>
            </Box>
          )}
          
          {previewData && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 4, fontWeight: 'bold', color: '#1E2875' }}>
                מיפוי עמודות
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                קבע לאיזה שדה במערכת תתאים כל עמודה בקובץ האקסל
              </Typography>
              
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>עמודה באקסל</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>שדה במערכת</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>דוגמה מהקובץ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewData && previewData.columns && previewData.columns.map((column, index) => (
                      <TableRow key={index}>
                        <TableCell>{column}</TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small">
                            <Select
                              value={columnMapping[column] || ''}
                              onChange={(e) => handleMappingChange(column, e.target.value)}
                              displayEmpty
                            >
                              <MenuItem value="">
                                <em>לא למפות</em>
                              </MenuItem>
                              <MenuItem value="name">שם הפריט</MenuItem>
                              <MenuItem value="category">קטגוריה</MenuItem>
                              <MenuItem value="quantity">כמות</MenuItem>
                              <MenuItem value="notes">הערות</MenuItem>
                              <MenuItem value="order_notes">הערות הזמנה</MenuItem>
                              <MenuItem value="ordered">הוזמן</MenuItem>
                              <MenuItem value="checked_out">יצא</MenuItem>
                              <MenuItem value="checked">נבדק</MenuItem>
                              <MenuItem value="checkout_notes">הערות הוצאה</MenuItem>
                              <MenuItem value="returned">חזר</MenuItem>
                              <MenuItem value="return_notes">הערות החזרה</MenuItem>
                              <MenuItem value="price_per_unit">מחיר ליחידה</MenuItem>
                              <MenuItem value="total_price">מחיר כולל</MenuItem>
                              <MenuItem value="director">במאית</MenuItem>
                              <MenuItem value="producer">מפיקה</MenuItem>
                              <MenuItem value="photographer">צלמת</MenuItem>
                              <MenuItem value="unnnamed_11">שדה נוסף</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          {previewData.data && previewData.data[0] && 
                            (previewData.data[0][column] !== undefined ? 
                              String(previewData.data[0][column]) : '')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {previewData && previewData.data && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1E2875' }}>
                    תצוגה מקדימה
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    {previewData.data.length} שורות נמצאו בקובץ (מוצגות 5 הראשונות)
                  </Typography>
                  
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, maxHeight: 300 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {previewData.columns.slice(0, 5).map((column, index) => (
                            <TableCell key={index} sx={{ fontWeight: 'bold' }}>
                              {column}
                            </TableCell>
                          ))}
                          {previewData.columns.length > 5 && (
                            <TableCell>...</TableCell>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {previewData.data.slice(0, 5).map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {previewData.columns.slice(0, 5).map((column, colIndex) => (
                              <TableCell key={colIndex}>
                                {row[column] !== undefined ? String(row[column]) : ''}
                              </TableCell>
                            ))}
                            {previewData.columns.length > 5 && (
                              <TableCell>...</TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
              
              {importProgress > 0 && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={importProgress} 
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                    {importProgress === 100 ? 'הייבוא הושלם בהצלחה!' : 'מייבא נתונים...'}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #eaeaea', bgcolor: '#f8f8f8' }}>
        <Button onClick={handleImportDialogClose} color="inherit">
          ביטול
        </Button>
        {selectedFile && previewData && (
          <Button 
            onClick={handleImportFile} 
            variant="contained" 
            color="primary"
            disabled={importProgress > 0 && importProgress < 100}
            startIcon={<FileDownloadIcon />}
          >
            {importProgress > 0 && importProgress < 100 ? 'מייבא...' : 'ייבא נתונים'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );

  // מגירת סינון וחיתוך
  const FilterDrawer = () => (
    <Drawer
      anchor="left"
      open={openFilterDrawer}
      onClose={() => setOpenFilterDrawer(false)}
      PaperProps={{
        sx: { width: { xs: '85%', sm: 400 }, p: 2, direction: 'rtl' }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1E2875' }}>
          סינון וחיתוך מלאי
        </Typography>
        <IconButton onClick={() => setOpenFilterDrawer(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
        מצב זמינות
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={filters.onlyAvailable}
            onChange={(e) => setFilters({ ...filters, onlyAvailable: e.target.checked })}
            color="primary"
          />
        }
        label="הצג רק פריטים זמינים"
      />
      <FormControlLabel
        control={
          <Switch
            checked={filters.hasQuantity}
            onChange={(e) => setFilters({ ...filters, hasQuantity: e.target.checked })}
            color="primary"
          />
        }
        label="הצג רק פריטים שיש במלאי"
      />
      
      <Box sx={{ my: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
          קטגוריות
        </Typography>
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2, 
            maxHeight: 200, 
            overflow: 'auto',
            border: '1px solid #e0e0e0',
            bgcolor: '#fafafa'
          }}
        >
          {categories.map((category) => (
            <FormControlLabel
              key={category}
              control={
                <Checkbox
                  checked={selectedCategories.includes(category)}
                  onChange={(e) => handleCategoryFilterChange(e, category)}
                  sx={{
                    color: getCategoryColor(category),
                    '&.Mui-checked': {
                      color: getCategoryColor(category),
                    },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: getCategoryColor(category),
                      mr: 1
                    }}
                  />
                  <Typography variant="body2">{category}</Typography>
                  <Chip
                    size="small"
                    label={items.filter(item => item.category === category).length}
                    sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
              }
            />
          ))}
        </Paper>
      </Box>
      
      <Box sx={{ my: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
          מצב הפריט
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <FormControl component="fieldset">
              <Typography variant="body2" gutterBottom>הזמנה</Typography>
              <ToggleButtonGroup
                value={filters.ordered}
                exclusive
                onChange={(e, value) => setFilters({ ...filters, ordered: value })}
                size="small"
                color="primary"
                sx={{ mb: 2 }}
              >
                <ToggleButton value={true}>הוזמן</ToggleButton>
                <ToggleButton value={false}>לא הוזמן</ToggleButton>
                <ToggleButton value={null}>הכל</ToggleButton>
              </ToggleButtonGroup>
            </FormControl>
          </Grid>
          
          <Grid item xs={6}>
            <FormControl component="fieldset">
              <Typography variant="body2" gutterBottom>יציאה</Typography>
              <ToggleButtonGroup
                value={filters.checkedOut}
                exclusive
                onChange={(e, value) => setFilters({ ...filters, checkedOut: value })}
                size="small"
                color="primary"
                sx={{ mb: 2 }}
              >
                <ToggleButton value={true}>יצא</ToggleButton>
                <ToggleButton value={false}>לא יצא</ToggleButton>
                <ToggleButton value={null}>הכל</ToggleButton>
              </ToggleButtonGroup>
            </FormControl>
          </Grid>
          
          <Grid item xs={6}>
            <FormControl component="fieldset">
              <Typography variant="body2" gutterBottom>בדיקה</Typography>
              <ToggleButtonGroup
                value={filters.checked}
                exclusive
                onChange={(e, value) => setFilters({ ...filters, checked: value })}
                size="small"
                color="primary"
                sx={{ mb: 2 }}
              >
                <ToggleButton value={true}>נבדק</ToggleButton>
                <ToggleButton value={false}>לא נבדק</ToggleButton>
                <ToggleButton value={null}>הכל</ToggleButton>
              </ToggleButtonGroup>
            </FormControl>
          </Grid>
          
          <Grid item xs={6}>
            <FormControl component="fieldset">
              <Typography variant="body2" gutterBottom>החזרה</Typography>
              <ToggleButtonGroup
                value={filters.returned}
                exclusive
                onChange={(e, value) => setFilters({ ...filters, returned: value })}
                size="small"
                color="primary"
                sx={{ mb: 2 }}
              >
                <ToggleButton value={true}>חזר</ToggleButton>
                <ToggleButton value={false}>טרם חזר</ToggleButton>
                <ToggleButton value={null}>הכל</ToggleButton>
              </ToggleButtonGroup>
            </FormControl>
          </Grid>
        </Grid>
      </Box>
      
      <Box sx={{ my: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
          מיון
        </Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>מיין לפי</InputLabel>
          <Select
            value={orderBy}
            onChange={(e) => setOrderBy(e.target.value)}
            label="מיין לפי"
          >
            <MenuItem value="name">שם הפריט</MenuItem>
            <MenuItem value="category">קטגוריה</MenuItem>
            <MenuItem value="quantity">כמות</MenuItem>
            <MenuItem value="price_per_unit">מחיר ליחידה</MenuItem>
            <MenuItem value="total_price">מחיר כולל</MenuItem>
          </Select>
        </FormControl>
        
        <ToggleButtonGroup
          value={order}
          exclusive
          onChange={(e, newOrder) => setOrder(newOrder || 'asc')}
          size="small"
        >
          <ToggleButton value="asc">
            סדר עולה
          </ToggleButton>
          <ToggleButton value="desc">
            סדר יורד
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      <Divider sx={{ my: 3 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          onClick={resetAllFilters} 
          color="inherit"
          startIcon={<CloseIcon />}
        >
          נקה הכל
        </Button>
        <Button 
          onClick={() => setOpenFilterDrawer(false)} 
          variant="contained" 
          color="primary"
        >
          החל סינון
        </Button>
      </Box>
    </Drawer>
  );

  // תצוגת טבלה
  const TableView = () => (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table sx={{ minWidth: 700 }}>
        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
          <TableRow>
            <TableCell 
              sortDirection={orderBy === 'category' ? order : false}
              onClick={() => handleRequestSort('category')}
              sx={{ fontWeight: 'bold', cursor: 'pointer' }}
            >
              <TableSortLabel
                active={orderBy === 'category'}
                direction={orderBy === 'category' ? order : 'asc'}
              >
                קטגוריה
              </TableSortLabel>
            </TableCell>
            <TableCell 
              sortDirection={orderBy === 'name' ? order : false}
              onClick={() => handleRequestSort('name')}
              sx={{ fontWeight: 'bold', cursor: 'pointer' }}
            >
              <TableSortLabel
                active={orderBy === 'name'}
                direction={orderBy === 'name' ? order : 'asc'}
              >
                שם הפריט
              </TableSortLabel>
            </TableCell>
            <TableCell 
              sortDirection={orderBy === 'quantity' ? order : false}
              onClick={() => handleRequestSort('quantity')}
              sx={{ fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}
            >
              <TableSortLabel
                active={orderBy === 'quantity'}
                direction={orderBy === 'quantity' ? order : 'asc'}
              >
                כמות
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>הזמנה</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>הערות הזמנה</TableCell>
            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>יצא</TableCell>
            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>נבדק</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>הערות הוצאה</TableCell>
            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>חזר</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>הערות החזרה</TableCell>
            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>זמינות</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>פעולות</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedItems.length > 0 ? (
            paginatedItems.map((item) => (
              <TableRow 
                key={item.id} 
                hover 
                sx={{ 
                  '&:hover': { bgcolor: '#f8f9fa' },
                  bgcolor: !item.is_available ? '#f9f9f9' : 'inherit'
                }}
              >
                <TableCell>
                  <Chip 
                    label={item.category} 
                    size="small"
                    sx={{ 
                      bgcolor: `${getCategoryColor(item.category)}20`,
                      color: getCategoryColor(item.category),
                      fontWeight: 'medium',
                      border: `1px solid ${getCategoryColor(item.category)}40`,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {item.name}
                    {item.quantity === 0 && (
                      <Chip 
                        label="אזל" 
                        size="small" 
                        color="error" 
                        variant="outlined"
                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Chip 
                    label={item.quantity} 
                    size="small"
                    color={item.quantity === 0 ? 'error' : item.quantity < 3 ? 'warning' : 'default'}
                    variant={item.quantity === 0 ? 'outlined' : 'filled'}
                    sx={{ minWidth: 30 }}
                  />
                </TableCell>
                <TableCell align="center">
                  {item.ordered ? 
                    <Tooltip title="הוזמן">
                      <Chip 
                        label="הוזמן" 
                        color="primary" 
                        size="small" 
                        variant="outlined"
                        sx={{ fontWeight: 'medium' }}
                      />
                    </Tooltip> : 
                    <Typography component="span" sx={{ color: 'text.disabled', fontSize: '0.9rem' }}>-</Typography>
                  }
                </TableCell>
                <TableCell>
                  {item.order_notes ? 
                    <Tooltip title={item.order_notes}>
                      <Typography 
                        sx={{ 
                          fontSize: '0.85rem', 
                          maxWidth: '150px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          direction: 'rtl',
                          color: item.order_notes.toLowerCase().includes('מחסן') ? '#d32f2f' : 
                                item.order_notes.toLowerCase().includes('סטודנט') ? '#1976d2' : 'text.primary'
                        }}
                      >
                        {item.order_notes}
                      </Typography>
                    </Tooltip> : 
                    <Typography component="span" sx={{ color: 'text.disabled', fontSize: '0.9rem' }}>-</Typography>
                  }
                </TableCell>
                <TableCell align="center">
                  {item.checked_out ? 
                    <Tooltip title="יצא">
                      <Chip 
                        label="יצא" 
                        color="error" 
                        size="small"
                        sx={{ fontWeight: 'medium' }}
                      />
                    </Tooltip> : 
                    <Typography component="span" sx={{ color: 'text.disabled', fontSize: '0.9rem' }}>-</Typography>
                  }
                </TableCell>
                <TableCell align="center">
                  {item.checked ? 
                    <Tooltip title="נבדק">
                      <Chip 
                        label="נבדק" 
                        color="success" 
                        size="small"
                        sx={{ fontWeight: 'medium' }}
                      />
                    </Tooltip> : 
                    <Typography component="span" sx={{ color: 'text.disabled', fontSize: '0.9rem' }}>-</Typography>
                  }
                </TableCell>
                <TableCell>
                  {item.checkout_notes ? 
                    <Tooltip title={item.checkout_notes}>
                      <Typography 
                        sx={{ 
                          fontSize: '0.85rem', 
                          maxWidth: '150px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          direction: 'rtl',
                          color: item.checkout_notes.toLowerCase().includes('מחסן') ? '#d32f2f' : 
                                item.checkout_notes.toLowerCase().includes('סטודנט') ? '#1976d2' : 'text.primary'
                        }}
                      >
                        {item.checkout_notes}
                      </Typography>
                    </Tooltip> : 
                    <Typography component="span" sx={{ color: 'text.disabled', fontSize: '0.9rem' }}>-</Typography>
                  }
                </TableCell>
                <TableCell align="center">
                  {item.returned ? 
                    <Tooltip title="חזר">
                      <Chip 
                        label="חזר" 
                        color="success" 
                        size="small"
                        sx={{ fontWeight: 'medium' }}
                      />
                    </Tooltip> : 
                    (item.checked_out ? 
                      <Tooltip title="עדיין בחוץ">
                        <Chip 
                          label="בחוץ" 
                          color="warning" 
                          size="small"
                          sx={{ fontWeight: 'medium' }}
                        />
                      </Tooltip> : 
                      <Typography component="span" sx={{ color: 'text.disabled', fontSize: '0.9rem' }}>-</Typography>
                    )
                  }
                </TableCell>
                <TableCell>
                  {item.return_notes ? 
                    <Tooltip title={item.return_notes}>
                      <Typography 
                        sx={{ 
                          fontSize: '0.85rem', 
                          maxWidth: '150px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          direction: 'rtl'
                        }}
                      >
                        {item.return_notes}
                      </Typography>
                    </Tooltip> : 
                    <Typography component="span" sx={{ color: 'text.disabled', fontSize: '0.9rem' }}>-</Typography>
                  }
                </TableCell>
                <TableCell align="center">
                  <Button
                    variant={item.is_available ? "contained" : "outlined"}
                    color={item.is_available ? "success" : "error"}
                    size="small"
                    onClick={() => handleToggleAvailability(item.id, item.is_available)}
                    sx={{ minWidth: '80px', fontSize: '0.75rem' }}
                  >
                    {item.is_available ? "זמין" : "לא זמין"}
                  </Button>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="ערוך פריט">
                    <IconButton onClick={() => handleOpenDialog(item)} color="primary" size="small" sx={{ mx: 0.5 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="מחק פריט">
                    <IconButton onClick={() => handleDeleteItem(item.id)} color="error" size="small" sx={{ mx: 0.5 }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={12} align="center" sx={{ py: 3 }}>
                {loading ? 
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
                    <CircularProgress size={24} sx={{ mr: 2 }} />
                    <Typography>טוען נתונים...</Typography>
                  </Box> 
                : 'לא נמצאו פריטים'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // תצוגת רשת
  const GridView = () => (
    <Grid container spacing={2}>
      {paginatedItems.length > 0 ? (
        paginatedItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                height: '100%', 
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                borderLeft: `4px solid ${getCategoryColor(item.category)}`,
                bgcolor: !item.is_available ? '#f9f9f9' : 'inherit'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Chip 
                  label={item.category} 
                  size="small"
                  sx={{ 
                    bgcolor: `${getCategoryColor(item.category)}20`,
                    color: getCategoryColor(item.category),
                    fontWeight: 'medium',
                    border: `1px solid ${getCategoryColor(item.category)}40`,
                  }}
                />
                <Box>
                  <Tooltip title="ערוך">
                    <IconButton size="small" color="primary" onClick={() => handleOpenDialog(item)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="מחק">
                    <IconButton size="small" color="error" onClick={() => handleDeleteItem(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                {item.name}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  כמות:
                </Typography>
                <Chip 
                  label={item.quantity} 
                  size="small"
                  color={item.quantity === 0 ? 'error' : item.quantity < 3 ? 'warning' : 'default'}
                  variant={item.quantity === 0 ? 'outlined' : 'filled'}
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, my: 1, justifyContent: 'flex-start' }}>
                {item.ordered && <Chip label="הוזמן" size="small" color="primary" variant="outlined" />}
                {item.checked_out && <Chip label="יצא" size="small" color="error" />}
                {item.checked && <Chip label="נבדק" size="small" color="success" />}
                {item.returned && <Chip label="חזר" size="small" color="success" />}
                {item.checked_out && !item.returned && <Chip label="בחוץ" size="small" color="warning" />}
              </Box>
              
              <Box sx={{ mt: 'auto', pt: 2, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant={item.is_available ? "contained" : "outlined"}
                  color={item.is_available ? "success" : "error"}
                  size="small"
                  onClick={() => handleToggleAvailability(item.id, item.is_available)}
                  fullWidth
                >
                  {item.is_available ? "זמין במערכת" : "לא זמין"}
                </Button>
              </Box>
            </Paper>
          </Grid>
        ))
      ) : (
        <Grid item xs={12}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            {loading ? 
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
                <CircularProgress size={24} sx={{ mr: 2 }} />
                <Typography>טוען נתונים...</Typography>
              </Box> 
            : 'לא נמצאו פריטים'}
          </Paper>
        </Grid>
      )}
    </Grid>
  );

  // תצוגת כרטיסים
  const CardsView = () => (
    <Box>
      {paginatedItems.length > 0 ? (
        paginatedItems.map((item) => (
          <Paper 
            key={item.id}
            elevation={0} 
            sx={{ 
              mb: 2, 
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: !item.is_available ? '#f9f9f9' : 'white'
            }}
          >
            <Grid container>
              <Grid item xs={12} md={3} 
                sx={{ 
                  bgcolor: `${getCategoryColor(item.category)}10`,
                  borderRight: { xs: 'none', md: `1px solid ${getCategoryColor(item.category)}30` },
                  borderBottom: { xs: `1px solid ${getCategoryColor(item.category)}30`, md: 'none' },
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Chip 
                    label={item.category} 
                    size="small"
                    sx={{ 
                      bgcolor: `${getCategoryColor(item.category)}20`,
                      color: getCategoryColor(item.category),
                      fontWeight: 'medium',
                      border: `1px solid ${getCategoryColor(item.category)}40`,
                    }}
                  />
                  <Chip 
                    label={`כמות: ${item.quantity}`}
                    size="small"
                    color={item.quantity === 0 ? 'error' : item.quantity < 3 ? 'warning' : 'default'}
                    variant={item.quantity === 0 ? 'outlined' : 'filled'}
                  />
                </Box>
                
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {item.name}
                </Typography>
                
                {item.notes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {item.notes}
                  </Typography>
                )}
                
                <Box sx={{ mt: 'auto' }}>
                  <Button
                    variant={item.is_available ? "contained" : "outlined"}
                    color={item.is_available ? "success" : "error"}
                    size="small"
                    onClick={() => handleToggleAvailability(item.id, item.is_available)}
                    fullWidth
                  >
                    {item.is_available ? "זמין במערכת" : "לא זמין"}
                  </Button>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={7} sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 1.5, 
                        borderRadius: 1.5,
                        bgcolor: item.ordered ? '#e3f2fd' : 'transparent',
                        borderColor: item.ordered ? '#90caf9' : '#e0e0e0',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" display="block">
                        הזמנה
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        {item.ordered ? 
                          <Chip label="הוזמן" size="small" color="primary" /> : 
                          <Typography variant="body2" color="text.disabled">לא הוזמן</Typography>
                        }
                      </Box>
                      {item.order_notes && (
                        <Tooltip title={item.order_notes}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              mt: 1, 
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '100%',
                              color: item.order_notes.includes('מחסן') ? '#d32f2f' : 
                                    item.order_notes.includes('סטודנט') ? '#1976d2' : 'inherit'
                            }}
                          >
                            {item.order_notes}
                          </Typography>
                        </Tooltip>
                      )}
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 1.5, 
                        borderRadius: 1.5,
                        bgcolor: item.checked_out ? '#ffebee' : 'transparent',
                        borderColor: item.checked_out ? '#ef9a9a' : '#e0e0e0',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" display="block">
                        הוצאה
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        {item.checked_out ? 
                          <Chip label="יצא" size="small" color="error" /> : 
                          <Typography variant="body2" color="text.disabled">לא יצא</Typography>
                        }
                      </Box>
                      {item.checkout_notes && (
                        <Tooltip title={item.checkout_notes}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              mt: 1, 
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '100%',
                              color: item.checkout_notes.includes('מחסן') ? '#d32f2f' : 
                                   item.checkout_notes.includes('סטודנט') ? '#1976d2' : 'inherit'
                            }}
                          >
                            {item.checkout_notes}
                          </Typography>
                        </Tooltip>
                      )}
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 1.5, 
                        borderRadius: 1.5,
                        bgcolor: item.returned ? '#e8f5e9' : (item.checked_out ? '#fff8e1' : 'transparent'),
                        borderColor: item.returned ? '#a5d6a7' : (item.checked_out ? '#ffe082' : '#e0e0e0'),
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" display="block">
                        החזרה
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        {item.returned ? 
                          <Chip label="הוחזר" size="small" color="success" /> : 
                          (item.checked_out ? 
                            <Chip label="בחוץ" size="small" color="warning" /> :
                            <Typography variant="body2" color="text.disabled">-</Typography>
                          )
                        }
                      </Box>
                      {item.return_notes && (
                        <Tooltip title={item.return_notes}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              mt: 1, 
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '100%'
                            }}
                          >
                            {item.return_notes}
                          </Typography>
                        </Tooltip>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
                
                {(item.director || item.producer || item.photographer) && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      צוות הפקה:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {item.director && <Chip size="small" label={`במאית: ${item.director}`} />}
                      {item.producer && <Chip size="small" label={`מפיקה: ${item.producer}`} />}
                      {item.photographer && <Chip size="small" label={`צלמת: ${item.photographer}`} />}
                    </Box>
                  </Box>
                )}
              </Grid>
              
              <Grid item xs={12} md={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Stack spacing={1} direction={{ xs: 'row', md: 'column' }} sx={{ mb: 2 }} justifyContent="center">
                  <Tooltip title="צפה בפרטים מלאים">
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleOpenDialog(item)}
                      fullWidth
                    >
                      פרטים
                    </Button>
                  </Tooltip>
                  <Tooltip title="ערוך פריט">
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenDialog(item)}
                      fullWidth
                    >
                      עריכה
                    </Button>
                  </Tooltip>
                  <Tooltip title="מחק פריט">
                    <Button 
                      variant="outlined" 
                      color="error" 
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteItem(item.id)}
                      fullWidth
                    >
                      מחיקה
                    </Button>
                  </Tooltip>
                </Stack>
                
                {item.price_per_unit > 0 && (
                  <Box sx={{ textAlign: 'center', mt: 'auto' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      מחיר ליחידה
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      ₪{item.price_per_unit.toLocaleString()}
                    </Typography>
                    {item.total_price > 0 && (
                      <>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          מחיר כולל
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          ₪{item.total_price.toLocaleString()}
                        </Typography>
                      </>
                    )}
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>
        ))
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          {loading ? 
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography>טוען נתונים...</Typography>
            </Box> 
          : 'לא נמצאו פריטים'}
        </Paper>
      )}
    </Box>
  );

  // בחירת תצוגה לפי viewMode
  const renderItemsView = () => {
    switch (viewMode) {
      case 'grid':
        return <GridView />;
      case 'cards':
        return <CardsView />;
      case 'table':
      default:
        return <TableView />;
    }
  };

  // UI ראשי
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* כותרת ודרכי ניווט */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#373B5C' }}>
              ניהול מלאי
            </Typography>
            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">ראשי</Typography>
              <Typography variant="body2" color="text.primary" fontWeight="medium">ניהול מלאי</Typography>
            </Breadcrumbs>
          </Box>
        </Stack>
      </Box>
      
      {/* כרטיסי סטטיסטיקה */}
      <StatCards />
      
      {/* סרגל פעולות */}
      <ActionToolbar />
      
      {/* פילטרים פעילים */}
      <ActiveFilters />
      
      {/* הודעת שגיאה */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* תוכן ראשי - טבלה או רשת */}
      <Box sx={{ mb: 4 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {renderItemsView()}
      </Box>
      
      {/* דיאלוגים */}
      <ItemDialog />
      <ImportDialog />
      <FilterDrawer />
      
      {/* הודעות Toast */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

// עזר לניהול לשוניות
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default InventoryEnhanced;