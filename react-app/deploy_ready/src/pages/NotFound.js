import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

function NotFound() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          textAlign: 'center',
          py: 5,
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
        
        <Typography variant="h3" component="h1" gutterBottom color="text.primary" fontWeight="bold">
          404 - הדף לא נמצא
        </Typography>
        
        <Typography variant="h6" color="text.secondary" paragraph sx={{ maxWidth: 600, mb: 4 }}>
          מצטערים, אך הדף שביקשת אינו קיים. ייתכן שהכתובת שהקלדת שגויה או שהדף הוסר.
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          onClick={() => navigate('/')}
          sx={{ 
            py: 1.5, 
            px: 4, 
            borderRadius: 2,
            fontWeight: 'bold',
          }}
        >
          חזרה לדף הבית
        </Button>
      </Box>
    </Container>
  );
}

export default NotFound;