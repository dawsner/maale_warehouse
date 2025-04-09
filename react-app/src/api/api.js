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