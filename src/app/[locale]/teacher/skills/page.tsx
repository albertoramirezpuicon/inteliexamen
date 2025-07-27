'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Alert,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Breadcrumbs,
  Link,
  CircularProgress,
  TextField,
  InputAdornment,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableSortLabel,
  TableBody,
  Chip,
  Paper
} from '@mui/material';
import { 
  Edit, 
  Delete, 
  Add, 
  Layers,
  HelpOutline,
  Home as HomeIcon,
  Search as SearchIcon,
  Book
} from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
import Navbar from '@/components/layout/Navbar';
import SkillSourcesModal from '@/components/teacher/SkillSourcesModal';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
];

const LEVELS = [
  'Elementary',
  'Middle School',
  'High School',
  'Undergraduate',
  'Graduate',
  'Professional'
];

interface User {
  id: number;
  email: string;
  given_name: string;
  family_name: string;
  role: string;
  institution_id: number | null;
  institution_name: string | null;
}

interface Skill {
  id: number;
  institution_id: number;
  domain_id: number;
  name: string;
  description: string;
  institution_name: string;
  domain_name: string;
  assessments_count: number;
  skill_levels_count: number;
  sources_count?: number;
}

interface Domain {
  id: number;
  name: string;
  institution_id: number;
}

type SortField = 'name' | 'description' | 'domain_name' | 'assessments_count' | 'skill_levels_count';
type SortOrder = 'asc' | 'desc';

