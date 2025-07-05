import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  Tooltip,
  CircularProgress,
  Divider
} from '@mui/material';
import { 
  PersonAdd as PersonAddIcon,
  Edit as EditIcon, 
  Block as BlockIcon, 
  LockOpen as LockOpenIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Category as CategoryIcon,
  School as SchoolIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import { userManagementAPI } from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';

// קומפוננטה לניהול משתמשים
function UserManagement() {
  const { user: currentUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [categoryPermissions, setCategoryPermissions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // דיאלוגים
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [restrictionDialogOpen, setRestrictionDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  
  // נתוני עריכה
  const [editUser, setEditUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [newUserData, setNewUserData] = useState({
    username: '',
    password: '',
    role: 'student',
    email: '',
    full_name: '',
    study_year: 'first',
    branch: 'main'
  });
  
  // נתוני הגבלה
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userRestrictions, setUserRestrictions] = useState([]);
  const [newRestriction, setNewRestriction] = useState({
    item_id: '',
    reason: ''
  });
  
  // נתוני הרשאה
  const [newPermission, setNewPermission] = useState({
    study_year: 'first',
    category: ''
  });
  
  // רענון נתונים
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // קבלת משתמשים
      const usersResponse = await userManagementAPI.getAllUsers();
      if (usersResponse.success) {
        setUsers(usersResponse.users);
      }
      
      // קבלת הרשאות קטגוריות
      const permissionsResponse = await userManagementAPI.getCategoryPermissions();
      if (permissionsResponse.success) {
        setCategoryPermissions(permissionsResponse.permissions);
      }
      
      // קבלת רשימת קטגוריות
      // כאן אנחנו מייצרים רשימה ייחודית מהפריטים שקיימים במערכת
      const uniqueCategories = [...new Set(users
        .filter(u => u.role === 'admin')
        .flatMap(u => u.categories || []))];
      setCategories(uniqueCategories);
      
    } catch (err) {
      console.error('Error fetching user management data:', err);
      setError('אירעה שגיאה בטעינת נתוני ניהול המשתמשים');
    } finally {
      setLoading(false);
    }
  };
  
  // עדכון סטטוס משתמש (חסימה/שחרור)
  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
      const response = await userManagementAPI.updateUserStatus(userId, newStatus);
      
      if (response.success) {
        // עדכון המשתמש ברשימה המקומית
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, status: newStatus } 
            : user
        ));
      }
    } catch (err) {
      console.error('Error toggling user status:', err);
      setError('אירעה שגיאה בעדכון סטטוס המשתמש');
    }
  };
  
  // פתיחת דיאלוג עריכת משתמש
  const handleOpenEditDialog = (user) => {
    setEditUser({ ...user });
    setEditDialogOpen(true);
  };
  
  // שמירת שינויים בפרטי המשתמש
  const handleSaveUserEdit = async () => {
    try {
      const { id, username, email, full_name, role, study_year, branch } = editUser;
      const details = { email, full_name, role, study_year, branch };
      
      const response = await userManagementAPI.updateUserDetails(id, details);
      
      if (response.success) {
        // עדכון המשתמש ברשימה המקומית
        setUsers(users.map(user => 
          user.id === id ? { ...user, ...details } : user
        ));
        setEditDialogOpen(false);
      }
    } catch (err) {
      console.error('Error updating user details:', err);
      setError('אירעה שגיאה בעדכון פרטי המשתמש');
    }
  };
  
  // פתיחת דיאלוג שינוי סיסמה
  const handleOpenPasswordDialog = (user) => {
    setEditUser(user);
    setNewPassword('');
    setPasswordDialogOpen(true);
  };
  
  // שינוי סיסמת משתמש
  const handleChangePassword = async () => {
    try {
      if (!newPassword || newPassword.length < 6) {
        setError('סיסמה חייבת להכיל לפחות 6 תווים');
        return;
      }
      
      const response = await userManagementAPI.changeUserPassword(editUser.id, newPassword);
      
      if (response.success) {
        setPasswordDialogOpen(false);
      }
    } catch (err) {
      console.error('Error changing user password:', err);
      setError('אירעה שגיאה בשינוי סיסמת המשתמש');
    }
  };
  
  // פתיחת דיאלוג משתמש חדש
  const handleOpenNewUserDialog = () => {
    setNewUserData({
      username: '',
      password: '',
      role: 'student',
      email: '',
      full_name: '',
      study_year: 'first',
      branch: 'main'
    });
    setNewUserDialogOpen(true);
  };
  
  // יצירת משתמש חדש
  const handleCreateUser = async () => {
    try {
      // בדיקת תקינות נתונים
      if (!newUserData.username || !newUserData.password || !newUserData.email || !newUserData.full_name) {
        setError('יש למלא את כל השדות הנדרשים');
        return;
      }

      // קריאה ל-API ליצירת משתמש חדש
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUserData)
      });

      const result = await response.json();
      
      if (result.success) {
        // איפוס הטופס
        setNewUserData({
          username: '',
          password: '',
          role: 'student',
          email: '',
          full_name: '',
          study_year: 'first',
          branch: 'main'
        });
        
        setNewUserDialogOpen(false);
        setError(null);
        
        // רענון רשימת המשתמשים
        fetchAllData();
      } else {
        setError(result.message || 'אירעה שגיאה ביצירת המשתמש');
      }
    } catch (err) {
      console.error('Error creating new user:', err);
      setError('אירעה שגיאה ביצירת משתמש חדש');
    }
  };
  
  // פתיחת דיאלוג הגבלות משתמש
  const handleOpenRestrictionDialog = async (userId) => {
    setSelectedUserId(userId);
    setNewRestriction({
      item_id: '',
      reason: ''
    });
    
    try {
      const response = await userManagementAPI.getUserRestrictions(userId);
      
      if (response.success) {
        setUserRestrictions(response.restrictions);
      }
      
      setRestrictionDialogOpen(true);
    } catch (err) {
      console.error('Error fetching user restrictions:', err);
      setError('אירעה שגיאה בטעינת הגבלות משתמש');
    }
  };
  
  // הוספת הגבלת גישה לפריט
  const handleAddRestriction = async () => {
    try {
      const { item_id, reason } = newRestriction;
      
      if (!item_id) {
        setError('יש לבחור פריט');
        return;
      }
      
      const response = await userManagementAPI.addUserRestriction(
        selectedUserId,
        item_id,
        reason,
        currentUser.id
      );
      
      if (response.success) {
        // רענון רשימת ההגבלות
        const updatedResponse = await userManagementAPI.getUserRestrictions(selectedUserId);
        if (updatedResponse.success) {
          setUserRestrictions(updatedResponse.restrictions);
        }
        
        setNewRestriction({
          item_id: '',
          reason: ''
        });
      }
    } catch (err) {
      console.error('Error adding user restriction:', err);
      setError('אירעה שגיאה בהוספת הגבלת משתמש');
    }
  };
  
  // הסרת הגבלת גישה לפריט
  const handleRemoveRestriction = async (restrictionId) => {
    try {
      const response = await userManagementAPI.removeUserRestriction(restrictionId);
      
      if (response.success) {
        // הסרת ההגבלה מהרשימה המקומית
        setUserRestrictions(userRestrictions.filter(
          restriction => restriction.id !== restrictionId
        ));
      }
    } catch (err) {
      console.error('Error removing user restriction:', err);
      setError('אירעה שגיאה בהסרת הגבלת משתמש');
    }
  };
  
  // פתיחת דיאלוג הרשאות קטגוריות
  const handleOpenPermissionDialog = () => {
    setNewPermission({
      study_year: 'first',
      category: ''
    });
    setPermissionDialogOpen(true);
  };
  
  // הוספת הרשאת קטגוריה
  const handleAddPermission = async () => {
    try {
      const { study_year, category } = newPermission;
      
      if (!category) {
        setError('יש לבחור קטגוריה');
        return;
      }
      
      const response = await userManagementAPI.addCategoryPermission(study_year, category);
      
      if (response.success) {
        // רענון רשימת ההרשאות
        const updatedResponse = await userManagementAPI.getCategoryPermissions();
        if (updatedResponse.success) {
          setCategoryPermissions(updatedResponse.permissions);
        }
        
        setNewPermission({
          study_year: 'first',
          category: ''
        });
      }
    } catch (err) {
      console.error('Error adding category permission:', err);
      setError('אירעה שגיאה בהוספת הרשאת קטגוריה');
    }
  };
  
  // הסרת הרשאת קטגוריה
  const handleRemovePermission = async (permissionId) => {
    try {
      const response = await userManagementAPI.removeCategoryPermission(permissionId);
      
      if (response.success) {
        // הסרת ההרשאה מהרשימה המקומית
        setCategoryPermissions(categoryPermissions.filter(
          permission => permission.id !== permissionId
        ));
      }
    } catch (err) {
      console.error('Error removing category permission:', err);
      setError('אירעה שגיאה בהסרת הרשאת קטגוריה');
    }
  };
  
  // טעינת נתונים בעת טעינת הדף
  useEffect(() => {
    fetchAllData();
  }, []);
  
  // שינוי לשונית
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // עזרי תצוגה
  const StudyYearText = (studyYear) => {
    const labels = {
      'first': 'שנה ראשונה',
      'second': 'שנה שניה',
      'third': 'שנה שלישית'
    };
    return labels[studyYear] || studyYear;
  };
  
  const BranchText = (branch) => {
    const labels = {
      'main': 'ראשית',
      'haredi': 'חרדית'
    };
    return labels[branch] || branch;
  };
  
  const RoleText = (role) => {
    const labels = {
      'admin': 'מנהל מערכת',
      'warehouse_staff': 'מנהל מחסן',
      'student': 'סטודנט'
    };
    return labels[role] || role;
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        ניהול משתמשים
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<PersonAddIcon />}
          onClick={handleOpenNewUserDialog}
          sx={{ ml: 1 }}
        >
          משתמש חדש
        </Button>
        <Button 
          variant="outlined" 
          color="primary" 
          startIcon={<RefreshIcon />}
          onClick={fetchAllData}
        >
          רענון
        </Button>
      </Box>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="משתמשים" />
          <Tab label="הרשאות קטגוריות" />
        </Tabs>
        
        {/* לשונית משתמשים */}
        {tabValue === 0 && (
          <Box sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>שם משתמש</TableCell>
                      <TableCell>שם מלא</TableCell>
                      <TableCell>אימייל</TableCell>
                      <TableCell>תפקיד</TableCell>
                      <TableCell>שנת לימודים</TableCell>
                      <TableCell>שלוחה</TableCell>
                      <TableCell>סטטוס</TableCell>
                      <TableCell>פעולות</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{RoleText(user.role)}</TableCell>
                        <TableCell>
                          {user.role === 'student' ? StudyYearText(user.study_year) : '-'}
                        </TableCell>
                        <TableCell>{BranchText(user.branch)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.status === 'active' ? 'פעיל' : 'חסום'} 
                            color={user.status === 'active' ? 'success' : 'error'}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="ערוך משתמש">
                            <IconButton 
                              color="primary" 
                              onClick={() => handleOpenEditDialog(user)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="שנה סיסמה">
                            <IconButton 
                              color="secondary" 
                              onClick={() => handleOpenPasswordDialog(user)}
                            >
                              <SecurityIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title={user.status === 'active' ? 'חסום משתמש' : 'שחרר משתמש'}>
                            <IconButton 
                              color={user.status === 'active' ? 'error' : 'success'}
                              onClick={() => handleToggleUserStatus(user.id, user.status)}
                            >
                              {user.status === 'active' ? <BlockIcon /> : <LockOpenIcon />}
                            </IconButton>
                          </Tooltip>
                          
                          {user.role === 'student' && (
                            <Tooltip title="הגבלות ציוד">
                              <IconButton 
                                color="warning" 
                                onClick={() => handleOpenRestrictionDialog(user.id)}
                              >
                                <CategoryIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
        
        {/* לשונית הרשאות קטגוריות */}
        {tabValue === 1 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<SchoolIcon />}
                onClick={handleOpenPermissionDialog}
              >
                הוסף הרשאת קטגוריה
              </Button>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>שנת לימודים</TableCell>
                      <TableCell>קטגוריה</TableCell>
                      <TableCell>תאריך יצירה</TableCell>
                      <TableCell>פעולות</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categoryPermissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell>{StudyYearText(permission.study_year)}</TableCell>
                        <TableCell>{permission.category}</TableCell>
                        <TableCell>
                          {new Date(permission.created_at).toLocaleDateString('he-IL')}
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            color="error" 
                            onClick={() => handleRemovePermission(permission.id)}
                            title="הסר הרשאה"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Paper>
      
      {/* דיאלוג עריכת משתמש */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>עריכת משתמש</DialogTitle>
        <DialogContent>
          {editUser && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="שם משתמש"
                    value={editUser.username}
                    InputProps={{ readOnly: true }}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="שם מלא"
                    value={editUser.full_name}
                    onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="אימייל"
                    value={editUser.email}
                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>תפקיד</InputLabel>
                    <Select
                      value={editUser.role}
                      onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                    >
                      <MenuItem value="admin">מנהל מערכת</MenuItem>
                      <MenuItem value="warehouse_staff">מנהל מחסן</MenuItem>
                      <MenuItem value="student">סטודנט</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {editUser.role === 'student' && (
                  <>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>שנת לימודים</InputLabel>
                        <Select
                          value={editUser.study_year || 'first'}
                          onChange={(e) => setEditUser({ ...editUser, study_year: e.target.value })}
                        >
                          <MenuItem value="first">שנה ראשונה</MenuItem>
                          <MenuItem value="second">שנה שניה</MenuItem>
                          <MenuItem value="third">שנה שלישית</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                )}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>שלוחה</InputLabel>
                    <Select
                      value={editUser.branch || 'main'}
                      onChange={(e) => setEditUser({ ...editUser, branch: e.target.value })}
                    >
                      <MenuItem value="main">ראשית</MenuItem>
                      <MenuItem value="haredi">חרדית</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>ביטול</Button>
          <Button onClick={handleSaveUserEdit} color="primary">שמור</Button>
        </DialogActions>
      </Dialog>
      
      {/* דיאלוג שינוי סיסמה */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)}>
        <DialogTitle>שינוי סיסמה</DialogTitle>
        <DialogContent>
          {editUser && (
            <Box sx={{ mt: 2 }}>
              <Typography>
                החלפת סיסמה עבור: {editUser.full_name} ({editUser.username})
              </Typography>
              <TextField
                fullWidth
                label="סיסמה חדשה"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                margin="normal"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>ביטול</Button>
          <Button onClick={handleChangePassword} color="primary">שמור</Button>
        </DialogActions>
      </Dialog>
      
      {/* דיאלוג משתמש חדש */}
      <Dialog open={newUserDialogOpen} onClose={() => setNewUserDialogOpen(false)}>
        <DialogTitle>הוספת משתמש חדש</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="שם משתמש"
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="סיסמה"
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="שם מלא"
                  value={newUserData.full_name}
                  onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="אימייל"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>תפקיד</InputLabel>
                  <Select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  >
                    <MenuItem value="admin">מנהל מערכת</MenuItem>
                    <MenuItem value="warehouse_staff">מנהל מחסן</MenuItem>
                    <MenuItem value="student">סטודנט</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {newUserData.role === 'student' && (
                <>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>שנת לימודים</InputLabel>
                      <Select
                        value={newUserData.study_year}
                        onChange={(e) => setNewUserData({ ...newUserData, study_year: e.target.value })}
                      >
                        <MenuItem value="first">שנה ראשונה</MenuItem>
                        <MenuItem value="second">שנה שניה</MenuItem>
                        <MenuItem value="third">שנה שלישית</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>שלוחה</InputLabel>
                  <Select
                    value={newUserData.branch}
                    onChange={(e) => setNewUserData({ ...newUserData, branch: e.target.value })}
                  >
                    <MenuItem value="main">ראשית</MenuItem>
                    <MenuItem value="haredi">חרדית</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewUserDialogOpen(false)}>ביטול</Button>
          <Button onClick={handleCreateUser} color="primary">צור</Button>
        </DialogActions>
      </Dialog>
      
      {/* דיאלוג הגבלות משתמש */}
      <Dialog
        open={restrictionDialogOpen}
        onClose={() => setRestrictionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>הגבלות ציוד למשתמש</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              הגבלות ציוד נוכחיות:
            </Typography>
            
            {userRestrictions.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                אין הגבלות ציוד למשתמש זה
              </Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>פריט</TableCell>
                      <TableCell>קטגוריה</TableCell>
                      <TableCell>סיבה</TableCell>
                      <TableCell>נוצר ע"י</TableCell>
                      <TableCell>תאריך</TableCell>
                      <TableCell>פעולות</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userRestrictions.map((restriction) => (
                      <TableRow key={restriction.id}>
                        <TableCell>{restriction.item_name}</TableCell>
                        <TableCell>{restriction.item_category}</TableCell>
                        <TableCell>{restriction.reason || '-'}</TableCell>
                        <TableCell>{restriction.created_by_name}</TableCell>
                        <TableCell>
                          {new Date(restriction.created_at).toLocaleDateString('he-IL')}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveRestriction(restriction.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              הוסף הגבלת ציוד חדשה:
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label="בחר פריט"
                  select
                  value={newRestriction.item_id}
                  onChange={(e) => setNewRestriction({
                    ...newRestriction,
                    item_id: e.target.value
                  })}
                >
                  {/* כאן צריך לטעון את רשימת הפריטים */}
                  <MenuItem value="1">פריט לדוגמה 1</MenuItem>
                  <MenuItem value="2">פריט לדוגמה 2</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label="סיבה להגבלה"
                  value={newRestriction.reason}
                  onChange={(e) => setNewRestriction({
                    ...newRestriction,
                    reason: e.target.value
                  })}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={handleAddRestriction}
                  sx={{ height: '100%' }}
                >
                  הוסף
                </Button>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestrictionDialogOpen(false)}>סגור</Button>
        </DialogActions>
      </Dialog>
      
      {/* דיאלוג הרשאות קטגוריות */}
      <Dialog
        open={permissionDialogOpen}
        onClose={() => setPermissionDialogOpen(false)}
      >
        <DialogTitle>הוסף הרשאת קטגוריה</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>שנת לימודים</InputLabel>
                  <Select
                    value={newPermission.study_year}
                    onChange={(e) => setNewPermission({
                      ...newPermission,
                      study_year: e.target.value
                    })}
                  >
                    <MenuItem value="first">שנה ראשונה</MenuItem>
                    <MenuItem value="second">שנה שניה</MenuItem>
                    <MenuItem value="third">שנה שלישית</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>קטגוריה</InputLabel>
                  <Select
                    value={newPermission.category}
                    onChange={(e) => setNewPermission({
                      ...newPermission,
                      category: e.target.value
                    })}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionDialogOpen(false)}>ביטול</Button>
          <Button onClick={handleAddPermission} color="primary">הוסף</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserManagement;