'use client';

import { useState, useEffect } from 'react';
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
  Search as SearchIcon
} from '@mui/icons-material';
import Navbar from '@/components/layout/Navbar';

interface User {
  id: number;
  email: string;
  given_name: string;
  family_name: string;
  role: string;
  institution_id: number | null;
  institution_name: string | null;
}

interface Domain {
  id: number;
  name: string;
  description: string;
  institution_id: number;
  institution_name: string;
  skills_count: number;
}

type SortField = 'name' | 'description' | 'skills_count';
type SortOrder = 'asc' | 'desc';

export default function TeacherDomainsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [filteredDomains, setFilteredDomains] = useState<Domain[]>([]);
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
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<Domain | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

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
          router.push('/teacher/login');
          return;
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/teacher/login');
      }
    };

    const initializeData = async () => {
      await fetchUserData();
    };

    initializeData();
  }, [router]);

  // Fetch domains after user data is loaded
  useEffect(() => {
    console.log('useEffect triggered - user state:', user);
    if (user) {
      console.log('User is available, calling fetchDomains');
      fetchDomains();
    } else {
      console.log('User is not available yet');
    }
  }, [user]);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [domains, sortField, sortOrder, searchTerm]);

  const fetchDomains = async () => {
    try {
      console.log('Fetching domains for user:', user);
      console.log('User institution ID:', user?.institution_id);
      
      if (!user?.institution_id) {
        console.error('No institution ID found for user');
        setError('User institution not found');
        return;
      }

      setLoading(true);
      const response = await fetch('/api/teacher/domains', {
        headers: {
          'x-institution-id': user.institution_id.toString()
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch domains');
      }
      
      const data = await response.json();
      console.log('Domains data:', data);
      setDomains(data.domains);
    } catch (error) {
      setError('Failed to fetch domains');
      console.error('Error fetching domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSorting = () => {
    let filtered = [...domains];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(domain =>
        domain.name.toLowerCase().includes(searchLower) ||
        domain.description.toLowerCase().includes(searchLower)
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
        case 'skills_count':
          aValue = a.skills_count;
          bValue = b.skills_count;
          break;
        default:
          aValue = '';
          bValue = '';
      }

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

  const handleOpenDialog = (domain?: Domain) => {
    if (domain) {
      setEditingDomain(domain);
      setFormData({
        name: domain.name,
        description: domain.description
      });
    } else {
      setEditingDomain(null);
      setFormData({
        name: '',
        description: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingDomain(null);
    setFormData({
      name: '',
      description: ''
    });
  };

  const handleSubmit = async () => {
    try {
      if (!user?.institution_id) {
        setError('User institution not found');
        return;
      }

      const url = editingDomain 
        ? `/api/teacher/domains/${editingDomain.id}`
        : '/api/teacher/domains';
      
      const method = editingDomain ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-institution-id': user.institution_id.toString()
        },
        body: JSON.stringify({
          ...formData,
          institution_id: user.institution_id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save domain');
      }

      handleCloseDialog();
      fetchDomains();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save domain');
    }
  };

  const handleDelete = (domain: Domain) => {
    setDomainToDelete(domain);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!domainToDelete) return;

    try {
      const response = await fetch(`/api/teacher/domains/${domainToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'x-institution-id': user?.institution_id?.toString() || ''
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete domain');
      }

      setDeleteDialogOpen(false);
      setDomainToDelete(null);
      fetchDomains();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete domain');
    }
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return `${user.given_name} ${user.family_name}`.trim() || user.email;
  };

  const paginatedDomains = filteredDomains.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
        <Navbar userType="teacher" userName={getUserDisplayName()} />
        <Box sx={{ p: 3 }}>
          <Typography>Loading domains...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
        <Navbar userType="teacher" userName={getUserDisplayName()} />
        <Box sx={{ p: 3 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="teacher" userName={getUserDisplayName()} />
      
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href="/teacher/dashboard" color="inherit" underline="hover">
            Dashboard
          </Link>
          <Typography color="text.primary">Domains</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" gutterBottom>
          Domains
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Manage educational domains in your institution
        </Typography>

        {/* Search and Add */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <TextField
            label="Search domains"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or description..."
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Domain
          </Button>
        </Box>

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
                <TableCell 
                  onClick={() => handleSort('skills_count')}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                >
                  <TableSortLabel
                    active={sortField === 'skills_count'}
                    direction={sortField === 'skills_count' ? sortOrder : 'asc'}
                    sx={{ cursor: 'pointer' }}
                  >
                    Skills
                  </TableSortLabel>
                </TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedDomains.map((domain) => (
                <TableRow key={domain.id}>
                  <TableCell>{domain.name}</TableCell>
                  <TableCell>{domain.description}</TableCell>
                  <TableCell>{domain.skills_count}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(domain)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(domain)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={filteredDomains.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDomain ? 'Edit Domain' : 'Add New Domain'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              label="Domain Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              margin="normal"
              required
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingDomain ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the domain "{domainToDelete?.name}"? 
            {domainToDelete?.skills_count > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This domain has {domainToDelete.skills_count} associated skills. 
                You cannot delete a domain that has skills.
              </Alert>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
            disabled={domainToDelete?.skills_count > 0}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 