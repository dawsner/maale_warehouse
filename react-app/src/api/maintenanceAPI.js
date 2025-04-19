/**
 * API לניהול תחזוקה ותיקונים
 * מספק פונקציות לניהול סטטוס תחזוקה, רשומות תחזוקה, תזכורות תקופתיות ומידע אחריות.
 */

import axios from 'axios';
import { API_URL, BASE_HEADERS } from './config';

// יצירת מופע axios עם הגדרות המתאימות למערכת התחזוקה
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: BASE_HEADERS,
  timeout: 30000, // 30 seconds timeout
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

/**
 * ממשק API לניהול תחזוקה ותיקונים
 */
export const maintenanceAPI = {
  // סטטוס תחזוקה
  
  // קבלת סטטוס תחזוקה של פריט
  getItemMaintenanceStatus: async (itemId) => {
    try {
      const response = await axiosInstance.post('/api/maintenance/data', {
        action: 'status',
        item_id: itemId
      });
      return response.data;
    } catch (error) {
      console.error('Error getting maintenance status:', error);
      throw error;
    }
  },
  
  // עדכון סטטוס תחזוקה של פריט
  updateItemMaintenanceStatus: async (itemId, status, notes = null, userId = null) => {
    try {
      const response = await axiosInstance.post('/api/maintenance/update', {
        action: 'update_status',
        item_id: itemId,
        status: status,
        notes: notes,
        user_id: userId
      });
      return response.data;
    } catch (error) {
      console.error('Error updating maintenance status:', error);
      throw error;
    }
  },
  
  // רשומות תחזוקה
  
  // קבלת רשומות תחזוקה של פריט
  getItemMaintenanceRecords: async (itemId) => {
    try {
      const response = await axiosInstance.post('/api/maintenance/data', {
        action: 'records',
        item_id: itemId
      });
      return response.data;
    } catch (error) {
      console.error('Error getting maintenance records:', error);
      throw error;
    }
  },
  
  // הוספת רשומת תחזוקה חדשה
  addMaintenanceRecord: async (recordData) => {
    try {
      const response = await axiosInstance.post('/api/maintenance/update', {
        action: 'add_record',
        ...recordData
      });
      return response.data;
    } catch (error) {
      console.error('Error adding maintenance record:', error);
      throw error;
    }
  },
  
  // עדכון רשומת תחזוקה קיימת
  updateMaintenanceRecord: async (recordId, updateData) => {
    try {
      const response = await axiosInstance.post('/api/maintenance/update', {
        action: 'update_record',
        record_id: recordId,
        ...updateData
      });
      return response.data;
    } catch (error) {
      console.error('Error updating maintenance record:', error);
      throw error;
    }
  },
  
  // מחיקת רשומת תחזוקה
  deleteMaintenanceRecord: async (recordId) => {
    try {
      const response = await axiosInstance.post('/api/maintenance/update', {
        action: 'delete_record',
        record_id: recordId
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting maintenance record:', error);
      throw error;
    }
  },
  
  // מידע אחריות
  
  // קבלת מידע אחריות של פריט
  getItemWarrantyInfo: async (itemId) => {
    try {
      const response = await axiosInstance.post('/api/maintenance/data', {
        action: 'warranty',
        item_id: itemId
      });
      return response.data;
    } catch (error) {
      console.error('Error getting warranty info:', error);
      throw error;
    }
  },
  
  // הוספת/עדכון מידע אחריות
  addWarrantyInfo: async (warrantyData) => {
    try {
      const response = await axiosInstance.post('/api/maintenance/update', {
        action: 'add_warranty',
        ...warrantyData
      });
      return response.data;
    } catch (error) {
      console.error('Error adding warranty info:', error);
      throw error;
    }
  },
  
  // מחיקת מידע אחריות
  deleteWarrantyInfo: async (itemId) => {
    try {
      const response = await axiosInstance.post('/api/maintenance/update', {
        action: 'delete_warranty',
        item_id: itemId
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting warranty info:', error);
      throw error;
    }
  },
  
  // תזכורות תחזוקה
  
  // קבלת תזכורות תחזוקה של פריט
  getItemMaintenanceSchedules: async (itemId) => {
    try {
      const response = await axiosInstance.post('/api/maintenance/data', {
        action: 'schedules',
        item_id: itemId
      });
      return response.data;
    } catch (error) {
      console.error('Error getting maintenance schedules:', error);
      throw error;
    }
  },
  
  // הוספת/עדכון תזכורת תחזוקה
  addMaintenanceSchedule: async (scheduleData) => {
    try {
      const response = await axiosInstance.post('/api/maintenance/update', {
        action: 'add_schedule',
        ...scheduleData
      });
      return response.data;
    } catch (error) {
      console.error('Error adding maintenance schedule:', error);
      throw error;
    }
  },
  
  // מחיקת תזכורת תחזוקה
  deleteMaintenanceSchedule: async (scheduleId) => {
    try {
      const response = await axiosInstance.post('/api/maintenance/update', {
        action: 'delete_schedule',
        schedule_id: scheduleId
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting maintenance schedule:', error);
      throw error;
    }
  },
  
  // קבלת תזכורות תחזוקה קרובות
  getUpcomingMaintenanceSchedules: async (days = 30) => {
    try {
      const response = await axiosInstance.get(`/api/maintenance/upcoming?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error getting upcoming maintenance schedules:', error);
      throw error;
    }
  },
  
  // נתונים מרוכזים
  
  // קבלת כל נתוני התחזוקה של פריט
  getItemMaintenanceData: async (itemId) => {
    try {
      const response = await axiosInstance.post('/api/maintenance/data', {
        action: 'item_data',
        item_id: itemId
      });
      return response.data;
    } catch (error) {
      console.error('Error getting item maintenance data:', error);
      throw error;
    }
  },
  
  // קבלת סקירה כללית של מצב התחזוקה במערכת
  getMaintenanceOverview: async () => {
    try {
      const response = await axiosInstance.get('/api/maintenance/overview');
      return response.data;
    } catch (error) {
      console.error('Error getting maintenance overview:', error);
      throw error;
    }
  }
};