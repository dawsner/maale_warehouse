import axios from 'axios';

// קביעת כתובת בסיס ל-API
const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5001/api';

// יצירת מופע axios עם הגדרות מותאמות
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// הוספת מיירט בקשה להוספת טוקן אוטומטית
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API פונקציות למלאי
export const inventoryAPI = {
  getAll: () => api.get('/inventory'),
  getById: (id) => api.get(`/inventory/${id}`),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
  toggleAvailability: (id, isAvailable) => api.patch(`/inventory/${id}/availability`, { isAvailable }),
};

// API פונקציות להשאלות
export const loansAPI = {
  getAll: () => api.get('/loans'),
  getById: (id) => api.get(`/loans/${id}`),
  getByUser: (userId) => api.get(`/loans/user/${userId}`),
  create: (data) => api.post('/loans', data),
  return: (id, returnNotes) => api.patch(`/loans/${id}/return`, { returnNotes }),
};

// API פונקציות להזמנות
export const reservationsAPI = {
  getAll: () => api.get('/reservations'),
  getById: (id) => api.get(`/reservations/${id}`),
  getByUser: (userId) => api.get(`/reservations/user/${userId}`),
  create: (data) => api.post('/reservations', data),
  update: (id, data) => api.put(`/reservations/${id}`, data),
  updateStatus: (id, status) => api.patch(`/reservations/${id}/status`, { status }),
};

// API פונקציות למשתמשים והרשאות
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
};

// API פונקציות לסטטיסטיקות
export const statsAPI = {
  getEquipmentUsage: () => api.get('/stats/equipment-usage'),
  getStudentStats: () => api.get('/stats/students'),
  getMonthlyTrends: () => api.get('/stats/monthly-trends'),
  getCategoryAnalysis: () => api.get('/stats/category-analysis'),
};

// API פונקציות לייבוא/ייצוא
export const importExportAPI = {
  importExcel: (formData) => api.post('/import-export/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  exportExcel: () => api.get('/import-export/export', {
    responseType: 'blob',
  }),
};

export default api;
