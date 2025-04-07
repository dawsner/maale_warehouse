import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Box, 
  Grid,
  Link,
  InputAdornment,
  IconButton,
  Alert,
  Container
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { authAPI } from '../api/api';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // בדיקות בסיסיות לשדות חובה
    if (!username || !password) {
      setError('יש למלא את כל השדות');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', { username, password });
      const user = await authAPI.login(username, password);
      console.log('Login response:', user);
      
      if (user) {
        onLogin(user);
      } else {
        setError('שגיאה בהתחברות. אנא נסה שנית');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // טיפול בסוגי שגיאות שונים
      if (err.message === 'Network Error') {
        setError('שגיאת תקשורת. אנא ודא כי השרת פועל ונסה שנית.');
      } else {
        setError(
          err.response?.data?.message || 
          'שגיאה בהתחברות. אנא נסה שנית. סיסמה או שם משתמש שגויים.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container maxWidth="sm">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mt: 8, 
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center"
          mb={4}
        >
          <img 
            src="/logo.png" 
            alt="לוגו המערכת" 
            style={{ width: '100px', marginBottom: '16px' }} 
          />
          <Typography component="h1" variant="h4" fontWeight="600" color="primary">
            התחברות למערכת
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            התחבר כדי לנהל את מערכת ציוד הקולנוע
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="שם משתמש"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="סיסמה"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleShowPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            disabled={loading}
            sx={{ mt: 4, mb: 2, py: 1.5, fontWeight: 'bold' }}
          >
            {loading ? 'מתחבר...' : 'התחברות'}
          </Button>
          
          <Grid container justifyContent="center" mt={2}>
            <Grid item>
              <Typography variant="body2" textAlign="center">
                אין לך חשבון עדיין?{' '}
                <Link component={RouterLink} to="/register" variant="body2" color="primary" fontWeight="600">
                  הירשם עכשיו
                </Link>
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}

export default Login;