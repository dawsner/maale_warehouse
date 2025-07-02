import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Grid, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, List, ListItem, ListItemText,
  ListItemSecondaryAction, Chip, Alert, Snackbar,
  FormControl, InputLabel, Select, MenuItem, Fab,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  CameraAlt as CameraIcon,
  Mic as MicIcon,
  Highlight as LightIcon,
  Construction as GripIcon,
  Videocam as VideoIcon,
  AudioFile as AudioIcon,
  Settings as SettingsIcon,
  Build as BuildIcon
} from '@mui/icons-material';

const ICON_MAP = {
  CameraIcon: <CameraIcon />,
  MicIcon: <MicIcon />,
  LightIcon: <LightIcon />,
  GripIcon: <GripIcon />,
  VideoIcon: <VideoIcon />,
  AudioIcon: <AudioIcon />,
  SettingsIcon: <SettingsIcon />,
  BuildIcon: <BuildIcon />
};

function TemplateManagement() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // נתוני הטופס
  const [formData, setFormData] = useState({
    template_id: '',
    name: '',
    description: '',
    icon_name: 'CameraIcon',
    categories: [],
    combinations: []
  });
  
  const [newCategory, setNewCategory] = useState('');
  const [newCombination, setNewCombination] = useState({ name: '', items: [] });
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_all' })
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      showSnackbar('שגיאה בטעינת המערכים', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        template_id: template.template_id,
        name: template.name,
        description: template.description || '',
        icon_name: template.icon_name || 'CameraIcon',
        categories: template.categories || [],
        combinations: template.combinations || []
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        template_id: '',
        name: '',
        description: '',
        icon_name: 'CameraIcon',
        categories: [],
        combinations: []
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTemplate(null);
    setNewCategory('');
    setNewCombination({ name: '', items: [] });
    setNewItem('');
  };

  const handleSave = async () => {
    if (!formData.name || !formData.template_id) {
      showSnackbar('נא למלא את כל השדות הנדרשים', 'error');
      return;
    }

    try {
      const action = editingTemplate ? 'update' : 'create';
      const requestData = {
        action,
        template: formData
      };

      if (editingTemplate) {
        requestData.template_id = formData.template_id;
      }

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          showSnackbar(editingTemplate ? 'המערך עודכן בהצלחה' : 'המערך נוצר בהצלחה');
          handleCloseDialog();
          loadTemplates();
        } else {
          showSnackbar(result.error || 'שגיאה בשמירת המערך', 'error');
        }
      }
    } catch (error) {
      console.error('Error saving template:', error);
      showSnackbar('שגיאה בשמירת המערך', 'error');
    }
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את המערך?')) {
      return;
    }

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          template_id: templateId
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          showSnackbar('המערך נמחק בהצלחה');
          loadTemplates();
        } else {
          showSnackbar(result.error || 'שגיאה במחיקת המערך', 'error');
        }
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      showSnackbar('שגיאה במחיקת המערך', 'error');
    }
  };

  const addCategory = () => {
    if (newCategory && !formData.categories.includes(newCategory)) {
      setFormData({
        ...formData,
        categories: [...formData.categories, newCategory]
      });
      setNewCategory('');
    }
  };

  const removeCategory = (index) => {
    const newCategories = formData.categories.filter((_, i) => i !== index);
    setFormData({ ...formData, categories: newCategories });
  };

  const addItemToCombination = () => {
    if (newItem && !newCombination.items.includes(newItem)) {
      setNewCombination({
        ...newCombination,
        items: [...newCombination.items, newItem]
      });
      setNewItem('');
    }
  };

  const removeItemFromCombination = (index) => {
    const newItems = newCombination.items.filter((_, i) => i !== index);
    setNewCombination({ ...newCombination, items: newItems });
  };

  const addCombination = () => {
    if (newCombination.name && newCombination.items.length > 0) {
      setFormData({
        ...formData,
        combinations: [...formData.combinations, { ...newCombination }]
      });
      setNewCombination({ name: '', items: [] });
    }
  };

  const removeCombination = (index) => {
    const newCombinations = formData.combinations.filter((_, i) => i !== index);
    setFormData({ ...formData, combinations: newCombinations });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>טוען מערכים...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          ניהול מערכי הזמנות
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ 
            backgroundColor: '#1E2875', 
            '&:hover': { backgroundColor: '#373B5C' }
          }}
        >
          מערך חדש
        </Button>
      </Box>

      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card elevation={2}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  {ICON_MAP[template.icon_name] || <CameraIcon />}
                  <Typography variant="h6" ml={2}>
                    {template.name}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {template.description}
                </Typography>

                <Box mb={2}>
                  <Typography variant="subtitle2" mb={1}>קטגוריות:</Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {template.categories?.map((category, index) => (
                      <Chip key={index} label={category} size="small" />
                    ))}
                  </Box>
                </Box>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">
                      צירופי פריטים ({template.combinations?.length || 0})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {template.combinations?.map((combo, index) => (
                      <Box key={index} mb={1}>
                        <Typography variant="body2" fontWeight="bold">
                          {combo.combination_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {combo.item_names?.join(', ')}
                        </Typography>
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>

                <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
                  <IconButton 
                    onClick={() => handleOpenDialog(template)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleDelete(template.template_id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* דיאלוג עריכה/יצירה */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        dir="rtl"
      >
        <DialogTitle>
          {editingTemplate ? 'עריכת מערך' : 'יצירת מערך חדש'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="מזהה מערך"
                value={formData.template_id}
                onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                disabled={editingTemplate}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="שם המערך"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="תיאור"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>אייקון</InputLabel>
                <Select
                  value={formData.icon_name}
                  onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
                >
                  {Object.keys(ICON_MAP).map(iconName => (
                    <MenuItem key={iconName} value={iconName}>
                      <Box display="flex" alignItems="center">
                        {ICON_MAP[iconName]}
                        <Box ml={2}>{iconName}</Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* קטגוריות */}
            <Grid item xs={12}>
              <Typography variant="h6" mb={2}>קטגוריות</Typography>
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  placeholder="הוסף קטגוריה"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                />
                <Button onClick={addCategory} variant="outlined">
                  הוסף
                </Button>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {formData.categories.map((category, index) => (
                  <Chip
                    key={index}
                    label={category}
                    onDelete={() => removeCategory(index)}
                  />
                ))}
              </Box>
            </Grid>

            {/* צירופי פריטים */}
            <Grid item xs={12}>
              <Typography variant="h6" mb={2}>צירופי פריטים מומלצים</Typography>
              
              {/* יצירת צירוף חדש */}
              <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  placeholder="שם הצירוף"
                  value={newCombination.name}
                  onChange={(e) => setNewCombination({ ...newCombination, name: e.target.value })}
                  margin="normal"
                />
                
                <Box display="flex" gap={1} my={2}>
                  <TextField
                    placeholder="הוסף פריט"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addItemToCombination()}
                  />
                  <Button onClick={addItemToCombination} variant="outlined">
                    הוסף פריט
                  </Button>
                </Box>
                
                <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                  {newCombination.items.map((item, index) => (
                    <Chip
                      key={index}
                      label={item}
                      onDelete={() => removeItemFromCombination(index)}
                    />
                  ))}
                </Box>
                
                <Button 
                  onClick={addCombination}
                  variant="contained"
                  disabled={!newCombination.name || newCombination.items.length === 0}
                >
                  הוסף צירוף
                </Button>
              </Paper>

              {/* רשימת צירופים קיימים */}
              {formData.combinations.map((combo, index) => (
                <Paper key={index} elevation={1} sx={{ p: 2, mb: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="start">
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {combo.name}
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                        {combo.items.map((item, itemIndex) => (
                          <Chip key={itemIndex} label={item} size="small" />
                        ))}
                      </Box>
                    </Box>
                    <IconButton onClick={() => removeCombination(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>ביטול</Button>
          <Button onClick={handleSave} variant="contained">
            {editingTemplate ? 'עדכן' : 'צור'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* הודעות */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default TemplateManagement;