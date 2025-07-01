'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  Search as SearchIcon
} from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
import Navbar from '@/components/layout/Navbar';

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
}

interface Domain {
  id: number;
  name: string;
  institution_id: number;
}

type SortField = 'name' | 'description' | 'domain_name' | 'assessments_count';
type SortOrder = 'asc' | 'desc';

export default function TeacherSkillsPage() {
  const router = useRouter();
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
  const [sortField] = useState<SortField>('name');
  const [sortOrder] = useState<SortOrder>('asc');
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null);
  
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

  useEffect(() => {
    applyFiltersAndSorting();
  }, [skills, sortField, sortOrder, searchTerm, domainFilter, applyFiltersAndSorting]);

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
      setError(data.message || 'Skill deleted successfully');

      setDeleteDialogOpen(false);
      setSkillToDelete(null);
      fetchSkills();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete skill');
    }
  };

  const handleManageLevels = (skill: Skill) => {
    router.push(`/${locale}/teacher/skills/${skill.id}/levels`);
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
          <Alert severity="error">{error}</Alert>
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
          <Typography color="text.primary">{t('skills')}</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" gutterBottom>
          {t('skills')}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Manage educational skills in your institution
        </Typography>

        {/* Search and Add */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="Search skills"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, description, or domain..."
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Domain</InputLabel>
              <Select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                label="Filter by Domain"
              >
                <MenuItem value="">All Domains</MenuItem>
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
            Add Skill
          </Button>
        </Box>

        {/* Results count */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Showing {paginatedSkills.length} of {filteredSkills.length} skills
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
                    Skill Name
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
                  onClick={() => handleSort('domain_name')}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                >
                  <TableSortLabel
                    active={sortField === 'domain_name'}
                    direction={sortField === 'domain_name' ? sortOrder : 'asc'}
                    sx={{ cursor: 'pointer' }}
                  >
                    Domain
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
                    Assessments
                  </TableSortLabel>
                </TableCell>
                <TableCell>Actions</TableCell>
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
                    <IconButton
                      size="small"
                      onClick={() => handleManageLevels(skill)}
                      color="primary"
                      title="Manage Skill Levels"
                    >
                      <Layers />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(skill)}
                      color="primary"
                      disabled={skill.assessments_count > 0}
                      title={skill.assessments_count > 0 ? "Cannot edit skill used in assessments" : "Edit skill"}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(skill)}
                      color="error"
                      disabled={skill.assessments_count > 0}
                      title={skill.assessments_count > 0 ? "Cannot delete skill used in assessments" : "Delete skill"}
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
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSkill ? 'Edit Skill' : 'Add New Skill'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Domain</InputLabel>
              <Select
                value={formData.domain_id}
                onChange={(e) => setFormData(prev => ({ ...prev, domain_id: e.target.value }))}
                label="Domain"
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
                label="Skill Name"
                fullWidth
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                margin="normal"
                required
              />
              <Button variant="text" startIcon={<HelpOutline />} onClick={() => openAiModal('name')} sx={{ mb: 0.5 }}>
                Need help?
              </Button>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                margin="normal"
                required
              />
              <Button variant="text" startIcon={<HelpOutline />} onClick={() => openAiModal('description')} sx={{ mb: 0.5 }}>
                Need help?
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingSkill ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the skill &quot;{skillToDelete?.name}&quot;? 
            {skillToDelete?.assessments_count > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This skill is used in {skillToDelete.assessments_count} assessment(s). 
                You cannot delete a skill that is used in assessments.
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
            disabled={skillToDelete?.assessments_count > 0}
          >
            Delete
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
  const [localContext, setLocalContext] = React.useState(context);
  React.useEffect(() => { setLocalContext(context); }, [context, open]);
  // Only allow Get Suggestions if all context fields are filled
  const canSuggest = localContext.idea.trim() && localContext.level && localContext.context.trim() && localContext.language;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {type === 'name' ? 'Need help with Skill Name?' : 'Need help with Skill Description?'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{
          backgroundColor: theme => theme.palette.info.extraLight || '#eaf4fb',
          borderRadius: 2,
          p: 2,
          mb: 2,
          border: theme => `1px solid ${theme.palette.info.main}`
        }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Skill Context (required for AI help)</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Rough Idea"
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
              <InputLabel id="level-label">Instructional Level</InputLabel>
              <Select
                labelId="level-label"
                value={localContext.level}
                label="Instructional Level"
                onChange={e => setLocalContext(c => ({ ...c, level: e.target.value }))}
              >
                {LEVELS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              label="Educational Context"
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
              <InputLabel id="lang-label">Output Language</InputLabel>
              <Select
                labelId="lang-label"
                value={localContext.language}
                label="Output Language"
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
          {loading ? 'Getting suggestions...' : 'Get Suggestions'}
        </Button>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {suggestions.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Suggestions</Typography>
            {suggestions.map((s, i) => (
              <Paper key={i} sx={{ p: 2, mb: 1, cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }} onClick={() => onPick(s)}>
                {s}
              </Paper>
            ))}
            <Typography variant="caption" color="text.secondary">Click a suggestion to use it</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
