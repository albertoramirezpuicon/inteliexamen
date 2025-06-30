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
  MenuItem,
  CircularProgress,
  Chip
} from '@mui/material';
import { Edit, Delete, Add, Search, HelpOutline, Layers } from '@mui/icons-material';

const LEVELS = [
  'Primary',
  'Secondary',
  'Technical',
  'University',
  'Professional',
];
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
];

interface Skill {
  id: string;
  institution_id: string;
  domain_id: string;
  name: string;
  description: string;
  institution_name: string;
  domain_name: string;
}

interface Institution {
  id: string;
  name: string;
}

interface Domain {
  id: string;
  name: string;
  institution_id: string;
}

type SortField = 'name' | 'description' | 'institution_name' | 'domain_name';
type SortOrder = 'asc' | 'desc';

export default function SkillManagement() {
  // Context fields
  const [context, setContext] = useState({
    idea: '',
    level: '',
    context: '',
    language: 'es',
  });

  // Data
  const [skills, setSkills] = useState<Skill[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Sorting/filtering
  const [sortField, setSortField] = useState<SortField>('institution_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filters, setFilters] = useState({
    search: '',
    institution: '',
    domain: ''
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(20);

  // AI Helper
  const [aiModal, setAiModal] = useState<{ open: boolean; type: 'name' | 'description' | null }>({ open: false, type: null });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiError, setAiError] = useState('');

  // Skill form
  const [formData, setFormData] = useState({
    institution_id: '',
    domain_id: '',
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchSkills();
    fetchInstitutions();
    fetchDomains();
  }, []);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [skills, sortField, sortOrder, filters]);

  // Fetch functions
  const fetchSkills = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/skills');
      if (!response.ok) throw new Error('Failed to fetch skills');
      const data = await response.json();
      setSkills(data.skills);
    } catch (error) {
      setError('Failed to fetch skills');
    } finally {
      setLoading(false);
    }
  };
  const fetchInstitutions = async () => {
    try {
      const response = await fetch('/api/admin/institutions/list');
      if (!response.ok) throw new Error('Failed to fetch institutions');
      const data = await response.json();
      setInstitutions(data.institutions);
    } catch {}
  };
  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/admin/domains');
      if (!response.ok) throw new Error('Failed to fetch domains');
      const data = await response.json();
      setDomains(data.domains);
    } catch {}
  };

  // Filtering/sorting
  const applyFiltersAndSorting = () => {
    let filtered = [...skills];
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(skill =>
        skill.name.toLowerCase().includes(searchLower) ||
        skill.description.toLowerCase().includes(searchLower) ||
        skill.institution_name.toLowerCase().includes(searchLower) ||
        skill.domain_name.toLowerCase().includes(searchLower)
      );
    }
    if (filters.institution) {
      filtered = filtered.filter(skill => skill.institution_id === filters.institution);
    }
    if (filters.domain) {
      filtered = filtered.filter(skill => skill.domain_id === filters.domain);
    }
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      aValue = String(aValue || '').toLowerCase();
      bValue = String(bValue || '').toLowerCase();
      if (sortOrder === 'asc') return aValue > bValue ? 1 : -1;
      else return aValue < bValue ? 1 : -1;
    });
    setFilteredSkills(filtered);
    setPage(0);
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
    } catch (err: Error | unknown) {
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

  // Skill CRUD logic (omitted for brevity, will add after AI integration)

  // UI
  return (
    <Box sx={{ p: 3 }}>
      {/* Skills Table and Add Skill Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Skills</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditingSkill(null); setFormData({ institution_id: '', domain_id: '', name: '', description: '' }); setContext({ idea: '', level: '', context: '', language: 'es' }); setOpenDialog(true); }}>Add Skill</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Institution</TableCell>
              <TableCell>Domain</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSkills.map((skill) => (
              <TableRow key={skill.id}>
                <TableCell>{skill.institution_name}</TableCell>
                <TableCell>{skill.domain_name}</TableCell>
                <TableCell>{skill.name}</TableCell>
                <TableCell>{skill.description}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => { setEditingSkill(skill); setFormData({
                    institution_id: skill.institution_id,
                    domain_id: skill.domain_id,
                    name: skill.name,
                    description: skill.description
                  }); setOpenDialog(true); }} title="Edit Skill"><Edit /></IconButton>
                  <IconButton size="small" onClick={() => window.location.href = `/admin/skills/${skill.id}/levels`} title="Edit Skill Levels"><Layers /></IconButton>
                  <IconButton size="small" color="error" onClick={async () => { if (confirm('Delete this skill?')) { try { const res = await fetch(`/api/admin/skills/${skill.id}`, { method: 'DELETE' }); const data = await res.json(); if (!res.ok) throw new Error(data.error); setSnackbar({ open: true, message: 'Skill deleted', severity: 'success' }); fetchSkills(); } catch (e: Error | unknown) { setSnackbar({ open: true, message: e instanceof Error ? e.message : 'Error deleting skill', severity: 'error' }); } } }} title="Delete Skill"><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredSkills.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[20]}
        />
      </TableContainer>
      {/* Skill Add/Edit Modal */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingSkill ? 'Edit Skill' : 'Add Skill'}</DialogTitle>
        <DialogContent>
          {/* Skill Details Section (context fields removed) */}
          <Typography variant="subtitle1" sx={{ mb: 2 }}>Skill Details</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl required fullWidth>
              <InputLabel id="institution-label">Institution</InputLabel>
              <Select
                labelId="institution-label"
                value={formData.institution_id}
                label="Institution"
                onChange={e => {
                  setFormData(f => ({ ...f, institution_id: e.target.value, domain_id: '' }));
                }}
                disabled={!!editingSkill}
              >
                {institutions.map(inst => <MenuItem key={inst.id} value={inst.id}>{inst.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl required fullWidth>
              <InputLabel id="domain-label">Domain</InputLabel>
              <Select
                labelId="domain-label"
                value={formData.domain_id}
                label="Domain"
                onChange={e => setFormData(f => ({ ...f, domain_id: e.target.value }))}
                disabled={!formData.institution_id}
              >
                {domains.filter(d => d.institution_id === formData.institution_id).map(dom => (
                  <MenuItem key={dom.id} value={dom.id}>{dom.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
              <TextField
                label="Skill Name"
                value={formData.name}
                onChange={e => setFormData(f => ({ ...f, name: e.target.value.slice(0, 255) }))}
                inputProps={{ maxLength: 255 }}
                helperText={`${formData.name.length}/255`}
                required
                fullWidth
              />
              <Button variant="text" startIcon={<HelpOutline />} onClick={() => openAiModal('name')} sx={{ mb: 0.5 }}>
                Need help?
              </Button>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
              <TextField
                label="Skill Description"
                value={formData.description}
                onChange={e => setFormData(f => ({ ...f, description: e.target.value.slice(0, 1024) }))}
                inputProps={{ maxLength: 1024 }}
                helperText={`${formData.description.length}/1024`}
                required
                fullWidth
                multiline
                minRows={3}
              />
              <Button variant="text" startIcon={<HelpOutline />} onClick={() => openAiModal('description')} sx={{ mb: 0.5 }}>
                Need help?
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              // Validation - only check required skill fields
              if (!formData.institution_id || !formData.domain_id || !formData.name.trim() || !formData.description.trim()) {
                setSnackbar({ open: true, message: 'Please fill in all required fields.', severity: 'error' });
                return;
              }
              try {
                const url = editingSkill ? `/api/admin/skills/${editingSkill.id}` : '/api/admin/skills';
                const method = editingSkill ? 'PUT' : 'POST';
                const res = await fetch(url, {
                  method,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    institution_id: formData.institution_id,
                    domain_id: formData.domain_id,
                    name: formData.name.trim(),
                    description: formData.description.trim(),
                  }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                setSnackbar({ open: true, message: editingSkill ? 'Skill updated' : 'Skill created', severity: 'success' });
                setOpenDialog(false);
                fetchSkills();
              } catch (e: Error | unknown) {
                setSnackbar({ open: true, message: e instanceof Error ? e.message : 'Error saving skill', severity: 'error' });
              }
            }}
          >
            {editingSkill ? 'Save Changes' : 'Create Skill'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Skill Name/Description AI Helper Modals (already present) */}
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