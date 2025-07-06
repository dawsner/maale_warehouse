import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Link,
  Alert,
  Grid,
  MenuItem
} from '@mui/material';
import { authAPI } from '../api/api';

function Register({ onLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    role: 'student' // ברירת מחדל: סטודנט
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // בדיקת תקינות הטופס
    if (!formData.username || !formData.password || !formData.fullName || !formData.email) {
      setError('יש למלא את כל השדות החובה');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // שליחת נתוני הרשמה לשרת
      const response = await authAPI.register({
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role
      });
      
      // אם ההרשמה הצליחה, בצע התחברות אוטומטית
      onLogin(response.data.user);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'שגיאה בהרשמה, אנא נסו שוב');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper 
          elevation={2} 
          sx={{ 
            p: 4, 
            width: '100%', 
            borderRadius: 2,
            border: '1px solid #CECECE',
            backgroundColor: 'white'
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              mb: 3 
            }}
          >
            <img 
              src="/assets/logo.png" 
              alt="Logo" 
              style={{ height: '80px', marginBottom: '16px' }} 
            />
            <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', color: '#373B5C' }}>
              הרשמה למערכת ניהול ציוד
            </Typography>
            <Typography component="p" variant="body2" sx={{ mt: 1, color: '#9197B3', textAlign: 'center' }}>
              צור חשבון חדש למערכת ניהול ציוד לסטודנטים לקולנוע
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="fullName"
                  label="שם מלא"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  sx={{ direction: 'rtl' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="username"
                  label="שם משתמש"
                  name="username"
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleChange}
                  sx={{ direction: 'rtl' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="דואר אלקטרוני"
                  name="email"
                  autoComplete="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  sx={{ direction: 'rtl' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="סיסמה"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  sx={{ direction: 'rtl' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="אימות סיסמה"
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  sx={{ direction: 'rtl' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  required
                  fullWidth
                  id="role"
                  label="סוג משתמש"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  sx={{ direction: 'rtl' }}
                >
                  <MenuItem value="student">סטודנט</MenuItem>
                  <MenuItem value="warehouse">צוות מחסן</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.5,
                backgroundColor: '#1E2875',
                fontWeight: 'bold',
                fontSize: '16px',
                '&:hover': {
                  backgroundColor: '#171E5A',
                }
              }}
            >
              {loading ? 'נרשם...' : 'הרשמה'}
            </Button>
            
            <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
              <Grid item>
                <Link component={RouterLink} to="/login" variant="body2" sx={{ color: '#1E2875' }}>
                  כבר יש לך חשבון? התחבר כאן
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default Register;
