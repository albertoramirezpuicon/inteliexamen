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
  Alert,
  Snackbar,
  TablePagination,
  TableSortLabel,
  InputAdornment,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { Edit, Delete, Add, Search, Clear, People, Visibility } from '@mui/icons-material';

interface Group {
  id: string;
  name: string;
  description: string;
  institution_id: string;
  institution_name?: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  members?: User[];
}

interface User {
  id: string;
  email: string;
  given_name: string;
  family_name: string;
  role: string;
  institution_id: string;
}

type SortField = 'name' | 'description' | 'institution_id' | 'created_at';
type SortOrder = 'asc' | 'desc';

export default function GroupManagement() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openMembersDialog, setOpenMembersDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
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
    institution: ''
  });

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(20);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [groups, sortField, sortOrder, filters, applyFiltersAndSorting]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/groups');
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      const data = await response.json();
      
      // Validate and sanitize the data
      const validGroups = Array.isArray(data.groups) 
        ? data.groups.filter((group: { id: string; name: string; description: string; institution_id: string }) => group && typeof group === 'object')
        : [];
      
      setGroups(validGroups);
    } catch (error) {
      setError('Failed to fetch groups');
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSorting = useCallback(() => {
    let filtered = [...groups].filter(group => group && typeof group === 'object');

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(group =>
        (group.name?.toLowerCase() || '').includes(searchLower) ||
        (group.description?.toLowerCase() || '').includes(searchLower)
      );
    }

    // Apply institution filter
    if (filters.institution) {
      filtered = filtered.filter(group => group.institution_id === filters.institution);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'created_at' || sortField === 'updated_at') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      } else {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredGroups(filtered);
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
    setFilters({ search: '', institution: '' });
  };

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setOpenDialog(true);
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setOpenDialog(true);
  };

  const handleViewMembers = async (group: Group) => {
    try {
      const response = await fetch(`/api/admin/groups/${group.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch group details');
      }
      const data = await response.json();
      setSelectedGroup(data.group);
      setOpenMembersDialog(true);
    } catch {
      setSnackbar({
        open: true,
        message: 'Failed to fetch group members',
        severity: 'error'
      });
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? This will also remove all member associations.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete group');
      }

      setSnackbar({
        open: true,
        message: 'Group deleted successfully',
        severity: 'success'
      });

      fetchGroups();
    } catch {
      setSnackbar({
        open: true,
        message: 'Failed to delete group',
        severity: 'error'
      });
    }
  };

  const handleSaveGroup = async (groupData: Partial<Group>) => {
    try {
      const url = editingGroup ? `/api/admin/groups/${editingGroup.id}` : '/api/admin/groups';
      const method = editingGroup ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save group');
      }

      setSnackbar({
        open: true,
        message: `Group ${editingGroup ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });

      setOpenDialog(false);
      fetchGroups();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save group',
        severity: 'error'
      });
    }
  };

  const handleAddMember = async (groupId: string, userId: string) => {
    try {
      const response = await fetch(`/api/admin/groups/${groupId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add member');
      }

      setSnackbar({
        open: true,
        message: 'Member added successfully',
        severity: 'success'
      });

      // Refresh groups list to update member counts
      fetchGroups();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to add member',
        severity: 'error'
      });
    }
  };

  const handleRemoveMember = async (groupId: string, userId: string) => {
    try {
      const response = await fetch(`/api/admin/groups/${groupId}/members?user_id=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      setSnackbar({
        open: true,
        message: 'Member removed successfully',
        severity: 'success'
      });

      // Refresh groups list to update member counts
      fetchGroups();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to remove member',
        severity: 'error'
      });
    }
  };

  const paginatedGroups = filteredGroups
    .filter(group => group && typeof group === 'object')
    .slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );

  if (loading) {
    return <Typography>Loading groups...</Typography>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Group Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateGroup}
        >
          Add Group
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
            <InputLabel>Institution</InputLabel>
            <Select
              value={filters.institution}
              label="Institution"
              onChange={(e) => handleFilterChange('institution', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="1">Institution 1</MenuItem>
              <MenuItem value="2">Institution 2</MenuItem>
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
        Showing {filteredGroups.length} of {groups.length} groups
      </Typography>

      {/* Groups Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'name'}
                  direction={sortField === 'name' ? sortOrder : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'description'}
                  direction={sortField === 'description' ? sortOrder : 'asc'}
                  onClick={() => handleSort('description')}
                >
                  Description
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'institution_id'}
                  direction={sortField === 'institution_id' ? sortOrder : 'asc'}
                  onClick={() => handleSort('institution_id')}
                >
                  Institution
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'created_at'}
                  direction={sortField === 'created_at' ? sortOrder : 'asc'}
                  onClick={() => handleSort('created_at')}
                >
                  Created
                </TableSortLabel>
              </TableCell>
              <TableCell>Members</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedGroups.map((group) => (
              <TableRow key={group?.id || 'unknown'}>
                <TableCell>{group?.name || ''}</TableCell>
                <TableCell>{group?.description || ''}</TableCell>
                <TableCell>
                  <Chip 
                    label={group?.institution_name || `Institution ${group?.institution_id || 'N/A'}`} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>
                  {group?.created_at ? new Date(group.created_at).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell>
                  <Chip
                    icon={<People />}
                    label={group?.member_count || 0}
                    size="small"
                    variant="outlined"
                    onClick={() => group && handleViewMembers(group)}
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => group && handleViewMembers(group)}
                    title="View Members"
                    disabled={!group}
                  >
                    <Visibility />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => group && handleEditGroup(group)}
                    title="Edit Group"
                    disabled={!group}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => group?.id && handleDeleteGroup(group.id)}
                    color="error"
                    title="Delete Group"
                    disabled={!group?.id}
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
          count={filteredGroups.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[20]}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
          }
        />
      </TableContainer>

      {/* Group Dialog */}
      <GroupDialog
        open={openDialog}
        group={editingGroup}
        onClose={() => setOpenDialog(false)}
        onSave={handleSaveGroup}
      />

      {/* Members Dialog */}
      <MembersDialog
        open={openMembersDialog}
        group={selectedGroup}
        onClose={() => setOpenMembersDialog(false)}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
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

// Group Dialog Component
interface GroupDialogProps {
  open: boolean;
  group: Group | null;
  onClose: () => void;
  onSave: (groupData: Partial<Group>) => void;
}

function GroupDialog({ open, group, onClose, onSave }: GroupDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    institution_id: '1'
  });
  const [institutions, setInstitutions] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    if (open) {
      fetchInstitutions();
    }
  }, [open]);

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: group.description,
        institution_id: group.institution_id
      });
    } else {
      setFormData({
        name: '',
        description: '',
        institution_id: '1'
      });
    }
  }, [group]);

  const fetchInstitutions = async () => {
    try {
      const response = await fetch('/api/admin/institutions/list');
      if (response.ok) {
        const data = await response.json();
        setInstitutions(data.institutions);
      }
    } catch (error) {
      console.error('Error fetching institutions:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {group ? 'Edit Group' : 'Create New Group'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Group Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {group ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// Members Dialog Component
interface MembersDialogProps {
  open: boolean;
  group: Group | null;
  onClose: () => void;
  onAddMember: (groupId: string, userId: string) => void;
  onRemoveMember: (groupId: string, userId: string) => void;
}

function MembersDialog({ open, group, onClose, onAddMember, onRemoveMember }: MembersDialogProps) {
  const [availableStudents, setAvailableStudents] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && group) {
      fetchGroupData();
      fetchAvailableStudents();
    }
  }, [open, group, fetchGroupData, fetchAvailableStudents]);

  const fetchGroupData = useCallback(async () => {
    if (!group) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/groups/${group.id}`);
      if (response.ok) {
        const data = await response.json();
        // Ensure members array is always defined
        const groupWithMembers = {
          ...data.group,
          members: data.group.members || []
        };
        setCurrentGroup(groupWithMembers);
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStudents = useCallback(async () => {
    if (!group) return;
    
    try {
      const response = await fetch(`/api/admin/groups/${group.id}/members`);
      if (response.ok) {
        const data = await response.json();
        setAvailableStudents(data.availableStudents || []);
      }
    } catch (error) {
      console.error('Error fetching available students:', error);
    }
  };

  const handleAddMember = async () => {
    if (selectedStudent && group) {
      await onAddMember(group.id, selectedStudent);
      setSelectedStudent('');
      // Refresh both group data and available students
      await Promise.all([fetchGroupData(), fetchAvailableStudents()]);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (group) {
      await onRemoveMember(group.id, userId);
      // Refresh both group data and available students
      await Promise.all([fetchGroupData(), fetchAvailableStudents()]);
    }
  };

  if (!group) return null;

  const displayGroup = currentGroup || group;
  const members = displayGroup.members || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Group Members: {displayGroup.name}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Add Student</InputLabel>
            <Select
              value={selectedStudent}
              label="Add Student"
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              {(availableStudents || []).map((student) => (
                <MenuItem key={student.id} value={student.id}>
                  {student.given_name} {student.family_name} ({student.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={handleAddMember}
            disabled={!selectedStudent || loading}
          >
            Add
          </Button>
        </Box>

        <Typography variant="h6" sx={{ mb: 1 }}>
          Current Members ({members.length || displayGroup.member_count || 0})
        </Typography>

        {loading ? (
          <Typography color="text.secondary">Loading members...</Typography>
        ) : members.length > 0 ? (
          <List>
            {members.map((member, index) => (
              <React.Fragment key={member.id}>
                <ListItem
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveMember(member.id)}
                      color="error"
                      disabled={loading}
                    >
                      <Delete />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={`${member.given_name} ${member.family_name}`}
                    secondary={member.email}
                  />
                </ListItem>
                {index < members.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary">
            No members in this group
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
} 