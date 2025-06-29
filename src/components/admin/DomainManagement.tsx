'use client';

import React, { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Edit, Delete, Add, Search, Clear, Category, Business } from '@mui/icons-material';

interface Domain {
  id: string;
  institution_id: string;
  name: string;
  description: string;
  institution_name: string;
}

interface Institution {
  id: string;
  name: string;
}

type SortField = 'name' | 'description' | 'institution_name';
type SortOrder = 'asc' | 'desc';

export default function DomainManagement() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [filteredDomains, setFilteredDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const [sortField, setSortField] = useState<SortField>('institution_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filters, setFilters] = useState({
    search: '',
    institution: ''
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(20);

  useEffect(() => {
    fetchDomains();
    fetchInstitutions();
  }, []);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [domains, sortField, sortOrder, filters]);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/domains');
      if (!response.ok) {
        throw new Error('Failed to fetch domains');
      }
      const data = await response.json();
      setDomains(data.domains);
    } catch (error) {
      setError('Failed to fetch domains');
      console.error('Error fetching domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const response = await fetch('/api/admin/institutions/list');
      if (!response.ok) {
        throw new Error('Failed to fetch institutions');
      }
      const data = await response.json();
      setInstitutions(data.institutions);
    } catch (error) {
      console.error('Error fetching institutions:', error);
    }
  };

  const applyFiltersAndSorting = () => {
    let filtered = [...domains];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(domain =>
        domain.name.toLowerCase().includes(searchLower) ||
        domain.description.toLowerCase().includes(searchLower) ||
        domain.institution_name.toLowerCase().includes(searchLower)
      );
    }

    if (filters.institution) {
      filtered = filtered.filter(domain => domain.institution_id === filters.institution);
    }

    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      aValue = String(aValue || '').toLowerCase();
      bValue = String(bValue || '').toLowerCase();

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredDomains(filtered);
    setPage(0);
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

  const handleCreateDomain = () => {
    setEditingDomain(null);
    setOpenDialog(true);
  };

  const handleEditDomain = (domain: Domain) => {
    setEditingDomain(domain);
    setOpenDialog(true);
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to delete this domain? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/domains/${domainId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete domain');
      }

      setSnackbar({
        open: true,
        message: 'Domain deleted successfully',
        severity: 'success'
      });

      fetchDomains();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to delete domain',
        severity: 'error'
      });
    }
  };

  const handleSaveDomain = async (domainData: Partial<Domain>) => {
    try {
      const url = editingDomain 
        ? `/api/admin/domains/${editingDomain.id}`
        : '/api/admin/domains';
      
      const method = editingDomain ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(domainData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save domain');
      }

      setSnackbar({
        open: true,
        message: editingDomain ? 'Domain updated successfully' : 'Domain created successfully',
        severity: 'success'
      });

      setOpenDialog(false);
      fetchDomains();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save domain',
        severity: 'error'
      });
    }
  };

  const paginatedDomains = filteredDomains.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading domains...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Domain Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateDomain}
        >
          Create Domain
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search domains..."
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Institution</InputLabel>
            <Select
              value={filters.institution}
              label="Institution"
              onChange={(e) => handleFilterChange('institution', e.target.value)}
            >
              <MenuItem value="">All Institutions</MenuItem>
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
            size="small"
          >
            Clear Filters
          </Button>
        </Box>
      </Paper>

      {/* Results count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing {paginatedDomains.length} of {filteredDomains.length} domains
      </Typography>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell 
                onClick={() => handleSort('institution_name')}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
              >
                <TableSortLabel
                  active={sortField === 'institution_name'}
                  direction={sortField === 'institution_name' ? sortOrder : 'asc'}
                  sx={{ cursor: 'pointer' }}
                >
                  Institution
                </TableSortLabel>
              </TableCell>
              <TableCell 
                onClick={() => handleSort('name')}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
              >
                <TableSortLabel
                  active={sortField === 'name'}
                  direction={sortField === 'name' ? sortOrder : 'asc'}
                  sx={{ cursor: 'pointer' }}
                >
                  Domain Name
                </TableSortLabel>
              </TableCell>
              <TableCell 
                onClick={() => handleSort('description')}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
              >
                <TableSortLabel
                  active={sortField === 'description'}
                  direction={sortField === 'description' ? sortOrder : 'asc'}
                  sx={{ cursor: 'pointer' }}
                >
                  Description
                </TableSortLabel>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedDomains.map((domain) => (
              <TableRow key={domain.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Business fontSize="small" color="action" />
                    <Typography variant="body2" fontWeight="medium">
                      {domain.institution_name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Category color="primary" />
                    <Typography variant="body2" fontWeight="medium">
                      {domain.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {domain.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleEditDomain(domain)}
                    title="Edit Domain"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteDomain(domain.id)}
                    color="error"
                    title="Delete Domain"
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
          count={filteredDomains.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[20]}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
          }
        />
      </TableContainer>

      <DomainDialog
        open={openDialog}
        domain={editingDomain}
        institutions={institutions}
        onClose={() => setOpenDialog(false)}
        onSave={handleSaveDomain}
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

interface DomainDialogProps {
  open: boolean;
  domain: Domain | null;
  institutions: Institution[];
  onClose: () => void;
  onSave: (domainData: Partial<Domain>) => void;
}

function DomainDialog({ open, domain, institutions, onClose, onSave }: DomainDialogProps) {
  const [formData, setFormData] = useState({
    institution_id: '',
    name: '',
    description: ''
  });

  useEffect(() => {
    if (domain) {
      setFormData({
        institution_id: domain.institution_id,
        name: domain.name,
        description: domain.description
      });
    } else {
      setFormData({
        institution_id: '',
        name: '',
        description: ''
      });
    }
  }, [domain]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {domain ? 'Edit Domain' : 'Create New Domain'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth required>
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
            <TextField
              label="Domain Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
              inputProps={{ maxLength: 45 }}
              helperText={`${formData.name.length}/45 characters`}
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              multiline
              rows={4}
              fullWidth
              inputProps={{ maxLength: 1024 }}
              helperText={`${formData.description.length}/1024 characters`}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {domain ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 