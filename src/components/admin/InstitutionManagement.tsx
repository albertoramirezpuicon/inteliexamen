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
  Alert,
  Snackbar,
  TablePagination,
  TableSortLabel,
  InputAdornment,
  Link
} from '@mui/material';
import { Edit, Delete, Add, Search, Clear, Business, Email, Person } from '@mui/icons-material';

interface Institution {
  id: string;
  name: string;
  contact_name: string;
  contact_email: string;
  created_at: string;
  updated_at: string;
}

type SortField = 'name' | 'contact_name' | 'contact_email' | 'created_at';
type SortOrder = 'asc' | 'desc';

export default function InstitutionManagement() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [filteredInstitutions, setFilteredInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filters, setFilters] = useState({
    search: ''
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(20);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/institutions');
      if (!response.ok) {
        throw new Error('Failed to fetch institutions');
      }
      const data = await response.json();
      setInstitutions(data.institutions);
    } catch (error) {
      setError('Failed to fetch institutions');
      console.error('Error fetching institutions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSorting = useCallback(() => {
    let filtered = [...institutions];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(institution =>
        institution.name.toLowerCase().includes(searchLower) ||
        institution.contact_name.toLowerCase().includes(searchLower) ||
        institution.contact_email.toLowerCase().includes(searchLower)
      );
    }

    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'created_at' || sortField === 'updated_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
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

    setFilteredInstitutions(filtered);
    setPage(0);
  }, [institutions, sortField, sortOrder, filters]);

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

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '' });
  };

  const handleCreateInstitution = () => {
    setEditingInstitution(null);
    setOpenDialog(true);
  };

  const handleEditInstitution = (institution: Institution) => {
    setEditingInstitution(institution);
    setOpenDialog(true);
  };

  const handleDeleteInstitution = async (institutionId: string) => {
    if (!confirm('Are you sure you want to delete this institution? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/institutions/${institutionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete institution');
      }

      setSnackbar({
        open: true,
        message: 'Institution deleted successfully',
        severity: 'success'
      });

      fetchInstitutions();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to delete institution',
        severity: 'error'
      });
    }
  };

  const handleSaveInstitution = async (institutionData: Partial<Institution>) => {
    try {
      const url = editingInstitution ? `/api/admin/institutions/${editingInstitution.id}` : '/api/admin/institutions';
      const method = editingInstitution ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(institutionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save institution');
      }

      setSnackbar({
        open: true,
        message: `Institution ${editingInstitution ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });

      setOpenDialog(false);
      fetchInstitutions();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save institution',
        severity: 'error'
      });
    }
  };

  const paginatedInstitutions = filteredInstitutions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return <Typography>Loading institutions...</Typography>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateInstitution}
        >
          Add Institution
        </Button>
      </Box>

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
            sx={{ minWidth: 300 }}
            placeholder="Search by name, contact name, or email..."
          />
          <Button
            variant="outlined"
            startIcon={<Clear />}
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
        </Box>
      </Paper>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Showing {filteredInstitutions.length} of {institutions.length} institutions
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell 
                onClick={() => handleSort('name')}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
              >
                <TableSortLabel
                  active={sortField === 'name'}
                  direction={sortField === 'name' ? sortOrder : 'asc'}
                  sx={{ cursor: 'pointer' }}
                >
                  Institution Name
                </TableSortLabel>
              </TableCell>
              <TableCell 
                onClick={() => handleSort('contact_name')}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
              >
                <TableSortLabel
                  active={sortField === 'contact_name'}
                  direction={sortField === 'contact_name' ? sortOrder : 'asc'}
                  sx={{ cursor: 'pointer' }}
                >
                  Contact Name
                </TableSortLabel>
              </TableCell>
              <TableCell 
                onClick={() => handleSort('contact_email')}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
              >
                <TableSortLabel
                  active={sortField === 'contact_email'}
                  direction={sortField === 'contact_email' ? sortOrder : 'asc'}
                  sx={{ cursor: 'pointer' }}
                >
                  Contact Email
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
            {paginatedInstitutions.map((institution) => (
              <TableRow key={institution.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Business color="primary" />
                    <Typography variant="body2" fontWeight="medium">
                      {institution.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person fontSize="small" color="action" />
                    <Typography variant="body2">
                      {institution.contact_name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Email fontSize="small" color="action" />
                    <Link href={`mailto:${institution.contact_email}`} underline="hover">
                      {institution.contact_email}
                    </Link>
                  </Box>
                </TableCell>
                <TableCell>
                  {new Date(institution.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleEditInstitution(institution)}
                    title="Edit Institution"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteInstitution(institution.id)}
                    color="error"
                    title="Delete Institution"
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
          count={filteredInstitutions.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[20]}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
          }
        />
      </TableContainer>

      <InstitutionDialog
        open={openDialog}
        institution={editingInstitution}
        onClose={() => setOpenDialog(false)}
        onSave={handleSaveInstitution}
      />

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

interface InstitutionDialogProps {
  open: boolean;
  institution: Institution | null;
  onClose: () => void;
  onSave: (institutionData: Partial<Institution>) => void;
}

function InstitutionDialog({ open, institution, onClose, onSave }: InstitutionDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    contact_email: ''
  });

  useEffect(() => {
    if (institution) {
      setFormData({
        name: institution.name,
        contact_name: institution.contact_name,
        contact_email: institution.contact_email
      });
    } else {
      setFormData({
        name: '',
        contact_name: '',
        contact_email: ''
      });
    }
  }, [institution]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {institution ? 'Edit Institution' : 'Create New Institution'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Institution Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
              inputProps={{ maxLength: 45 }}
              helperText={`${formData.name.length}/45 characters`}
            />
            <TextField
              label="Contact Name"
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              required
              fullWidth
              inputProps={{ maxLength: 255 }}
              helperText={`${formData.contact_name.length}/255 characters`}
            />
            <TextField
              label="Contact Email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              required
              fullWidth
              inputProps={{ maxLength: 255 }}
              helperText={`${formData.contact_email.length}/255 characters`}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {institution ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
