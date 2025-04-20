import axios from 'axios';

// קונפיגורציה בסיסית לבקשות Axios
// מכיוון שהוספנו הגדרת proxy בקובץ package.json, ניתן להשתמש בנתיבים יחסיים
// ובקשות בפורמט /api/* יועברו אוטומטית לשרת Express
const API_URL = '';  // נתיב יחסי - נסמוך על הגדרת ה-proxy
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // הגדלת ה-timeout לטיפול בבקשות הדורשות זמן עיבוד ארוך יותר
  timeout: 30000, // 30 שניות במקום 10 שניות
});

// הוספת טוקן אוטומטית לכל הבקשות אם קיים
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// תפיסת שגיאות תשובה (response) והתייחסות מיוחדת לטוקן פג תוקף
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    // בדיקה אם הטוקן פג תוקף
    const isTokenExpired = 
      (error.response && error.response.status === 401) || 
      (error.response && error.response.data && error.response.data.message && 
       (error.response.data.message.includes("token expired") || 
        error.response.data.message.includes("טוקן פג תוקף") || 
        error.response.data.message.includes("invalid token")));
    
    if (isTokenExpired) {
      console.log('טוקן פג תוקף, מנקה מידע משתמש ומציג מסך התחברות...');
      // ניקוי הטוקן מהאחסון המקומי
      localStorage.removeItem('token');
      
      // הפניה לעמוד ההתחברות עם פרמטר שגיאה
      window.location.href = '/login?error=token_expired';
      
      // מונע המשך טיפול בשגיאה אחרי הניתוב
      return new Promise(() => {});
    }
    
    // כל שגיאה אחרת מוחזרת כרגיל
    return Promise.reject(error);
  }
);