export default function TeacherSkillsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('teacher');
  
  const [user, setUser] = useState<User | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  
  // Filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null);
  
  // Sources modal state
  const [sourcesModalOpen, setSourcesModalOpen] = useState(false);
  const [selectedSkillForSources, setSelectedSkillForSources] = useState<Skill | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    domain_id: '',
    name: '',
    description: ''
  });

  // AI Helper states
  const [aiModal, setAiModal] = useState<{ open: boolean; type: 'name' | 'description' | null }>({ open: false, type: null });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiError, setAiError] = useState('');
  const [context, setContext] = useState({
    idea: '',
    level: '',
    context: '',
    language: 'es',
  });

  // Info box state
  const [showSkillInfo, setShowSkillInfo] = useState(true);

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

  // Handle success message from URL
  useEffect(() => {
    const successMessage = searchParams.get('success');
    if (successMessage) {
      setError(decodeURIComponent(successMessage));
      // Clear the success parameter from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('success');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  const fetchSkills = useCallback(async () => {
    try {
      console.log('Fetching skills for user:', user);
      console.log('User institution ID:', user?.institution_id);
      
      if (!user?.institution_id) {
        console.error('No institution ID found for user');
        setError('User institution not found');
        return;
      }

      setLoading(true);
      const response = await fetch('/api/teacher/skills', {
        headers: {
          'x-institution-id': user.institution_id.toString()
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch skills');
      }
      
      const data = await response.json();
      console.log('Skills data:', data);
      setSkills(data.skills);
    } catch (error) {
      setError('Failed to fetch skills');
      console.error('Error fetching skills:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchDomains = useCallback(async () => {
    try {
      if (!user?.institution_id) return;

      const response = await fetch('/api/teacher/domains', {
        headers: {
          'x-institution-id': user.institution_id.toString()
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch domains');
      }
      
      const data = await response.json();
      setDomains(data.domains);
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  }, [user]);

  const applyFiltersAndSorting = useCallback(() => {
    let filtered = [...skills];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(skill =>
        skill.name.toLowerCase().includes(searchLower) ||
        skill.description.toLowerCase().includes(searchLower) ||
        skill.domain_name.toLowerCase().includes(searchLower)
      );
    }

    if (domainFilter) {
      filtered = filtered.filter(skill => skill.domain_id.toString() === domainFilter);
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
        case 'domain_name':
          aValue = a.domain_name.toLowerCase();
          bValue = b.domain_name.toLowerCase();
          break;
        case 'assessments_count':
          aValue = a.assessments_count;
          bValue = b.assessments_count;
          break;
        case 'skill_levels_count':
          aValue = a.skill_levels_count;
          bValue = b.skill_levels_count;
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

    setFilteredSkills(filtered);
    setPage(0);
  }, [skills, sortField, sortOrder, searchTerm, domainFilter]);

  // Fetch skills and domains after user data is loaded
  useEffect(() => {
    console.log('useEffect triggered - user state:', user);
    if (user) {
      console.log('User is available, calling fetchSkills and fetchDomains');
      fetchSkills();
      fetchDomains();
    } else {
      console.log('User is not available yet');
    }
  }, [user, fetchSkills, fetchDomains]);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [skills, sortField, sortOrder, searchTerm, domainFilter, applyFiltersAndSorting]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleOpenDialog = (skill?: Skill) => {
    if (skill) {
      setEditingSkill(skill);
      setFormData({
        domain_id: skill.domain_id.toString(),
        name: skill.name,
        description: skill.description
      });
    } else {
      setEditingSkill(null);
      setFormData({
        domain_id: '',
        name: '',
        description: ''
      });
      setContext({
        idea: '',
        level: '',
        context: '',
        language: 'es',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSkill(null);
    setFormData({
      domain_id: '',
      name: '',
      description: ''
    });
  };

  // AI Helper logic
  const openAiModal = (type: 'name' | 'description') => {
    setAiModal({ open: true, type });
    setAiSuggestions([]);
    setAiError('');
  };

  const closeAiModal = () => {
    setAiModal({ open: false, type: null });
    setAiSuggestions([]);
    setAiError('');
  };

  const handleAiSuggest = async () => {
    setAiLoading(true);
    setAiSuggestions([]);
    setAiError('');
    try {
      const res = await fetch('/api/ai/skill-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: aiModal.type,
          context: context.context,
          level: context.level,
          language: context.language,
          idea: context.idea,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI error');
      setAiSuggestions(data.suggestions || []);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'AI error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiPick = (suggestion: string) => {
    if (aiModal.type === 'name') setFormData(f => ({ ...f, name: suggestion }));
    if (aiModal.type === 'description') setFormData(f => ({ ...f, description: suggestion }));
    closeAiModal();
  };

  const handleSubmit = async () => {
    try {
      if (!user?.institution_id) {
        setError('User institution not found');
        return;
      }

      const url = editingSkill 
        ? `/api/teacher/skills/${editingSkill.id}`
        : '/api/teacher/skills';
      
      const method = editingSkill ? 'PUT' : 'POST';
      
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
        throw new Error(errorData.error || 'Failed to save skill');
      }

      const data = await response.json();
      setError(data.message || (editingSkill ? 'Skill updated successfully' : 'Skill created successfully'));

      handleCloseDialog();
      fetchSkills();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save skill');
    }
  };

  const handleDelete = (skill: Skill) => {
    setSkillToDelete(skill);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!skillToDelete) return;

    try {
      const response = await fetch(`/api/teacher/skills/${skillToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'x-institution-id': user?.institution_id?.toString() || ''
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete skill');
      }

      const data = await response.json();
      
      // Close the delete dialog and clear the skill to delete
      setDeleteDialogOpen(false);
      setSkillToDelete(null);
      
      // Redirect immediately to skills page with success message
      router.push(`/${locale}/teacher/skills?success=${encodeURIComponent(data.message || 'Skill deleted successfully')}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete skill');
    }
  };

  const handleManageLevels = (skill: Skill) => {
    router.push(`/${locale}/teacher/skills/${skill.id}/levels`);
  };

  const handleManageSources = (skill: Skill) => {
    setSelectedSkillForSources(skill);
    setSourcesModalOpen(true);
  };

  const handleSourcesModalClose = () => {
    setSourcesModalOpen(false);
    setSelectedSkillForSources(null);
  };

  const handleSourcesSaved = () => {
    // Refresh the skills list to show updated source counts if needed
    fetchSkills();
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return `${user.given_name} ${user.family_name}`.trim() || user.email;
  };

  const paginatedSkills = filteredSkills.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
        <Navbar userType="teacher" userName={getUserDisplayName()} />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
        <Navbar userType="teacher" userName={getUserDisplayName()} />
        <Box sx={{ p: 3 }}>
          <Alert 
            severity={error.includes('successfully') ? 'success' : 'error'}
            action={
              error.includes('successfully') ? (
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => setError(null)}
                >
                  Continue
                </Button>
              ) : undefined
            }
          >
            {error}
          </Alert>
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
          <Typography color="text.primary">{t('skills.title')}</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" gutterBottom>
          {t('skills.title')}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('skills.description')}
        </Typography>

        {/* Skills Info Box */}
        {showSkillInfo && (
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
              onClick={() => setShowSkillInfo(false)}
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
              {t('skills.whatIsSkill')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('skills.skillExplanation')}
            </Typography>
            <Button
              size="small"
              onClick={() => setShowSkillInfo(false)}
              sx={{ mt: 1 }}
            >
              {t('skills.hideInfo')}
            </Button>
          </Box>
        )}

        {!showSkillInfo && (
          <Button
            size="small"
            startIcon={<HelpOutline />}
            onClick={() => setShowSkillInfo(true)}
            sx={{ mb: 3 }}
          >
            {t('skills.showInfo')}
          </Button>
        )}

        {/* Search and Add */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label={t('skills.searchSkills')}
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('skills.searchPlaceholder')}
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>{t('skills.filterByDomain')}</InputLabel>
              <Select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                label={t('skills.filterByDomain')}
              >
                <MenuItem value="">{t('skills.allDomains')}</MenuItem>
                {domains.map((domain) => (
                  <MenuItem key={domain.id} value={domain.id.toString()}>
                    {domain.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            {t('skills.addSkill')}
          </Button>
        </Box>

        {/* Results count */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('skills.showingResults', { current: paginatedSkills.length, total: filteredSkills.length })}
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
                    {t('skills.skillName')}
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
                    {t('skills.description')}
                  </TableSortLabel>
                </TableCell>
                <TableCell 
                  onClick={() => handleSort('domain_name')}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                >
                  <TableSortLabel
                    active={sortField === 'domain_name'}
                    direction={sortField === 'domain_name' ? sortOrder : 'asc'}
                    sx={{ cursor: 'pointer' }}
                  >
                    {t('skills.domain')}
                  </TableSortLabel>
                </TableCell>
                <TableCell 
                  onClick={() => handleSort('assessments_count')}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                >
                  <TableSortLabel
                    active={sortField === 'assessments_count'}
                    direction={sortField === 'assessments_count' ? sortOrder : 'asc'}
                    sx={{ cursor: 'pointer' }}
                  >
                    {t('skills.assessments')}
                  </TableSortLabel>
                </TableCell>
                <TableCell 
                  onClick={() => handleSort('skill_levels_count')}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                >
                  <TableSortLabel
                    active={sortField === 'skill_levels_count'}
                    direction={sortField === 'skill_levels_count' ? sortOrder : 'asc'}
                    sx={{ cursor: 'pointer' }}
                  >
                    {t('skillLevels.title')}
                  </TableSortLabel>
                </TableCell>
                <TableCell>{t('skills.sources')}</TableCell>
                <TableCell>{t('skills.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedSkills.map((skill) => (
                <TableRow key={skill.id}>
                  <TableCell>{skill.name}</TableCell>
                  <TableCell>{skill.description}</TableCell>
                  <TableCell>{skill.domain_name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={skill.assessments_count} 
                      size="small"
                      color={skill.assessments_count > 0 ? "warning" : "default"}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={skill.skill_levels_count} 
                      size="small"
                      color={skill.skill_levels_count > 0 ? "success" : "default"}
                      title={skill.skill_levels_count > 0 ? t('skills.skillLevelsConfigured') : t('skills.noSkillLevelsConfigured')}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={skill.sources_count || 0} 
                      size="small"
                      color={skill.sources_count && skill.sources_count > 0 ? "info" : "default"}
                      title={skill.sources_count && skill.sources_count > 0 ? `${skill.sources_count} sources configured` : 'No sources configured'}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleManageLevels(skill)}
                      color="primary"
                      title={t('skills.manageSkillLevels')}
                    >
                      <Layers />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleManageSources(skill)}
                      color="secondary"
                      title={t('skills.manageSources')}
                    >
                      <Book />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(skill)}
                      color="primary"
                      disabled={skill.assessments_count > 0}
                      title={skill.assessments_count > 0 ? t('skills.cannotEditSkillUsedInAssessments') : t('skills.editSkill')}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(skill)}
                      color="error"
                      disabled={skill.assessments_count > 0}
                      title={skill.assessments_count > 0 ? t('skills.deleteWarning', { count: skill.assessments_count }) : t('skills.delete')}
                    >
                      <Delete />
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
          count={filteredSkills.length}
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
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSkill ? t('skills.editSkill') : t('skills.addNewSkill')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>{t('skills.domain')}</InputLabel>
              <Select
                value={formData.domain_id}
                onChange={(e) => setFormData(prev => ({ ...prev, domain_id: e.target.value }))}
                label={t('skills.domain')}
              >
                {domains.map((domain) => (
                  <MenuItem key={domain.id} value={domain.id.toString()}>
                    {domain.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
              <TextField
                label={t('skills.skillNameLabel')}
                fullWidth
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                margin="normal"
                required
              />
              <Button variant="text" startIcon={<HelpOutline />} onClick={() => openAiModal('name')} sx={{ mb: 0.5 }}>
                {t('skills.generateWithAI')}
              </Button>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
              <TextField
                label={t('skills.skillDescriptionLabel')}
                fullWidth
                multiline
                rows={10}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                margin="normal"
                required
              />
              <Button variant="text" startIcon={<HelpOutline />} onClick={() => openAiModal('description')} sx={{ mb: 0.5 }}>
                {t('skills.generateWithAI')}
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('skills.cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingSkill ? t('skills.update') : t('skills.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('skills.confirmDelete')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('skills.deleteConfirmation', { name: skillToDelete?.name })} 
            {skillToDelete?.assessments_count > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {t('skills.deleteWarning', { count: skillToDelete.assessments_count })}
              </Alert>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t('skills.cancel')}</Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
            disabled={skillToDelete?.assessments_count > 0}
          >
            {t('skills.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI Helper Modal */}
      <AiHelperModal
        open={aiModal.open}
        type={aiModal.type}
        context={context}
        loading={aiLoading}
        suggestions={aiSuggestions}
        error={aiError}
        onSuggest={handleAiSuggest}
        onPick={handleAiPick}
        onClose={closeAiModal}
      />

      {/* Sources Management Modal */}
      {selectedSkillForSources && (
        <SkillSourcesModal
          open={sourcesModalOpen}
          skillId={selectedSkillForSources.id}
          skillName={selectedSkillForSources.name}
          onClose={handleSourcesModalClose}
          onSave={handleSourcesSaved}
        />
      )}
    </Box>
  );
}

interface AiHelperModalProps {
  open: boolean;
  type: 'name' | 'description' | null;
  context: { idea: string; level: string; context: string; language: string };
  loading: boolean;
  suggestions: string[];
  error: string;
  onSuggest: () => void;
  onPick: (suggestion: string) => void;
  onClose: () => void;
}

function AiHelperModal({ open, type, context, loading, suggestions, error, onSuggest, onPick, onClose }: AiHelperModalProps) {
  const t = useTranslations('teacher');
  const [localContext, setLocalContext] = React.useState(context);
  React.useEffect(() => { setLocalContext(context); }, [context, open]);
  // Only allow Get Suggestions if all context fields are filled
  const canSuggest = localContext.idea.trim() && localContext.level && localContext.context.trim() && localContext.language;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {type === 'name' ? t('skills.aiHelper') + ' - ' + t('skills.skillNameLabel') : t('skills.aiHelper') + ' - ' + t('skills.skillDescriptionLabel')}
      </DialogTitle>
      <DialogContent>
        <Box sx={{
          backgroundColor: theme => theme.palette.info.extraLight || '#eaf4fb',
          borderRadius: 2,
          p: 2,
          mb: 2,
          border: theme => `1px solid ${theme.palette.info.main}`
        }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('skills.aiHelperDescription')}</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label={t('skills.context')}
              value={localContext.idea}
              onChange={e => setLocalContext(c => ({ ...c, idea: e.target.value.slice(0, 200) }))}
              inputProps={{ maxLength: 200 }}
              helperText={`${localContext.idea.length}/200`}
              required
              fullWidth
              multiline
              minRows={3}
            />
            <FormControl required fullWidth>
              <InputLabel id="level-label">{t('skills.educationalLevel')}</InputLabel>
              <Select
                labelId="level-label"
                value={localContext.level}
                label={t('skills.educationalLevel')}
                onChange={e => setLocalContext(c => ({ ...c, level: e.target.value }))}
              >
                {LEVELS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              label={t('skills.additionalContext')}
              value={localContext.context}
              onChange={e => setLocalContext(c => ({ ...c, context: e.target.value.slice(0, 200) }))}
              inputProps={{ maxLength: 200 }}
              helperText={`${localContext.context.length}/200`}
              required
              fullWidth
              multiline
              minRows={3}
            />
            <FormControl required fullWidth>
              <InputLabel id="lang-label">{t('skills.language')}</InputLabel>
              <Select
                labelId="lang-label"
                value={localContext.language}
                label={t('skills.language')}
                onChange={e => setLocalContext(c => ({ ...c, language: e.target.value }))}
              >
                {LANGUAGES.map(l => <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </Box>
        <Button
          variant="contained"
          onClick={() => {
            // Persist context to parent before suggesting
            if (canSuggest) {
              context.idea = localContext.idea;
              context.level = localContext.level;
              context.context = localContext.context;
              context.language = localContext.language;
              onSuggest();
            }
          }}
          disabled={loading || !canSuggest}
          startIcon={loading ? <CircularProgress size={18} /> : <HelpOutline />}
          fullWidth
          sx={{ mb: 2 }}
        >
          {loading ? t('skills.generateSuggestions') + '...' : t('skills.generateSuggestions')}
        </Button>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {suggestions.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('skills.selectSuggestion')}</Typography>
            {suggestions.map((s, i) => (
              <Paper key={i} sx={{ p: 2, mb: 1, cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }} onClick={() => onPick(s)}>
                {s}
              </Paper>
            ))}
            <Typography variant="caption" color="text.secondary">{t('skills.selectSuggestion')}</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('skills.cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
}
