import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/api';

// יצירת הקונטקסט
const AuthContext = createContext();

// הוק נוח לשימוש בקונטקסט
export const useAuth = () => useContext(AuthContext);

// ספק הקונטקסט
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // בדיקת משתמש מחובר בעת טעינת האפליקציה
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Token found in localStorage, checking authentication...');
      // בדיקת תקפות הטוקן
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        // אם הטוקן פג תוקף
        if (decoded.exp <= currentTime) {
          console.log('Token expired');
          localStorage.removeItem('token');
          setUser(null);
          setLoading(false);
          return;
        }
        
        // אם הטוקן תקף, מנסה לקבל פרטי משתמש
        authAPI.getCurrentUser()
          .then(userData => {
            console.log('User data received from API');
            setUser(userData);
            setLoading(false);
          })
          .catch((err) => {
            console.error('Error getting user data:', err);
            localStorage.removeItem('token');
            setUser(null);
            setError('שגיאה בטעינת פרטי המשתמש');
            setLoading(false);
          });
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('token');
        setUser(null);
        setError('שגיאה בפענוח הטוקן');
        setLoading(false);
      }
    } else {
      console.log('No token found');
      setLoading(false);
    }
  }, []);

  // פונקציה להתחברות
  const login = async (username, password) => {
    try {
      setError(null);
      const response = await authAPI.login(username, password);
      
      if (response.success) {
        setUser(response.user);
        return response.user;
      } else {
        setError(response.message || 'שגיאה לא ידועה בהתחברות');
        return null;
      }
    } catch (err) {
      console.error('Error during login:', err);
      setError('שגיאה בהתחברות למערכת');
      return null;
    }
  };

  // פונקציה להרשמה
  const register = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.register(userData);
      
      if (response.success) {
        setUser(response.user);
        return response.user;
      } else {
        setError(response.message || 'שגיאה לא ידועה בהרשמה');
        return null;
      }
    } catch (err) {
      console.error('Error during registration:', err);
      setError('שגיאה בהרשמה למערכת');
      return null;
    }
  };

  // פונקציה להתנתקות
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // ערך הקונטקסט
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    setUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;