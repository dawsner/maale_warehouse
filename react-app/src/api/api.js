import axios from 'axios';

// קונפיגורציה בסיסית לבקשות Axios
// אנחנו משתמשים באותו שרת שמגיש את האפליקציה
const API_URL = ''; // ריק משמעותו אותה דומיין בה רצה האפליקציה
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
    const response = await axiosInstance.get('/inventory');
    return response.data;
  },

  // הוספת פריט חדש
  addItem: async (itemData) => {
    const response = await axiosInstance.post('/inventory', itemData);
    return response.data;
  },

  // עדכון פריט קיים
  updateItem: async (itemId, itemData) => {
    const response = await axiosInstance.put(`/inventory/${itemId}`, itemData);
    return response.data;
  },

  // מחיקת פריט
  deleteItem: async (itemId) => {
    await axiosInstance.delete(`/inventory/${itemId}`);
    return true;
  },

  // שינוי זמינות פריט
  toggleAvailability: async (itemId, isAvailable) => {
    const response = await axiosInstance.put(`/inventory/${itemId}/availability`, { isAvailable });
    return response.data;
  },

  // יבוא מקובץ אקסל
  importFromExcel: async (formData) => {
    const response = await axiosInstance.post('/inventory/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // יצוא לקובץ אקסל
  exportToExcel: async () => {
    const response = await axiosInstance.get('/inventory/export', { responseType: 'blob' });
    return response.data;
  },
};

// API לניהול השאלות
export const loansAPI = {
  // קבלת כל ההשאלות
  getLoans: async () => {
    const response = await axiosInstance.get('/loans');
    return response.data;
  },

  // קבלת השאלות של משתמש ספציפי
  getUserLoans: async (userId) => {
    const response = await axiosInstance.get(`/loans/user/${userId}`);
    return response.data;
  },

  // יצירת השאלה חדשה
  createLoan: async (loanData) => {
    const response = await axiosInstance.post('/loans', loanData);
    return response.data;
  },

  // החזרת פריט מושאל
  returnLoan: async (loanId, returnNotes) => {
    const response = await axiosInstance.put(`/loans/${loanId}/return`, { returnNotes });
    return response.data;
  },

  // קבלת פרטי השאלה
  getLoanDetails: async (loanId) => {
    const response = await axiosInstance.get(`/loans/${loanId}`);
    return response.data;
  },
};

// API לניהול הזמנות
export const reservationsAPI = {
  // קבלת כל ההזמנות
  getReservations: async () => {
    const response = await axiosInstance.get('/reservations');
    return response.data;
  },

  // קבלת הזמנות של משתמש ספציפי
  getUserReservations: async (userId) => {
    const response = await axiosInstance.get(`/reservations/user/${userId}`);
    return response.data;
  },

  // יצירת הזמנה חדשה
  createReservation: async (reservationData) => {
    const response = await axiosInstance.post('/reservations', reservationData);
    return response.data;
  },

  // עדכון סטטוס הזמנה
  updateReservationStatus: async (reservationId, status) => {
    const response = await axiosInstance.put(`/reservations/${reservationId}/status`, { status });
    return response.data;
  },
};

// API לאותנטיקציה
export const authAPI = {
  // התחברות
  login: async (username, password) => {
    try {
      console.log('Sending login request to:', `${API_URL}/api/auth/login`);
      const response = await axiosInstance.post('/api/auth/login', { username, password });
      console.log('Login response:', response.data);
      
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
    const response = await axiosInstance.get('/stats/equipment-usage');
    return response.data;
  },

  // קבלת נתוני סטטיסטיקה לפי סטודנטים
  getStudentStats: async () => {
    const response = await axiosInstance.get('/stats/student-usage');
    return response.data;
  },

  // קבלת מגמות חודשיות
  getMonthlyTrends: async () => {
    const response = await axiosInstance.get('/stats/monthly-trends');
    return response.data;
  },

  // קבלת ניתוח קטגוריות
  getCategoryAnalysis: async () => {
    const response = await axiosInstance.get('/stats/category-analysis');
    return response.data;
  },
};

// API ליבוא/יצוא
export const importExportAPI = {
  // יבוא נתונים מאקסל
  importData: async (formData) => {
    const response = await axiosInstance.post('/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // יצוא נתונים לאקסל
  exportData: async () => {
    const response = await axiosInstance.get('/export', { responseType: 'blob' });
    return response.data;
  },
};