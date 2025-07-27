'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  Grid,
  Link
} from '@mui/material';
import {
  Close,
  ExpandMore,
  Add,
  Book,
  Article,
  School,
  Language,
  Link as LinkIcon,
  Check,
  Clear,
  Search as SearchIcon
} from '@mui/icons-material';
import { useTranslations } from 'next-intl';

interface Source {
  id: number;
  title: string;
  authors?: string;
  publication_year?: number;
  source_type: string;
  url?: string;
  doi?: string;
  description?: string;
  is_custom: boolean;
  created_at: string;
  is_selected?: boolean;
}

interface SkillSourcesModalProps {
  open: boolean;
  skillId: number;
  skillName: string;
  onClose: () => void;
  onSave: () => void;
}

const SOURCE_TYPES = [
  { value: 'textbook', label: 'Textbook', icon: <Book /> },
  { value: 'journal_article', label: 'Journal Article', icon: <Article /> },
  { value: 'academic_paper', label: 'Academic Paper', icon: <School /> },
  { value: 'online_resource', label: 'Online Resource', icon: <Language /> }
];

export default function SkillSourcesModal({ 
  open, 
  skillId, 
  skillName, 
  onClose, 
  onSave 
}: SkillSourcesModalProps) {
  const t = useTranslations('teacher');
  const tCommon = useTranslations('common');
  const tSkills = useTranslations('teacher.skills');
  
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSources, setSelectedSources] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filter states
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Add custom source states
  const [showAddForm, setShowAddForm] = useState(false);
  const [customSource, setCustomSource] = useState({
    title: '',
    authors: '',
    publication_year: '',
    source_type: 'textbook',
    url: '',
    doi: '',
    description: ''
  });
  const [addingSource, setAddingSource] = useState(false);

  useEffect(() => {
    if (open) {
      fetchSources();
      fetchSelectedSources();
    }
  }, [open, skillId]);

  const fetchSources = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher/sources?skill_id=${skillId}`);
      const data = await response.json();
      
      if (response.ok) {
        setSources(data.sources);
      } else {
        setError(data.error || 'Failed to fetch sources');
      }
    } catch (error) {
      console.error('Error fetching sources:', error);
      setError('Failed to fetch sources');
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectedSources = async () => {
    try {
      const response = await fetch(`/api/teacher/skills/${skillId}/sources`);
      const data = await response.json();
      
      if (response.ok) {
        setSelectedSources(data.sources.map((s: Source) => s.id));
      }
    } catch (error) {
      console.error('Error fetching selected sources:', error);
    }
  };

  const handleSourceToggle = (sourceId: number) => {
    setSelectedSources(prev => 
      prev.includes(sourceId) 
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/teacher/skills/${skillId}/sources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourceIds: selectedSources }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(data.message);
        onSave();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.error || 'Failed to save sources');
      }
    } catch (error) {
      console.error('Error saving sources:', error);
      setError('Failed to save sources');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomSource = async () => {
    try {
      setAddingSource(true);
      setError(null);
      
      const response = await fetch('/api/teacher/sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customSource),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Add the new source to the list and select it
        const newSource = { ...data.source, is_selected: true };
        setSources(prev => [...prev, newSource]);
        setSelectedSources(prev => [...prev, newSource.id]);
        
        // Reset form
        setCustomSource({
          title: '',
          authors: '',
          publication_year: '',
          source_type: 'textbook',
          url: '',
          doi: '',
          description: ''
        });
        setShowAddForm(false);
      } else {
        setError(data.error || 'Failed to add source');
      }
    } catch (error) {
      console.error('Error adding custom source:', error);
      setError('Failed to add source');
    } finally {
      setAddingSource(false);
    }
  };

  const filteredSources = sources.filter(source => {
    const matchesType = !sourceTypeFilter || source.source_type === sourceTypeFilter;
    const matchesSearch = !searchTerm || 
      source.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (source.authors && source.authors.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesType && matchesSearch;
  });

  const getSourceTypeIcon = (type: string) => {
    const sourceType = SOURCE_TYPES.find(st => st.value === type);
    return sourceType?.icon || <Book />;
  };

  const getSourceTypeLabel = (type: string) => {
    const sourceType = SOURCE_TYPES.find(st => st.value === type);
    return sourceType?.label || type;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {tSkills('manageSources')} - {skillName}
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                                      <InputLabel>{tSkills('sourceType')}</InputLabel>
                      <Select
                        value={sourceTypeFilter}
                        onChange={(e) => setSourceTypeFilter(e.target.value)}
                        label={tSkills('sourceType')}
                      >
                        <MenuItem value="">{tSkills('allTypes')}</MenuItem>
                  {SOURCE_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {type.icon}
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder={tSkills('searchSources')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
          </Grid>

          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setShowAddForm(!showAddForm)}
            sx={{ mb: 2 }}
          >
            {tSkills('addCustomSource')}
          </Button>

          {showAddForm && (
            <Accordion expanded={showAddForm} sx={{ mb: 2 }}>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={tSkills('sourceTitle')}
                      value={customSource.title}
                      onChange={(e) => setCustomSource(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={tSkills('authors')}
                      value={customSource.authors}
                      onChange={(e) => setCustomSource(prev => ({ ...prev, authors: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={tSkills('publicationYear')}
                      type="number"
                      value={customSource.publication_year}
                      onChange={(e) => setCustomSource(prev => ({ ...prev, publication_year: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>{tSkills('sourceType')}</InputLabel>
                      <Select
                        value={customSource.source_type}
                        onChange={(e) => setCustomSource(prev => ({ ...prev, source_type: e.target.value }))}
                        label={tSkills('sourceType')}
                      >
                        {SOURCE_TYPES.map(type => (
                          <MenuItem key={type.value} value={type.value}>
                            <Box display="flex" alignItems="center" gap={1}>
                              {type.icon}
                              {type.label}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={tSkills('url')}
                      value={customSource.url}
                      onChange={(e) => setCustomSource(prev => ({ ...prev, url: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={tSkills('doi')}
                      value={customSource.doi}
                      onChange={(e) => setCustomSource(prev => ({ ...prev, doi: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label={tSkills('description')}
                      value={customSource.description}
                      onChange={(e) => setCustomSource(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={handleAddCustomSource}
                      disabled={addingSource || !customSource.title}
                      startIcon={addingSource ? <CircularProgress size={20} /> : <Add />}
                    >
                      {addingSource ? tSkills('adding') : tSkills('addSource')}
                    </Button>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>

        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          {tSkills('availableSources')} ({filteredSources.length})
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredSources.map((source) => (
              <ListItem key={source.id} divider>
                <Checkbox
                  checked={selectedSources.includes(source.id)}
                  onChange={() => handleSourceToggle(source.id)}
                  color="primary"
                />
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      {getSourceTypeIcon(source.source_type)}
                      <Typography variant="subtitle2">
                        {source.title}
                      </Typography>
                      {source.is_custom && (
                        <Chip label={tSkills('custom')} size="small" color="secondary" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      {source.authors && (
                        <Typography variant="body2" color="text.secondary">
                          {source.authors}
                          {source.publication_year && ` (${source.publication_year})`}
                        </Typography>
                      )}
                      <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                        <Chip 
                          label={getSourceTypeLabel(source.source_type)} 
                          size="small" 
                          variant="outlined" 
                        />
                        {source.url && (
                          <Link href={source.url} target="_blank" rel="noopener">
                            <LinkIcon fontSize="small" />
                          </Link>
                        )}
                      </Box>
                      {source.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {source.description}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
            {filteredSources.length === 0 && (
              <ListItem>
                <ListItemText
                  primary={tSkills('noSourcesFound')}
                  secondary={tSkills('noSourcesFoundDescription')}
                />
              </ListItem>
            )}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {tCommon('cancel')}
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Check />}
        >
          {loading ? tCommon('saving') : tSkills('saveSources')}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 