// API לניהול מלאי
export const inventoryAPI = {
  // קבלת כל פריטי המלאי
  getItems: async () => {
    try {
      console.log('Fetching inventory from API...');
      const response = await axiosInstance.get('/api/inventory');
      console.log('Inventory response received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  },
  
  // קבלת כל פריטי המלאי - שם חלופי לאותה פונקציה לתאימות
  getInventory: async () => {
    try {
      console.log('Fetching inventory from API via getInventory...');
      const response = await axiosInstance.get('/api/inventory');
      console.log('Inventory response received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  },
  
  // קבלת כל פריטי המלאי - שם חלופי נוסף לאותה פונקציה לתאימות עם VintageOrderWizard
  getAll: async () => {
    try {
      console.log('Fetching inventory from API via getAll...');
      const response = await axiosInstance.get('/api/inventory');
      console.log('Inventory response received in getAll:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory in getAll:', error);
      throw error;
    }
  },

  // הוספת פריט חדש
  addItem: async (itemData) => {
    const response = await axiosInstance.post('/api/inventory', itemData);
    return response.data;
  },

  // עדכון פריט קיים
  updateItem: async (itemId, itemData) => {
    const response = await axiosInstance.put(`/api/inventory/${itemId}`, itemData);
    return response.data;
  },

  // מחיקת פריט
  deleteItem: async (itemId) => {
    await axiosInstance.delete(`/api/inventory/${itemId}`);
    return true;
  },

  // שינוי זמינות פריט
  toggleAvailability: async (itemId, isAvailable) => {
    const response = await axiosInstance.put(`/api/inventory/${itemId}/availability`, { isAvailable });
    return response.data;
  },

  // יבוא מקובץ אקסל
  importFromExcel: async (formData) => {
    const response = await axiosInstance.post('/api/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // יצוא לקובץ אקסל
  exportToExcel: async () => {
    const response = await axiosInstance.get('/api/export', { responseType: 'blob' });
    return response.data;
  },
};

// API לניהול השאלות
export const loansAPI = {
  // קבלת כל ההשאלות
  getLoans: async () => {
    try {
      console.log('Fetching loans from API...');
      const response = await axiosInstance.get('/api/loans');
      console.log('Loans response received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching loans:', error);
      throw error;
    }
  },

  // קבלת השאלות של משתמש ספציפי
  getUserLoans: async (userId) => {
    try {
      const response = await axiosInstance.get(`/api/loans/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user loans:', error);
      throw error;
    }
  },

  // יצירת השאלה חדשה
  createLoan: async (loanData) => {
    const response = await axiosInstance.post('/api/loans', loanData);
    return response.data;
  },

  // החזרת פריט מושאל
  returnLoan: async (loanId, returnNotes) => {
    const response = await axiosInstance.put(`/api/loans/${loanId}/return`, { returnNotes });
    return response.data;
  },

  // קבלת פרטי השאלה
  getLoanDetails: async (loanId) => {
    const response = await axiosInstance.get(`/api/loans/${loanId}`);
    return response.data;
  },
};

// API לניהול הזמנות
export const reservationsAPI = {
  // קבלת כל ההזמנות
  getReservations: async () => {
    try {
      const response = await axiosInstance.get('/api/reservations');
      return response.data;
    } catch (error) {
      console.error('Error fetching reservations:', error);
      throw error;
    }
  },

  // קבלת הזמנות של משתמש ספציפי
  getUserReservations: async (userId) => {
    try {
      const response = await axiosInstance.get(`/api/reservations/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user reservations:', error);
      throw error;
    }
  },

  // יצירת הזמנה חדשה
  createReservation: async (reservationData) => {
    try {
      const response = await axiosInstance.post('/api/reservations', reservationData);
      return response.data;
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  },

  // עדכון סטטוס הזמנה
  updateReservationStatus: async (reservationId, status) => {
    try {
      const response = await axiosInstance.put(`/api/reservations/${reservationId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating reservation status:', error);
      throw error;
    }
  },
  
  // בדיקת זמינות פריט בטווח תאריכים
  checkItemAvailability: async (itemId, startDate, endDate, quantity = 1) => {
    try {
      const response = await axiosInstance.post('/api/reservations/check-availability', {
        item_id: itemId,
        start_date: startDate,
        end_date: endDate,
        quantity: quantity
      });
      return response.data;
    } catch (error) {
      console.error('Error checking item availability:', error);
      throw error;
    }
  },
  
  // פונקציה זהה במהות אך בשם אחר לתאימות עם VintageOrderWizard
  checkAvailability: async (params) => {
    try {
      console.log('Checking availability with params:', params);
      const response = await axiosInstance.post('/api/reservations/check-availability', params);
      console.log('Availability check response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  },
  
  // קבלת מידע סטטיסטי על הזמנות
  getReservationStats: async () => {
    try {
      const response = await axiosInstance.get('/api/reservations/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching reservation stats:', error);
      throw error;
    }
  }
};

// API לאותנטיקציה
export const authAPI = {
  // התחברות
  login: async (username, password) => {
    try {
      console.log('Sending login request to:', `${API_URL}/api/auth/login`);
      const response = await axiosInstance.post('/api/auth/login', { username, password });
      console.log('Login response:', response.data);
      
      if (response.data && response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        // החזרת פרטי המשתמש מתוך תשובת השרת
        return {
          id: response.data.id,
          username: response.data.username,
          role: response.data.role,
          email: response.data.email,
          full_name: response.data.full_name
        };
      }
      return null;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // הרשמה
  register: async (userData) => {
    try {
      const response = await axiosInstance.post('/api/auth/register', userData);
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        // החזרת פרטי המשתמש מתוך תשובת השרת
        return {
          id: response.data.id,
          username: response.data.username,
          role: response.data.role,
          email: response.data.email,
          full_name: response.data.full_name
        };
      }
      return null;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // קבלת פרטי משתמש נוכחי
  getCurrentUser: async () => {
    try {
      const response = await axiosInstance.get('/api/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  // התנתקות
  logout: () => {
    localStorage.removeItem('token');
  },
};

// API לדשבורד
export const dashboardAPI = {
  // קבלת נתוני דשבורד
  getDashboardData: async () => {
    try {
      console.log('Fetching dashboard data...');
      const response = await axiosInstance.get('/api/dashboard');
      console.log('Dashboard data received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },
};

// API להתראות
export const alertsAPI = {
  // קבלת כל ההתראות
  getAlerts: async (daysThreshold = 3, stockThreshold = 20, maintenanceDaysThreshold = 30) => {
    try {
      console.log('Fetching alerts data...');
      const response = await axiosInstance.post('/api/alerts', {
        days_threshold: daysThreshold,
        stock_threshold: stockThreshold,
        maintenance_days_threshold: maintenanceDaysThreshold
      });
      console.log('Alerts data received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  },
  
  // שליחת התראת אימייל
  sendEmailAlert: async (alertType, data, email) => {
    try {
      const response = await axiosInstance.post('/api/send-email-alert', {
        alert_type: alertType,  // 'overdue', 'upcoming', 'low_stock'
        data: data,
        email: email
      });
      return response.data;
    } catch (error) {
      console.error('Error sending email alert:', error);
      throw error;
    }
  },
  
  // סימון התראה כנצפתה
  markAlertAsRead: async (alertId) => {
    try {
      const response = await axiosInstance.put(`/api/alerts/${alertId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking alert as read:', error);
      throw error;
    }
  },
  
  // סינון והגדרות התראות
  updateAlertSettings: async (settings) => {
    try {
      const response = await axiosInstance.put('/api/alerts/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating alert settings:', error);
      throw error;
    }
  }
};

// API לסטטיסטיקות
export const statsAPI = {
  // קבלת נתוני שימוש בציוד
  getEquipmentUsage: async () => {
    try {
      console.log('Fetching equipment usage stats...');
      const response = await axiosInstance.get('/api/stats/equipment-usage');
      console.log('Stats received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  },

  // קבלת נתוני סטטיסטיקה לפי סטודנטים
  getStudentStats: async () => {
    const response = await axiosInstance.get('/api/stats/student-usage');
    return response.data;
  },

  // קבלת מגמות חודשיות
  getMonthlyTrends: async () => {
    const response = await axiosInstance.get('/api/stats/monthly-trends');
    return response.data;
  },

  // קבלת ניתוח קטגוריות
  getCategoryAnalysis: async () => {
    const response = await axiosInstance.get('/api/stats/category-analysis');
    return response.data;
  },
  
  // ===== ניתוח וסטטיסטיקה מתקדמת =====
  
  // קבלת מגמות שימוש מתקדמות
  getAdvancedUsageTrends: async (monthsBack = 12) => {
    try {
      console.log('Fetching advanced usage trends...');
      const response = await axiosInstance.post('/api/advanced-reports', {
        report_type: 'usage_trends',
        params: { months_back: monthsBack }
      });
      console.log('Advanced trends received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching advanced trends:', error);
      throw error;
    }
  },
  
  // קבלת חיזוי ביקוש עתידי
  getFutureDemandPredictions: async (monthsAhead = 3) => {
    try {
      console.log('Fetching future demand predictions...');
      const response = await axiosInstance.post('/api/advanced-reports', {
        report_type: 'future_demand',
        params: { months_ahead: monthsAhead }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching future demand:', error);
      throw error;
    }
  },
  
  // קבלת המלצות רכש חכמות
  getPurchaseRecommendations: async () => {
    try {
      console.log('Fetching purchase recommendations...');
      const response = await axiosInstance.post('/api/advanced-reports', {
        report_type: 'purchase_recommendations'
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching purchase recommendations:', error);
      throw error;
    }
  },
  
  // קבלת ניתוח השוואתי בין תקופות
  getComparativePeriodAnalysis: async (period1Start, period1End, period2Start, period2End) => {
    try {
      console.log('Fetching comparative period analysis...');
      const response = await axiosInstance.post('/api/advanced-reports', {
        report_type: 'comparative_periods',
        params: {
          period1_start: period1Start, 
          period1_end: period1End,
          period2_start: period2Start,
          period2_end: period2End
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching comparative analysis:', error);
      throw error;
    }
  },
  
  // ייצוא דו"ח מתקדם בפורמט מסוים
  exportAdvancedReport: async (reportType, params = {}, format = 'excel') => {
    try {
      console.log(`Exporting advanced report in ${format} format...`);
      const response = await axiosInstance.post('/api/export-advanced-report', {
        report_type: reportType,
        params: params,
        format: format
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting advanced report:', error);
      throw error;
    }
  }
};

// API ליבוא/יצוא
export const importExportAPI = {
  // יבוא נתונים מאקסל
  importData: async (formData) => {
    const response = await axiosInstance.post('/api/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // יצוא נתונים לאקסל
  exportData: async () => {
    const response = await axiosInstance.get('/api/export', { responseType: 'blob' });
    return response.data;
  },
  
  // תצוגה מקדימה של ייבוא מאקסל
  previewImport: async (formData) => {
    const response = await axiosInstance.post('/api/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  // ייבוא מאקסל עם מיפוי עמודות
  importWithMapping: async (formData, mapping) => {
    formData.append('mapping', JSON.stringify(mapping));
    const response = await axiosInstance.post('/api/import/with-mapping', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  // קבלת תבנית ייצוא אקסל
  getExportTemplate: async () => {
    const response = await axiosInstance.get('/api/export/template', { responseType: 'blob' });
    return response.data;
  },
  
  // ייצוא לאקסל עם פילטרים
  exportWithFilters: async (filters) => {
    const response = await axiosInstance.post('/api/export/filtered', filters, { 
      responseType: 'blob' 
    });
    return response.data;
  }
};

// ממשק API לניהול משתמשים
export const userManagementAPI = {
  // קבלת רשימת כל המשתמשים
  getAllUsers: async () => {
    try {
      const response = await axiosInstance.post('/api/user-management', {
        action: 'get_all_users'
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },
  
  // עדכון סטטוס משתמש (חסום/פעיל)
  updateUserStatus: async (userId, status) => {
    try {
      const response = await axiosInstance.post('/api/user-management', {
        action: 'update_user_status',
        params: { user_id: userId, status }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },
  
  // עדכון פרטי משתמש
  updateUserDetails: async (userId, details) => {
    try {
      const response = await axiosInstance.post('/api/user-management', {
        action: 'update_user_details',
        params: { user_id: userId, details }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating user details:', error);
      throw error;
    }
  },
  
  // שינוי סיסמת משתמש
  changeUserPassword: async (userId, newPassword) => {
    try {
      const response = await axiosInstance.post('/api/user-management', {
        action: 'change_user_password',
        params: { user_id: userId, new_password: newPassword }
      });
      return response.data;
    } catch (error) {
      console.error('Error changing user password:', error);
      throw error;
    }
  },
  
  // קבלת הגבלות גישה לפריטים עבור משתמש מסוים
  getUserRestrictions: async (userId) => {
    try {
      const response = await axiosInstance.post('/api/user-management', {
        action: 'get_user_restrictions',
        params: { user_id: userId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user restrictions:', error);
      throw error;
    }
  },
  
  // הוספת הגבלת גישה לפריט עבור משתמש
  addUserRestriction: async (userId, itemId, reason, createdBy) => {
    try {
      const response = await axiosInstance.post('/api/user-management', {
        action: 'add_user_restriction',
        params: { 
          user_id: userId, 
          item_id: itemId,
          reason,
          created_by: createdBy
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error adding user restriction:', error);
      throw error;
    }
  },
  
  // הסרת הגבלת גישה לפריט
  removeUserRestriction: async (restrictionId) => {
    try {
      const response = await axiosInstance.post('/api/user-management', {
        action: 'remove_user_restriction',
        params: { restriction_id: restrictionId }
      });
      return response.data;
    } catch (error) {
      console.error('Error removing user restriction:', error);
      throw error;
    }
  },
  
  // קבלת הרשאות קטגוריות
  getCategoryPermissions: async () => {
    try {
      const response = await axiosInstance.post('/api/user-management', {
        action: 'get_category_permissions'
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching category permissions:', error);
      throw error;
    }
  },
  
  // הוספת הרשאת קטגוריה עבור שנת לימודים
  addCategoryPermission: async (studyYear, category) => {
    try {
      const response = await axiosInstance.post('/api/user-management', {
        action: 'add_category_permission',
        params: { study_year: studyYear, category }
      });
      return response.data;
    } catch (error) {
      console.error('Error adding category permission:', error);
      throw error;
    }
  },
  
  // הסרת הרשאת קטגוריה
  removeCategoryPermission: async (permissionId) => {
    try {
      const response = await axiosInstance.post('/api/user-management', {
        action: 'remove_category_permission',
        params: { permission_id: permissionId }
      });
      return response.data;
    } catch (error) {
      console.error('Error removing category permission:', error);
      throw error;
    }
  },
  
  // קבלת רשימת קטגוריות זמינות למשתמש
  getAvailableCategories: async (userId) => {
    try {
      const response = await axiosInstance.post('/api/user-management', {
        action: 'get_available_categories',
        params: { user_id: userId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching available categories:', error);
      throw error;
    }
  }
};