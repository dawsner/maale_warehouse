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
  Divider,
  Alert,
  Grid
} from '@mui/material';
import { authAPI } from '../api/api';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('יש למלא את כל השדות');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.login({ username, password });
      onLogin(response.data.user);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'שגיאה בהתחברות, אנא נסו שוב');
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
              התחברות למערכת ניהול ציוד
            </Typography>
            <Typography component="p" variant="body2" sx={{ mt: 1, color: '#9197B3', textAlign: 'center' }}>
              ברוכים הבאים למערכת ניהול ציוד לסטודנטים לקולנוע
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="שם משתמש"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ 
                direction: 'rtl',
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#CECECE',
                  },
                  '&:hover fieldset': {
                    borderColor: '#1E2875',
                  },
                }
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="סיסמה"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ 
                direction: 'rtl',
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#CECECE',
                  },
                  '&:hover fieldset': {
                    borderColor: '#1E2875',
                  },
                }
              }}
            />
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
              {loading ? 'מתחבר...' : 'התחברות'}
            </Button>
            
            <Grid container sx={{ mt: 2 }}>
              <Grid item xs>
                <Link component={RouterLink} to="#" variant="body2" sx={{ color: '#1E2875' }}>
                  שכחת סיסמה?
                </Link>
              </Grid>
              <Grid item>
                <Link component={RouterLink} to="/register" variant="body2" sx={{ color: '#1E2875' }}>
                  אין לך חשבון? הירשם כאן
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login;
