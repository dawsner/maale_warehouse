import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, Grid, CircularProgress, Divider, 
  Tab, Tabs, Paper, Alert, MenuItem, Select, FormControl, InputLabel, TextField } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import heLocale from 'date-fns/locale/he';
import { format, addMonths, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { styled } from '@mui/system';
import DownloadIcon from '@mui/icons-material/Download';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CompareIcon from '@mui/icons-material/Compare';

import { statsAPI } from '../../api/api';

// רכיבי גרף
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

// סגנונות RTL
const StyledDirRTL = styled(Box)({
  direction: 'rtl',
  textAlign: 'right',
  width: '100%'
});

// צבעים לגרפים
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

// קומפוננטה של דוח מגמות שימוש
const UsageTrendsReport = ({ data, onExport }) => {
  if (!data) return <CircularProgress />;

  // נתונים לגרף קטגוריות
  const categoryData = Object.entries(data.usage_by_category || {}).map(([category, count]) => ({
    category,
    count
  })).sort((a, b) => b.count - a.count);

  // נתונים לגרף מגמות
  const trendData = Object.entries(data.trend_by_category || {}).map(([category, trend]) => ({
    category,
    trend: parseFloat(trend.toFixed(2))
  })).sort((a, b) => b.trend - a.trend);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">דוח מגמות שימוש ציוד</Typography>
        <Button 
          variant="outlined" 
          startIcon={<DownloadIcon />} 
          onClick={() => onExport('usage_trends')}
        >
          ייצוא לאקסל
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* גרף שימוש לפי קטגוריה */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>שימוש לפי קטגוריה</Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, 'מספר השאלות']} />
                    <Legend />
                    <Bar dataKey="count" name="השאלות" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* גרף מגמות */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>מגמות שימוש (יחס גידול)</Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis domain={[0, 'auto']} />
                    <Tooltip formatter={(value) => [value, 'מקדם גידול']} />
                    <Legend />
                    <Bar dataKey="trend" name="מקדם גידול" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* פריטים פופולריים */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>פריטים פופולריים ביותר</Typography>
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>פריט</th>
                      <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>קטגוריה</th>
                      <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>מספר השאלות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.most_popular_items?.map((item, index) => (
                      <tr key={index}>
                        <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee' }}>{item.name}</td>
                        <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee' }}>{item.category}</td>
                        <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #eee' }}>{item.loan_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* פריטים פחות פופולריים */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>פריטים פחות פופולריים</Typography>
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>פריט</th>
                      <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>קטגוריה</th>
                      <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>מספר השאלות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.least_popular_items?.map((item, index) => (
                      <tr key={index}>
                        <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee' }}>{item.name}</td>
                        <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee' }}>{item.category}</td>
                        <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #eee' }}>{item.loan_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// קומפוננטה של דוח תחזית ביקוש
const FutureDemandReport = ({ data, onExport }) => {
  if (!data) return <CircularProgress />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">דוח תחזית ביקוש עתידי</Typography>
        <Button 
          variant="outlined" 
          startIcon={<DownloadIcon />} 
          onClick={() => onExport('future_demand')}
        >
          ייצוא לאקסל
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {/* תחזית לפי פריט */}
        {data.predicted_demand?.slice(0, 6).map((item, index) => (
          <Grid item xs={12} md={6} lg={4} key={index}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>{item.name}</Typography>
                <Typography variant="caption" display="block" color="textSecondary">
                  קטגוריה: {item.category}
                </Typography>
                <Typography variant="caption" display="block" color="textSecondary">
                  ממוצע חודשי נוכחי: {item.current_avg_monthly} | מקדם מגמה: {item.trend_factor}
                </Typography>
                
                <Box height={200} mt={2}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={item.predictions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={['dataMin', 'dataMax']} />
                      <Tooltip formatter={(value) => [value, 'השאלות חזויות']} />
                      <Legend />
                      <Line type="monotone" dataKey="predicted_count" name="תחזית חודשית" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        
        {/* תחזית לפי קטגוריה */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>תחזית ביקוש לפי קטגוריה</Typography>
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>קטגוריה</th>
                      {Object.values(data.predicted_categories || {})[0]?.map((pred, i) => (
                        <th key={i} style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>
                          {pred.month}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data.predicted_categories || {}).map(([category, predictions], index) => (
                      <tr key={index}>
                        <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee' }}>{category}</td>
                        {predictions.map((pred, i) => (
                          <td key={i} style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #eee' }}>
                            {pred.predicted_count}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// קומפוננטה של דוח המלצות רכש
const PurchaseRecommendationsReport = ({ data, onExport }) => {
  if (!data) return <CircularProgress />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">דוח המלצות רכש חכמות</Typography>
        <Button 
          variant="outlined" 
          startIcon={<DownloadIcon />} 
          onClick={() => onExport('purchase_recommendations')}
        >
          ייצוא לאקסל
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {/* סיכום המלצות לפי קטגוריה */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>סיכום המלצות לפי קטגוריה</Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.category_summary || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="item_count" name="מספר פריטים" fill="#8884d8" />
                    <Bar yAxisId="right" dataKey="high_urgency_count" name="פריטים בדחיפות גבוהה" fill="#ff8042" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* המלצות רכש - תרשים עוגה */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>דחיפות רכש לפי קטגוריה</Typography>
              <Box height={300} display="flex" justifyContent="center">
                <ResponsiveContainer width="80%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.category_summary || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total_cost"
                      nameKey="category"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {data.category_summary?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value.toFixed(2) + ' ₪', 'עלות מוערכת']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* רשימת המלצות רכש */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>המלצות רכש מפורטות</Typography>
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>פריט</th>
                      <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>קטגוריה</th>
                      <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>כמות נוכחית</th>
                      <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>זמינות נוכחית</th>
                      <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>כמות מומלצת לרכישה</th>
                      <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>מחיר ליחידה (₪)</th>
                      <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>סה"כ עלות (₪)</th>
                      <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>דחיפות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recommendations?.map((item, index) => (
                      <tr key={index} style={{ backgroundColor: item.urgency === 'high' ? '#fff4f4' : 'white' }}>
                        <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee' }}>{item.name}</td>
                        <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee' }}>{item.category}</td>
                        <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #eee' }}>{item.current_quantity}</td>
                        <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #eee' }}>
                          {item.available_quantity} ({item.availability_percent}%)
                        </td>
                        <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                          {item.recommended_quantity}
                        </td>
                        <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #eee' }}>
                          {item.price_per_unit.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #eee', color: '#d32f2f', fontWeight: 'bold' }}>
                          {item.total_cost.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #eee' }}>
                          <Box
                            component="span"
                            sx={{
                              backgroundColor: item.urgency === 'high' ? '#d32f2f' : '#ffa726',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem'
                            }}
                          >
                            {item.urgency === 'high' ? 'גבוהה' : 'בינונית'}
                          </Box>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// קומפוננטה של דוח השוואה בין תקופות
const ComparativePeriodsReport = ({ data, onExport, onRefresh }) => {
  const [period1Start, setPeriod1Start] = useState(subMonths(startOfMonth(new Date()), 6));
  const [period1End, setPeriod1End] = useState(subMonths(endOfMonth(new Date()), 3));
  const [period2Start, setPeriod2Start] = useState(subMonths(startOfMonth(new Date()), 3));
  const [period2End, setPeriod2End] = useState(endOfMonth(new Date()));
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onRefresh({
      period1_start: format(period1Start, 'yyyy-MM-dd'),
      period1_end: format(period1End, 'yyyy-MM-dd'),
      period2_start: format(period2Start, 'yyyy-MM-dd'),
      period2_end: format(period2End, 'yyyy-MM-dd')
    });
  };

  if (!data && !onRefresh) return <CircularProgress />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">דוח השוואה בין תקופות</Typography>
        {data && (
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />} 
            onClick={() => onExport('comparative_periods')}
          >
            ייצוא לאקסל
          </Button>
        )}
      </Box>
      
      {/* טופס בחירת תקופות */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>בחירת תקופות להשוואה</Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={heLocale}>
                  <DatePicker
                    label="תקופה 1 - התחלה"
                    value={period1Start}
                    onChange={(newValue) => setPeriod1Start(newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={heLocale}>
                  <DatePicker
                    label="תקופה 1 - סיום"
                    value={period1End}
                    onChange={(newValue) => setPeriod1End(newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={heLocale}>
                  <DatePicker
                    label="תקופה 2 - התחלה"
                    value={period2Start}
                    onChange={(newValue) => setPeriod2Start(newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={heLocale}>
                  <DatePicker
                    label="תקופה 2 - סיום"
                    value={period2End}
                    onChange={(newValue) => setPeriod2End(newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                >
                  הפק דוח השוואה
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      
      {data ? (
        <Grid container spacing={3}>
          {/* הבדל באחוזים בין התקופות */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>סיכום השוואה</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box textAlign="center" p={2} border="1px solid #eee" borderRadius={1}>
                      <Typography variant="subtitle2">תקופה 1</Typography>
                      <Typography variant="caption" display="block">
                        {data.period1?.start} עד {data.period1?.end}
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {data.period1?.total_loans} השאלות
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box textAlign="center" p={2} border="1px solid #eee" borderRadius={1}>
                      <Typography variant="subtitle2">תקופה 2</Typography>
                      <Typography variant="caption" display="block">
                        {data.period2?.start} עד {data.period2?.end}
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {data.period2?.total_loans} השאלות
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box textAlign="center" p={2} bgcolor={data.total_change_percent > 0 ? '#e8f5e9' : '#ffebee'} borderRadius={1}>
                      <Typography variant="subtitle2">שינוי</Typography>
                      <Typography variant="h5" color={data.total_change_percent > 0 ? 'success' : 'error'}>
                        {data.total_change_percent > 0 ? '+' : ''}{data.total_change_percent}%
                      </Typography>
                      <Typography variant="body2">
                        {data.period2?.total_loans - data.period1?.total_loans} השאלות
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* השוואת קטגוריות */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>השוואת הלוואות לפי קטגוריה</Typography>
                <Box height={400}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={data.category_comparison?.sort((a, b) => b.period2_loans - a.period2_loans).slice(0, 10)}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="period1_loans" name="תקופה 1" fill="#8884d8" />
                      <Bar dataKey="period2_loans" name="תקופה 2" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* השוואת סטודנטים */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>השוואת סטודנטים פעילים לפי קטגוריה</Typography>
                <Box height={400}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={data.category_comparison?.sort((a, b) => b.period2_students - a.period2_students).slice(0, 10)}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="period1_students" name="תקופה 1" fill="#8884d8" />
                      <Bar dataKey="period2_students" name="תקופה 2" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* טבלת השוואת פריטים */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>השוואת פריטים עם השינוי הגדול ביותר</Typography>
                <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>פריט</th>
                        <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>קטגוריה</th>
                        <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>תקופה 1</th>
                        <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>תקופה 2</th>
                        <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>שינוי</th>
                        <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>שינוי באחוזים</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.item_comparison?.slice(0, 20).map((item, index) => (
                        <tr key={index} style={{ backgroundColor: item.loan_change > 0 ? '#f1f8e9' : '#ffebee' }}>
                          <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee' }}>{item.name}</td>
                          <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee' }}>{item.category}</td>
                          <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #eee' }}>{item.period1_loans}</td>
                          <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #eee' }}>{item.period2_loans}</td>
                          <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #eee', color: item.loan_change > 0 ? 'green' : 'red' }}>
                            {item.loan_change > 0 ? '+' : ''}{item.loan_change}
                          </td>
                          <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #eee', color: item.loan_change_percent > 0 ? 'green' : 'red' }}>
                            {item.loan_change_percent ? (item.loan_change_percent > 0 ? '+' : '') + item.loan_change_percent + '%' : 'חדש'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Alert severity="info">בחר תקופות להשוואה והפק דוח</Alert>
      )}
    </Box>
  );
};

// הקומפוננטה הראשית לניהול דוחות מתקדמים
function AdvancedReports() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // נתוני הדוחות
  const [usageTrendsData, setUsageTrendsData] = useState(null);
  const [futureDemandData, setFutureDemandData] = useState(null);
  const [purchaseRecommendationsData, setPurchaseRecommendationsData] = useState(null);
  const [comparativePeriodsData, setComparativePeriodsData] = useState(null);

  // טעינת דוחות
  const loadReport = async (reportType, params = {}) => {
    setLoading(true);
    setErrorMsg('');
    
    try {
      let result;
      
      switch (reportType) {
        case 'usage_trends':
          result = await statsAPI.getAdvancedUsageTrends(params.months_back);
          if (result && result.success && result.data) {
            setUsageTrendsData(result.data);
          }
          break;

        case 'future_demand':
          result = await statsAPI.getFutureDemandPredictions(params.months_ahead);
          if (result && result.success && result.data) {
            setFutureDemandData(result.data);
          }
          break;

        case 'purchase_recommendations':
          result = await statsAPI.getPurchaseRecommendations();
          if (result && result.success && result.data) {
            setPurchaseRecommendationsData(result.data);
          }
          break;

        case 'comparative_periods':
          result = await statsAPI.getComparativePeriodAnalysis(
            params.period1_start,
            params.period1_end,
            params.period2_start,
            params.period2_end
          );
          if (result && result.success && result.data) {
            setComparativePeriodsData(result.data);
          }
          break;

        default:
          setErrorMsg('סוג דוח לא מוכר');
      }
    } catch (error) {
      console.error('Error loading report data:', error);
      setErrorMsg('שגיאה בטעינת נתוני הדוח: ' + (error.message || 'שגיאת שרת'));
    } finally {
      setLoading(false);
    }
  };

  // ייצוא דוחות
  const exportReport = async (reportType, format = 'excel') => {
    setLoading(true);
    try {
      const params = {};
      
      if (reportType === 'comparative_periods' && comparativePeriodsData) {
        params.period1_start = comparativePeriodsData.period1.start;
        params.period1_end = comparativePeriodsData.period1.end;
        params.period2_start = comparativePeriodsData.period2.start;
        params.period2_end = comparativePeriodsData.period2.end;
      }
      
      const result = await statsAPI.exportAdvancedReport(reportType, params, format);
      
      if (result && result.success && result.data && (result.format === 'excel' || result.format === 'csv')) {
        // יצירת קובץ והורדתו
        const blob = format === 'excel' 
          ? new Blob([atob(result.data)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
          : new Blob([atob(result.data)], { type: 'text/csv' });
          
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || `${reportType}_report.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        setErrorMsg('שגיאה בייצוא הדוח');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      setErrorMsg('שגיאה בייצוא הדוח: ' + (error.message || 'שגיאת שרת'));
    } finally {
      setLoading(false);
    }
  };

  // טעינת דוח לפי הטאב הפעיל
  useEffect(() => {
    const loadActiveReport = () => {
      switch (activeTab) {
        case 0:
          if (!usageTrendsData) loadReport('usage_trends');
          break;
        case 1:
          if (!futureDemandData) loadReport('future_demand');
          break;
        case 2:
          if (!purchaseRecommendationsData) loadReport('purchase_recommendations');
          break;
        case 3:
          // בהשוואת תקופות, הנתונים נטענים רק כשהמשתמש מבקש
          break;
        default:
          break;
      }
    };
    
    loadActiveReport();
  }, [activeTab]);

  // החלפת טאב
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <StyledDirRTL>
      <Typography variant="h4" component="h1" gutterBottom>
        דוחות וסטטיסטיקות מתקדמות
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<AnalyticsIcon />} label="מגמות שימוש" />
          <Tab icon={<TrendingUpIcon />} label="תחזית ביקוש" />
          <Tab icon={<ShoppingCartIcon />} label="המלצות רכש" />
          <Tab icon={<CompareIcon />} label="השוואת תקופות" />
        </Tabs>
      </Paper>

      {errorMsg && (
        <Alert severity="error" onClose={() => setErrorMsg('')} sx={{ mb: 2 }}>
          {errorMsg}
        </Alert>
      )}

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>}

      <Box sx={{ mt: 2 }}>
        {activeTab === 0 && (
          <UsageTrendsReport 
            data={usageTrendsData} 
            onExport={exportReport} 
          />
        )}
        
        {activeTab === 1 && (
          <FutureDemandReport 
            data={futureDemandData} 
            onExport={exportReport} 
          />
        )}
        
        {activeTab === 2 && (
          <PurchaseRecommendationsReport 
            data={purchaseRecommendationsData} 
            onExport={exportReport} 
          />
        )}
        
        {activeTab === 3 && (
          <ComparativePeriodsReport 
            data={comparativePeriodsData} 
            onExport={exportReport}
            onRefresh={(params) => loadReport('comparative_periods', params)}
          />
        )}
      </Box>
    </StyledDirRTL>
  );
}

export default AdvancedReports;