import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, CircularProgress } from '@mui/material';
import { statsAPI } from '../api/api';

function Statistics() {
  const [loading, setLoading] = useState(true);
  const [equipmentStats, setEquipmentStats] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [monthlyTrends, setMonthlyTrends] = useState(null);
  const [categoryAnalysis, setCategoryAnalysis] = useState(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      setLoading(true);
      try {
        const [equipment, students, monthly, categories] = await Promise.all([
          statsAPI.getEquipmentUsage(),
          statsAPI.getStudentStatistics(),
          statsAPI.getMonthlyTrends(),
          statsAPI.getCategoryAnalysis()
        ]);
        
        setEquipmentStats(equipment);
        setStudentStats(students);
        setMonthlyTrends(monthly);
        setCategoryAnalysis(categories);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        סטטיסטיקות מערכת
      </Typography>
      
      <Grid container spacing={3}>
        {/* שימוש בציוד */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 350,
            }}
          >
            <Typography variant="h6" component="h2" gutterBottom>
              שימוש בציוד
            </Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {equipmentStats ? (
                <div id="equipment-usage-chart" style={{ width: '100%', height: '300px' }}>
                  {/* כאן יוכנס גרף שימוש בציוד מ-Plotly */}
                </div>
              ) : (
                <Typography>אין נתונים זמינים</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* סטטיסטיקות סטודנטים */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 350,
            }}
          >
            <Typography variant="h6" component="h2" gutterBottom>
              שימוש לפי סטודנטים
            </Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {studentStats ? (
                <div id="student-stats-chart" style={{ width: '100%', height: '300px' }}>
                  {/* כאן יוכנס גרף סטטיסטיקות סטודנטים */}
                </div>
              ) : (
                <Typography>אין נתונים זמינים</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* מגמות חודשיות */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 350,
            }}
          >
            <Typography variant="h6" component="h2" gutterBottom>
              מגמות חודשיות
            </Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {monthlyTrends ? (
                <div id="monthly-trends-chart" style={{ width: '100%', height: '300px' }}>
                  {/* כאן יוכנס גרף מגמות חודשיות */}
                </div>
              ) : (
                <Typography>אין נתונים זמינים</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* ניתוח קטגוריות */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 350,
            }}
          >
            <Typography variant="h6" component="h2" gutterBottom>
              ניתוח לפי קטגוריות
            </Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {categoryAnalysis ? (
                <div id="category-analysis-chart" style={{ width: '100%', height: '300px' }}>
                  {/* כאן יוכנס גרף ניתוח קטגוריות */}
                </div>
              ) : (
                <Typography>אין נתונים זמינים</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Statistics;