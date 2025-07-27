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
  Search as SearchIcon,
  Home as HomeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  HelpOutline,
  List as ListIcon,
  Lightbulb as LightbulbIcon
} from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
import Navbar from '@/components/layout/Navbar';
import DomainSkillsModal from '@/components/teacher/DomainSkillsModal';
import DomainSkillSuggestionsModal from '@/components/teacher/DomainSkillSuggestionsModal';

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
  const locale = useLocale();
  const t = useTranslations('teacher');

  
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
  
  // Modal states
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [suggestionsModalOpen, setSuggestionsModalOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  
  // Create domain states
  const [creatingDomain, setCreatingDomain] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // UI state
  const [showDomainInfo, setShowDomainInfo] = useState(true);

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

  const fetchDomains = useCallback(async () => {
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
  }, [user]);

  const applyFiltersAndSorting = useCallback(() => {
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
  }, [domains, sortField, sortOrder, searchTerm]);

  // Fetch domains after user data is loaded
  useEffect(() => {
    console.log('useEffect triggered - user state:', user);
    if (user) {
      console.log('User is available, calling fetchDomains');
      fetchDomains();
    } else {
      console.log('User is not available yet');
    }
  }, [user, fetchDomains]);

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
    setCreateError(null);
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

  // Modal handlers
  const handleOpenSkillsModal = (domain: Domain) => {
    setSelectedDomain(domain);
    setSkillsModalOpen(true);
  };

  const handleCloseSkillsModal = () => {
    setSkillsModalOpen(false);
    setSelectedDomain(null);
  };

  const handleOpenSuggestionsModal = (domain: Domain) => {
    setSelectedDomain(domain);
    setSuggestionsModalOpen(true);
  };

  const handleCloseSuggestionsModal = () => {
    setSuggestionsModalOpen(false);
    setSelectedDomain(null);
  };

  const handleSkillsCreated = () => {
    // Refresh domains to update skills count
    fetchDomains();
  };

  // Create domain handlers
  const handleCreateDomain = async (action: 'create' | 'createAndGoToSkills' | 'createAndShowSuggestions') => {
    if (!user?.institution_id) return;

    try {
      setCreatingDomain(true);
      setCreateError(null);

      const response = await fetch('/api/teacher/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-institution-id': user.institution_id.toString()
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          institution_id: user.institution_id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create domain');
      }

      const data = await response.json();
      const newDomain = data.domain;

      // Close the create modal
      handleCloseDialog();

      // Handle different actions
      switch (action) {
        case 'create':
          // Just refresh the domains list
          fetchDomains();
          break;
        
        case 'createAndGoToSkills':
          // Navigate to skills page
          router.push(`/${locale}/teacher/skills`);
          break;
        
        case 'createAndShowSuggestions':
          // Set the new domain and open suggestions modal
          setSelectedDomain(newDomain);
          setSuggestionsModalOpen(true);
          break;
      }
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Failed to create domain');
    } finally {
      setCreatingDomain(false);
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
          <Link
            color="inherit"
            href={`/${locale}/teacher/dashboard`}
            sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            {t('dashboard')}
          </Link>
          <Typography color="text.primary">{t('domains.title')}</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" gutterBottom>
          {t('domains.title')}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('domains.description')}
        </Typography>

        {/* Domain Information Box */}
        {showDomainInfo && (
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
              onClick={() => setShowDomainInfo(false)}
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
              {t('domains.whatIsDomain')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('domains.domainExplanation')}
            </Typography>
            <Button
              size="small"
              onClick={() => setShowDomainInfo(false)}
              sx={{ mt: 1 }}
            >
              {t('domains.hideInfo')}
            </Button>
          </Box>
        )}

        {!showDomainInfo && (
          <Button
            size="small"
            startIcon={<HelpOutline />}
            onClick={() => setShowDomainInfo(true)}
            sx={{ mb: 3 }}
          >
            {t('domains.showInfo')}
          </Button>
        )}

        {/* Search and Add */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <TextField
            label={t('domains.searchDomains')}
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('domains.searchPlaceholder')}
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
            {t('domains.addDomain')}
          </Button>
        </Box>

        {/* Results count */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('domains.showingResults', { current: paginatedDomains.length, total: filteredDomains.length })}
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
                    {t('domains.domainName')}
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
                    {t('domains.description')}
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
                    {t('domains.skills')}
                  </TableSortLabel>
                </TableCell>
                <TableCell>Skills List</TableCell>
                <TableCell>AI Skills Suggestions</TableCell>
                <TableCell>{t('domains.actions')}</TableCell>
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
                      onClick={() => handleOpenSkillsModal(domain)}
                      color="primary"
                      title="View Skills"
                    >
                      <ListIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenSuggestionsModal(domain)}
                      color="secondary"
                      title="AI Skill Suggestions"
                    >
                      <LightbulbIcon />
                    </IconButton>
                  </TableCell>
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
          {editingDomain ? t('domains.editDomain') : t('domains.addNewDomain')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {createError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setCreateError(null)}>
                {createError}
              </Alert>
            )}
            <TextField
              label={t('domains.domainName')}
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              margin="normal"
              required
              disabled={creatingDomain}
            />
            <TextField
              label={t('domains.description')}
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              margin="normal"
              disabled={creatingDomain}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={creatingDomain}>
            {t('domains.cancel')}
          </Button>
          {editingDomain ? (
            <Button onClick={handleSubmit} variant="contained" disabled={creatingDomain}>
              {t('domains.update')}
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button 
                onClick={() => handleCreateDomain('create')} 
                variant="contained" 
                disabled={creatingDomain}
              >
                {t('domains.create')}
              </Button>
              <Button 
                onClick={() => handleCreateDomain('createAndGoToSkills')} 
                variant="contained" 
                disabled={creatingDomain}
              >
                {t('domains.createAndGoToSkills')}
              </Button>
              <Button 
                onClick={() => handleCreateDomain('createAndShowSuggestions')} 
                variant="contained" 
                disabled={creatingDomain}
              >
                {t('domains.createAndShowSuggestions')}
              </Button>
            </Box>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('domains.confirmDelete')}</DialogTitle>
        <DialogContent>
          <Typography component="span">
            {t('domains.deleteConfirmation', { name: domainToDelete?.name })} 
            {domainToDelete?.skills_count > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {t('domains.deleteWarning', { count: domainToDelete.skills_count })}
              </Alert>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t('domains.cancel')}</Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
            disabled={domainToDelete?.skills_count > 0}
          >
            {t('domains.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Skills List Modal */}
      {selectedDomain && (
        <DomainSkillsModal
          open={skillsModalOpen}
          onClose={handleCloseSkillsModal}
          domainId={selectedDomain.id}
          domainName={selectedDomain.name}
        />
      )}

      {/* AI Suggestions Modal */}
      {selectedDomain && (
        <DomainSkillSuggestionsModal
          open={suggestionsModalOpen}
          onClose={handleCloseSuggestionsModal}
          domainId={selectedDomain.id}
          domainName={selectedDomain.name}
          domainDescription={selectedDomain.description}
          onSkillsCreated={handleSkillsCreated}
        />
      )}
    </Box>
  );
} 