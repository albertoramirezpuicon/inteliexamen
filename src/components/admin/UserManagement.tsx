'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  TablePagination,
  TableSortLabel,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { Edit, Delete, Add, Search, Clear, Group } from '@mui/icons-material';

interface User {
  id: number;
  email: string;
  given_name: string;
  family_name: string;
  role: string;
  institution_id: number;
  institution_name?: string;
  language_preference: string;
  created_at: string;
  updated_at: string;
}

interface Institution {
  id: number;
  name: string;
}

interface Group {
  id: number;
  name: string;
  description: string;
  institution_id: number;
  institution_name?: string;
  created_at: string;
  updated_at: string;
}

type SortField = 'email' | 'given_name' | 'family_name' | 'role' | 'institution_id' | 'created_at';
type SortOrder = 'asc' | 'desc';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [openGroupsDialog, setOpenGroupsDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Sorting and filtering state
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    institution: ''
  });

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(20);

  useEffect(() => {
    fetchUsers();
    fetchInstitutions();
    fetchGroups();
  }, []);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [users, sortField, sortOrder, filters, applyFiltersAndSorting]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const response = await fetch('/api/admin/institutions');
      if (!response.ok) {
        throw new Error('Failed to fetch institutions');
      }
      const data = await response.json();
      setInstitutions(data.institutions);
    } catch (error) {
      console.error('Error fetching institutions:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/admin/groups');
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      const data = await response.json();
      setGroups(data.groups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const applyFiltersAndSorting = useCallback(() => {
    let filtered = [...users];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchLower) ||
        user.given_name.toLowerCase().includes(searchLower) ||
        user.family_name.toLowerCase().includes(searchLower)
      );
    }

    // Apply role filter
    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    // Apply institution filter
    if (filters.institution) {
      filtered = filtered.filter(user => user.institution_id === filters.institution);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'created_at' || sortField === 'updated_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
    setPage(0); // Reset to first page when filters change
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', role: '', institution: '' });
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setOpenDialog(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setOpenDialog(true);
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      setSnackbar({
        open: true,
        message: 'User deleted successfully',
        severity: 'success'
      });

      fetchUsers();
    } catch {
      setSnackbar({
        open: true,
        message: 'Failed to delete user',
        severity: 'error'
      });
    }
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save user');
      }

      setSnackbar({
        open: true,
        message: `User ${editingUser ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });

      setOpenDialog(false);
      fetchUsers();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save user',
        severity: 'error'
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'teacher': return 'warning';
      case 'student': return 'info';
      case 'clerk': return 'success';
      default: return 'default';
    }
  };

  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleViewUserGroups = (user: User) => {
    setSelectedUser(user);
    setOpenGroupsDialog(true);
  };

  if (loading) {
    return <Typography>Loading users...</Typography>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateUser}
        >
          Add User
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            label="Search"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={filters.role}
              label="Role"
              onChange={(e) => handleFilterChange('role', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="teacher">Teacher</MenuItem>
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="clerk">Clerk</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Institution</InputLabel>
            <Select
              value={filters.institution}
              label="Institution"
              onChange={(e) => handleFilterChange('institution', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {institutions.map((institution) => (
                <MenuItem key={institution.id} value={institution.id}>
                  {institution.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Clear />}
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
        </Box>
      </Paper>

      {/* Results count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Showing {filteredUsers.length} of {users.length} users
      </Typography>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell 
                onClick={() => handleSort('email')}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
              >
                <TableSortLabel
                  active={sortField === 'email'}
                  direction={sortField === 'email' ? sortOrder : 'asc'}
                  sx={{ cursor: 'pointer' }}
                >
                  Email
                </TableSortLabel>
              </TableCell>
              <TableCell 
                onClick={() => handleSort('given_name')}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
              >
                <TableSortLabel
                  active={sortField === 'given_name'}
                  direction={sortField === 'given_name' ? sortOrder : 'asc'}
                  sx={{ cursor: 'pointer' }}
                >
                  First Name
                </TableSortLabel>
              </TableCell>
              <TableCell 
                onClick={() => handleSort('family_name')}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
              >
                <TableSortLabel
                  active={sortField === 'family_name'}
                  direction={sortField === 'family_name' ? sortOrder : 'asc'}
                  sx={{ cursor: 'pointer' }}
                >
                  Last Name
                </TableSortLabel>
              </TableCell>
              <TableCell 
                onClick={() => handleSort('role')}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
              >
                <TableSortLabel
                  active={sortField === 'role'}
                  direction={sortField === 'role' ? sortOrder : 'asc'}
                  sx={{ cursor: 'pointer' }}
                >
                  Role
                </TableSortLabel>
              </TableCell>
              <TableCell 
                onClick={() => handleSort('institution_id')}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
              >
                <TableSortLabel
                  active={sortField === 'institution_id'}
                  direction={sortField === 'institution_id' ? sortOrder : 'asc'}
                  sx={{ cursor: 'pointer' }}
                >
                  Institution
                </TableSortLabel>
              </TableCell>
              <TableCell 
                onClick={() => handleSort('created_at')}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
              >
                <TableSortLabel
                  active={sortField === 'created_at'}
                  direction={sortField === 'created_at' ? sortOrder : 'asc'}
                  sx={{ cursor: 'pointer' }}
                >
                  Created
                </TableSortLabel>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.given_name}</TableCell>
                <TableCell>{user.family_name}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    color={getRoleColor(user.role) as 'error' | 'warning' | 'info' | 'success' | 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{user.institution_name || 'No Institution'}</TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleEditUser(user)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleViewUserGroups(user)}
                    color="primary"
                  >
                    <Group />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteUser(user.id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredUsers.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[20]}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
          }
        />
      </TableContainer>

      {/* User Dialog */}
      <UserDialog
        open={openDialog}
        user={editingUser}
        institutions={institutions}
        groups={groups}
        onClose={() => setOpenDialog(false)}
        onSave={handleSaveUser}
      />

      {/* User Groups Dialog */}
      <UserGroupsDialog
        open={openGroupsDialog}
        user={selectedUser}
        onClose={() => setOpenGroupsDialog(false)}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// User Dialog Component
interface UserDialogProps {
  open: boolean;
  user: User | null;
  institutions: Institution[];
  groups: Group[];
  onClose: () => void;
  onSave: (userData: Partial<User>) => void;
}

function UserDialog({ open, user, institutions, onClose, onSave }: UserDialogProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    given_name: '',
    family_name: '',
    role: 'student',
    institution_id: '1',
    language_preference: 'en'
  });

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        password: '',
        given_name: user.given_name,
        family_name: user.family_name,
        role: user.role,
        institution_id: user.institution_id,
        language_preference: user.language_preference || 'en'
      });
    } else {
      setFormData({
        email: '',
        password: '',
        given_name: '',
        family_name: '',
        role: 'student',
        institution_id: '1',
        language_preference: 'en'
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSend = { ...formData };
    if (!user && !dataToSend.password) {
      alert('Password is required for new users');
      return;
    }
    if (user && !dataToSend.password) {
      delete dataToSend.password;
    }
    onSave(dataToSend);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {user ? 'Edit User' : 'Create New User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!user}
              fullWidth
              helperText={user ? 'Leave blank to keep current password' : 'Required for new users'}
            />
            <TextField
              label="First Name"
              value={formData.given_name}
              onChange={(e) => setFormData({ ...formData, given_name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Last Name"
              value={formData.family_name}
              onChange={(e) => setFormData({ ...formData, family_name: e.target.value })}
              required
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="teacher">Teacher</MenuItem>
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="clerk">Clerk</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Institution</InputLabel>
              <Select
                value={formData.institution_id}
                label="Institution"
                onChange={(e) => setFormData({ ...formData, institution_id: e.target.value })}
              >
                {institutions.map((institution) => (
                  <MenuItem key={institution.id} value={institution.id}>
                    {institution.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Language Preference</InputLabel>
              <Select
                value={formData.language_preference}
                label="Language Preference"
                onChange={(e) => setFormData({ ...formData, language_preference: e.target.value })}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {user ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// User Groups Dialog Component
interface UserGroupsDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
}

function UserGroupsDialog({ open, user, onClose }: UserGroupsDialogProps) {
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchUserGroups();
    }
  }, [open, user, fetchUserGroups]);

  const fetchUserGroups = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${user.id}/groups`);
      if (response.ok) {
        const data = await response.json();
        setUserGroups(data.groups || []);
      }
    } catch (error) {
      console.error('Error fetching user groups:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Groups for {user.given_name} {user.family_name}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Typography color="text.secondary">Loading groups...</Typography>
        ) : userGroups.length > 0 ? (
          <List>
            {userGroups.map((group, index) => (
              <React.Fragment key={group.id}>
                <ListItem>
                  <ListItemText
                    primary={group.name}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {group.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Institution: {group.institution_name || 'No Institution'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Created: {new Date(group.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < userGroups.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary">
            This user is not a member of any groups
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
} 