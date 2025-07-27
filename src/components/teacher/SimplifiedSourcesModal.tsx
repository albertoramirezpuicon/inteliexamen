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
  TextField,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Checkbox
} from '@mui/material';
import {
  Close,
  Upload,
  Description,
  Check,
  Clear,
  CloudUpload,
  Warning,
  CheckCircle,
  Error
} from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { Source, CreateSourcePayload } from '@/lib/types';

interface SimplifiedSourcesModalProps {
  open: boolean;
  skillId: number;
  skillName: string;
  onClose: () => void;
  onSave: () => void;
}

export default function SimplifiedSourcesModal({ 
  open, 
  skillId, 
  skillName, 
  onClose, 
  onSave 
}: SimplifiedSourcesModalProps) {
  const t = useTranslations('teacher');
  const tCommon = useTranslations('common');
  const tSkills = useTranslations('teacher.skills');
  
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSources, setSelectedSources] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Add new source states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSource, setNewSource] = useState<CreateSourcePayload>({
    title: '',
    authors: '',
    publication_year: undefined
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchSources();
      fetchSelectedSources();
    }
  }, [open, skillId]);

  const fetchSources = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher/skills/${skillId}/sources`);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const handleAddSource = async () => {
    if (!newSource.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!selectedFile) {
      setError('PDF file is required');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', newSource.title.trim());
      if (newSource.authors) formData.append('authors', newSource.authors.trim());
      if (newSource.publication_year) formData.append('publication_year', newSource.publication_year.toString());
      formData.append('pdf_file', selectedFile);

      const response = await fetch('/api/teacher/sources/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Add the new source to the list and select it
        const newSourceData = { ...data.source, is_selected: true };
        setSources(prev => [...prev, newSourceData]);
        setSelectedSources(prev => [...prev, newSourceData.id]);
        
        // Reset form
        setNewSource({
          title: '',
          authors: '',
          publication_year: undefined
        });
        setSelectedFile(null);
        setShowAddForm(false);
        setSuccess('Source uploaded successfully! PDF is being processed...');
      } else {
        setError(data.error || 'Failed to upload source');
      }
    } catch (error) {
      console.error('Error uploading source:', error);
      setError('Failed to upload source');
    } finally {
      setUploading(false);
    }
  };

  const getProcessingStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'processing':
        return <CircularProgress size={20} />;
      case 'failed':
        return <Error color="error" />;
      default:
        return <Warning color="warning" />;
    }
  };

  const getProcessingStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Ready for AI';
      case 'processing':
        return 'Processing PDF...';
      case 'failed':
        return 'Processing failed';
      default:
        return 'Pending upload';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {tSkills('manageSourcesFor')} "{skillName}"
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

        {/* Add New Source Section */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {tSkills('addNewSource')}
          </Typography>
          
          {!showAddForm ? (
            <Button
              variant="outlined"
              startIcon={<Upload />}
              onClick={() => setShowAddForm(true)}
              fullWidth
            >
              {tSkills('uploadPDFSource')}
            </Button>
          ) : (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={tSkills('sourceTitle')}
                    value={newSource.title}
                    onChange={(e) => setNewSource(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={tSkills('authors')}
                    value={newSource.authors}
                    onChange={(e) => setNewSource(prev => ({ ...prev, authors: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={tSkills('publicationYear')}
                    type="number"
                    value={newSource.publication_year || ''}
                    onChange={(e) => setNewSource(prev => ({ 
                      ...prev, 
                      publication_year: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload />}
                    fullWidth
                    sx={{ height: 56 }}
                  >
                    {selectedFile ? selectedFile.name : tSkills('selectPDFFile')}
                    <input
                      type="file"
                      hidden
                      accept=".pdf"
                      onChange={handleFileSelect}
                    />
                  </Button>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleAddSource}
                  disabled={uploading || !newSource.title || !selectedFile}
                  startIcon={uploading ? <CircularProgress size={20} /> : <Upload />}
                >
                  {uploading ? tCommon('uploading') : tSkills('uploadSource')}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewSource({ title: '', authors: '', publication_year: undefined });
                    setSelectedFile(null);
                  }}
                >
                  {tCommon('cancel')}
                </Button>
              </Box>
            </Box>
          )}
        </Paper>

        <Divider sx={{ my: 2 }} />

        {/* Sources List */}
        <Typography variant="h6" gutterBottom>
          {tSkills('availableSources')} ({sources.length})
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {sources.map((source) => (
              <ListItem key={source.id} divider>
                <Box display="flex" alignItems="center" gap={1}>
                  <Checkbox
                    checked={selectedSources.includes(source.id)}
                    onChange={() => handleSourceToggle(source.id)}
                    color="primary"
                  />
                  <Box flex={1}>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Description />
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
                            {getProcessingStatusIcon(source.pdf_processing_status)}
                            <Typography variant="body2" color="text.secondary">
                              {getProcessingStatusText(source.pdf_processing_status)}
                            </Typography>
                            {source.pdf_file_size && (
                              <Typography variant="body2" color="text.secondary">
                                ({(source.pdf_file_size / 1024 / 1024).toFixed(1)} MB)
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </Box>
                </Box>
              </ListItem>
            ))}
            {sources.length === 0 && (
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
          variant="contained"
          onClick={handleSave}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Check />}
        >
          {loading ? tCommon('saving') : tSkills('saveSources')}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 