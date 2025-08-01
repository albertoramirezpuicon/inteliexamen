'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  Breadcrumbs,
  Link,
  TableSortLabel,
  TablePagination,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Home as HomeIcon,
  HelpOutline
} from '@mui/icons-material';
import Navbar from '@/components/layout/Navbar';
import GroupMembersDialog from '@/components/teacher/GroupMembersDialog';
import { useTranslations, useLocale } from 'next-intl';

interface User {
  id: number;
  email: string;
  given_name: string;
  family_name: string;
  role: string;
  institution_id: number | null;
  institution_name: string | null;
}

interface Group {
  id: number;
  name: string;
  description: string;
  institution_id: number;
  institution_name: string;
  created_at: string;
  member_count: number;
}

type SortField = 'name' | 'description' | 'created_at' | 'member_count';
type SortOrder = 'asc' | 'desc';

export default function TeacherGroupsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('teacher');

  
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  
  // Filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  
  // Member management states
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<Group | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Info box state
  const [showGroupInfo, setShowGroupInfo] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('Fetching user data from localStorage...');
        const storedUser = localStorage.getItem('user');
        console.log('Raw stored user data:', storedUser);
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          console.log('Parsed user data:', userData);
          console.log('User institution ID:', userData.institution_id);
          setUser(userData);
        } else {
          console.log('No user data found in localStorage, redirecting to login');
          router.push(`/${locale}/teacher/login`);
          return;
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push(`/${locale}/teacher/login`);
      }
    };

    const initializeData = async () => {
      await fetchUserData();
    };

    initializeData();
  }, [router, locale]);

  const fetchGroups = useCallback(async () => {
    try {
      console.log('Fetching groups for user:', user);
      console.log('User institution ID:', user?.institution_id);
      
      if (!user?.institution_id) {
        console.error('No institution ID found for user');
        setError('User institution not found');
        return;
      }

      setLoading(true);
      const response = await fetch('/api/teacher/groups', {
        headers: {
          'x-institution-id': user.institution_id.toString()
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch groups');
      }
      
      const data = await response.json();
      console.log('Groups data:', data);
      setGroups(data.groups);
    } catch (error) {
      setError('Failed to fetch groups');
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const applyFiltersAndSorting = useCallback(() => {
    let filtered = [...groups];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(searchLower) ||
        group.description.toLowerCase().includes(searchLower)
      );
    }

    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'member_count':
          aValue = a.member_count;
          bValue = b.member_count;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredGroups(filtered);
  }, [groups, sortField, sortOrder, searchTerm]);

  // Fetch groups after user data is loaded
  useEffect(() => {
    console.log('useEffect triggered - user state:', user);
    if (user) {
      console.log('User is available, calling fetchGroups');
      fetchGroups();
    } else {
      console.log('User is not available yet');
    }
  }, [user, fetchGroups]);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [applyFiltersAndSorting]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleOpenDialog = (group?: Group) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        description: group.description
      });
    } else {
      setEditingGroup(null);
      setFormData({
        name: '',
        description: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingGroup(null);
    setFormData({
      name: '',
      description: ''
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      const url = editingGroup 
        ? `/api/teacher/groups/${editingGroup.id}`
        : '/api/teacher/groups';
      
      const method = editingGroup ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-institution-id': user!.institution_id.toString()
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save group');
      }

      await fetchGroups();
      handleCloseDialog();
    } catch (error) {
      setError('Failed to save group');
      console.error('Error saving group:', error);
    }
  };

  const handleDelete = (group: Group) => {
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!groupToDelete) return;

    try {
      const response = await fetch(`/api/teacher/groups/${groupToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'x-institution-id': user!.institution_id.toString()
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete group');
      }

      await fetchGroups();
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
    } catch (error) {
      setError('Failed to delete group');
      console.error('Error deleting group:', error);
    }
  };

  const handleViewMembers = (group: Group) => {
    setSelectedGroupForMembers(group);
    setMembersDialogOpen(true);
  };

  const handleAddMember = async (groupId: number, userId: number) => {
    try {
      const response = await fetch(`/api/teacher/groups/${groupId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-institution-id': user!.institution_id.toString()
        },
        body: JSON.stringify({ user_id: userId })
      });

      if (!response.ok) {
        throw new Error('Failed to add member');
      }

      // Refresh groups to update member count
      await fetchGroups();
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  const handleRemoveMember = async (groupId: number, userId: number) => {
    try {
      const response = await fetch(`/api/teacher/groups/${groupId}/members`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-institution-id': user!.institution_id.toString()
        },
        body: JSON.stringify({ user_id: userId })
      });

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      // Refresh groups to update member count
      await fetchGroups();
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const getUserDisplayName = () => {
    return user ? `${user.given_name} ${user.family_name}` : '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!user) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Navbar userType="teacher" userName={getUserDisplayName()} />
      
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link
            color="inherit"
            href={`/${locale}/teacher/dashboard`}
            sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            {t('dashboard')}
          </Link>
          <Typography color="text.primary">{t('groups.title')}</Typography>
        </Breadcrumbs>

        <Typography variant="h4" gutterBottom>
          {t('groups.title')}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('groups.description')}
        </Typography>

        {/* Groups Info Box */}
        {showGroupInfo && (
          <Box
            sx={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: 1,
              p: 2,
              mb: 3,
              position: 'relative'
            }}
          >
            <IconButton
              size="small"
              onClick={() => setShowGroupInfo(false)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                color: 'text.secondary'
              }}
            >
              <HelpOutline />
            </IconButton>
            <Typography variant="h6" sx={{ mb: 1, pr: 4 }}>
              {t('groups.whatIsGroup')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('groups.groupExplanation')}
            </Typography>
            <Button
              size="small"
              onClick={() => setShowGroupInfo(false)}
              sx={{ mt: 1 }}
            >
              {t('groups.hideInfo')}
            </Button>
          </Box>
        )}

        {!showGroupInfo && (
          <Button
            size="small"
            startIcon={<HelpOutline />}
            onClick={() => setShowGroupInfo(true)}
            sx={{ mb: 3 }}
          >
            {t('groups.showInfo')}
          </Button>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            {t('groups.addGroup')}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder={t('groups.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: 400 }}
            />
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'name'}
                      direction={sortField === 'name' ? sortOrder : 'asc'}
                      onClick={() => handleSort('name')}
                    >
                      {t('groups.groupName')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'description'}
                      direction={sortField === 'description' ? sortOrder : 'asc'}
                      onClick={() => handleSort('description')}
                    >
                      {t('groups.description')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'member_count'}
                      direction={sortField === 'member_count' ? sortOrder : 'asc'}
                      onClick={() => handleSort('member_count')}
                    >
                      {t('groups.members')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'created_at'}
                      direction={sortField === 'created_at' ? sortOrder : 'asc'}
                      onClick={() => handleSort('created_at')}
                    >
                      {t('groups.created')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">{t('groups.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography>{t('groups.loadingGroups')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography>{t('groups.noGroupsFound')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGroups
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((group) => (
                      <TableRow key={group.id}>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {group.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {group.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<PeopleIcon />}
                            label={t('groups.membersCount', { count: group.member_count })}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(group.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <IconButton
                              size="small"
                              onClick={() => handleViewMembers(group)}
                              color="primary"
                              title={t('groups.viewMembers')}
                            >
                              <VisibilityIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(group)}
                              color="primary"
                              title={t('groups.editGroup')}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(group)}
                              color="error"
                              title={t('groups.deleteGroup')}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 20, 50]}
            component="div"
            count={filteredGroups.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        </Paper>

        {/* Create/Edit Group Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingGroup ? t('groups.editGroup') : t('groups.addNewGroup')}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label={t('groups.groupName')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label={t('groups.description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>{t('groups.cancel')}</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingGroup ? t('groups.update') : t('groups.create')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>{t('groups.confirmDelete')}</DialogTitle>
          <DialogContent>
            <Typography>
              {t('groups.deleteConfirmation', { name: groupToDelete?.name })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('groups.deleteWarning', { count: groupToDelete?.member_count || 0 })}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>{t('groups.cancel')}</Button>
            <Button onClick={confirmDelete} color="error" variant="contained">
              {t('groups.delete')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Members Dialog */}
        <GroupMembersDialog
          open={membersDialogOpen}
          onClose={() => setMembersDialogOpen(false)}
          group={selectedGroupForMembers}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          userInstitutionId={user?.institution_id || null}
        />
      </Box>
    </Box>
  );
} 