/**
 * TEACHER SOURCES MANAGEMENT PAGE
 * 
 * PURPOSE: Teacher sources management page for managing sources and references for skills
 * 
 * CONNECTIONS:
 * - Accessible from /teacher/dashboard via sources panel
 * - Links to skill-specific source management
 * - Uses existing SkillSourcesModal for detailed source management
 * 
 * KEY FEATURES:
 * - Domain and skill selection for source management
 * - Hierarchical skill organization by domain
 * - Integration with existing sources management system
 * - Institution-specific data and management
 * - Direct source display below skill selection
 * - Inline source addition functionality
 * 
 * NAVIGATION FLOW:
 * - Entry point from teacher dashboard
 * - Skill selection interface
 * - Direct source display and management
 * - Modal-based source management for selected skills
 * 
 * INSTITUTION SCOPE:
 * - Manages sources for skills within teacher's institution
 * - Provides access to comprehensive source management tools
 * - Integrates with existing skill-source relationships
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  Grid,
  Paper,
  IconButton,
  Chip,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Book as BookIcon,
  Home as HomeIcon,
  Psychology as PsychologyIcon,
  HelpOutline,
  Add as AddIcon,
  Description,
  CheckCircle,
  Error,
  Warning,
  CloudUpload,
  Upload,
  Close,

  Link as LinkIcon,
  Delete
} from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Source, CreateSourcePayload } from '@/lib/types';

import LinkExistingSourcesModal from '@/components/teacher/LinkExistingSourcesModal';
import PDFViewerModal from '@/components/teacher/PDFViewerModal';

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
  skills_count: number;
}

interface Skill {
  id: number;
  name: string;
  description: string;
  domain_id: number;
  domain_name: string;
  sources_count?: number;
}

export default function TeacherSourcesPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('teacher');
  const tCommon = useTranslations('common');
  const tSkills = useTranslations('teacher.skills');
  
  const [user, setUser] = useState<User | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Sources state
  const [sources, setSources] = useState<Source[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [selectedSources, setSelectedSources] = useState<number[]>([]);
  


  // Add new source states
  const [showAddSourceDialog, setShowAddSourceDialog] = useState(false);
  const [newSource, setNewSource] = useState<CreateSourcePayload>({
    title: '',
    authors: '',
    publication_year: undefined
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [showSourcesInfo, setShowSourcesInfo] = useState(false);
  
  // Recommended sources state

  
  // Link existing sources state
  const [showLinkExistingModal, setShowLinkExistingModal] = useState(false);
  
  // PDF viewer state
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [selectedSourceForViewer, setSelectedSourceForViewer] = useState<Source | null>(null);
  
  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<Source | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          return userData;
        } else {
          router.push(`/${locale}/teacher/login`);
          return null;
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push(`/${locale}/teacher/login`);
        return null;
      }
    };

    const initializeData = async () => {
      setLoading(true);
      const userData = await fetchUserData();
      if (userData) {
        await fetchSkills();
      }
      setLoading(false);
    };

    initializeData();
  }, [router, locale]);

  // Separate useEffect to refetch data when user changes
  useEffect(() => {
    if (user?.institution_id) {
      fetchSkills();
    }
  }, [user?.institution_id]);

  // Fetch sources when skill selection changes
  useEffect(() => {
    if (selectedSkill) {
      fetchSources();
      fetchSelectedSources();
    } else {
      setSources([]);
      setSelectedSources([]);
    }
  }, [selectedSkill]);

  const fetchSkills = async () => {
    if (!user?.institution_id) return;
    
    try {
      const response = await fetch('/api/teacher/skills', {
        headers: {
          'x-institution-id': user.institution_id.toString()
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSkills(data.skills);
      } else {
        setError('Failed to fetch skills');
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
      setError('Failed to fetch skills');
    }
  };

  const fetchSources = async () => {
    if (!selectedSkill) return;
    
    try {
      setSourcesLoading(true);
      const response = await fetch(`/api/teacher/skills/${selectedSkill}/sources`);
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
      setSourcesLoading(false);
    }
  };

  const fetchSelectedSources = async () => {
    if (!selectedSkill) return;
    
    try {
      const response = await fetch(`/api/teacher/skills/${selectedSkill}/sources`);
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

  const handleSaveSources = async () => {
    if (!selectedSkill) {
      console.error('No skill selected for saving sources');
      return;
    }
    
    if (selectedSources.length === 0) {
      console.log('No sources selected to save');
      return;
    }
    
    try {
      setSourcesLoading(true);
      setError(null);
      
      console.log('Saving sources for skill:', selectedSkill, 'Source IDs:', selectedSources);
      
      const response = await fetch(`/api/teacher/skills/${selectedSkill}/sources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourceIds: selectedSources }),
      });
      
      const data = await response.json();
      
      console.log('Save sources response:', response.status, data);
      
      if (response.ok) {
        console.log('Successfully saved sources to skill');
        // Refresh sources and skills to get updated counts
        await fetchSources();
        await fetchSkills();
      } else {
        console.error('Failed to save sources:', data.error);
        setError(data.error || 'Failed to save sources');
      }
    } catch (error) {
      console.error('Error saving sources:', error);
      setError('Failed to save sources');
    } finally {
      setSourcesLoading(false);
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
        headers: {
          'x-user-id': user!.id.toString(),
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Add the new source to the list and automatically select it
        const newSourceData = { ...data.source, is_selected: true };
        setSources(prev => [...prev, newSourceData]);
        
        // Update selected sources and ensure it's included for linking
        const updatedSelectedSources = [...selectedSources, newSourceData.id];
        setSelectedSources(updatedSelectedSources);
        
        // Automatically save the new source to the skill
        try {
          // Use the updated selected sources directly
          const saveResponse = await fetch(`/api/teacher/skills/${selectedSkill}/sources`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sourceIds: updatedSelectedSources }),
          });
          
          const saveData = await saveResponse.json();
          
          if (saveResponse.ok) {
            console.log('Successfully linked new source to skill');
            // Refresh sources and skills to get updated counts
            await fetchSources();
            await fetchSkills();
          } else {
            console.error('Failed to link source to skill:', saveData.error);
          }
        } catch (error) {
          console.error('Error automatically linking source to skill:', error);
          // Even if linking fails, we still want to show the uploaded source
        }
        
        // Reset form
        setNewSource({
          title: '',
          authors: '',
          publication_year: undefined
        });
        setSelectedFile(null);
        setShowAddSourceDialog(false);
        
        // Refresh skills to get updated source counts
        await fetchSkills();
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



  const handleSourcesLinked = async (linkedSources: Source[]) => {
    // Refresh sources list after linking existing sources
    await fetchSources();
    await fetchSelectedSources();
    setError(null);
  };

  const handleOpenPDFViewer = (source: Source) => {
    setSelectedSourceForViewer(source);
    setShowPDFViewer(true);
  };

  const handleClosePDFViewer = () => {
    setShowPDFViewer(false);
    setSelectedSourceForViewer(null);
  };

  const handleDeleteSource = (source: Source) => {
    setSourceToDelete(source);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!sourceToDelete) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/teacher/sources/${sourceToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user!.id.toString(),
        },
      });

      if (response.ok) {
        // Remove the source from the local state
        setSources(prev => prev.filter(s => s.id !== sourceToDelete.id));
        setSelectedSources(prev => prev.filter(id => id !== sourceToDelete.id));
        
        // Refresh skills to update source counts
        await fetchSkills();
        
        setShowDeleteDialog(false);
        setSourceToDelete(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete source');
      }
    } catch (error) {
      console.error('Error deleting source:', error);
      setError('Failed to delete source');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setSourceToDelete(null);
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

  const getUserDisplayName = () => {
    if (!user) return '';
    return `${user.given_name} ${user.family_name}`.trim() || user.email;
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="teacher" userName={getUserDisplayName()} />
      
      <Box sx={{ p: 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            color="inherit"
            href={`/${locale}/teacher/dashboard`}
            sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
            {t('dashboard')}
          </Link>
          <Typography color="text.primary">
            <BookIcon sx={{ mr: 0.5 }} fontSize="small" />
            {t('sources.title')}
          </Typography>
        </Breadcrumbs>

        {/* Page Header */}
        <Typography variant="h4" gutterBottom>
          {t('sources.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('sources.description')}
        </Typography>

        {/* Sources Information Box */}
        {showSourcesInfo && (
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
              onClick={() => setShowSourcesInfo(false)}
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
              {t('sources.whatIsSources')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('sources.sourcesExplanation')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('sources.sourcesUsageExplanation')}
            </Typography>
            <Button
              size="small"
              onClick={() => setShowSourcesInfo(false)}
              sx={{ mt: 1 }}
            >
              {t('domains.hideInfo')}
            </Button>
          </Box>
        )}

        {!showSourcesInfo && (
          <Button
            size="small"
            startIcon={<HelpOutline />}
            onClick={() => setShowSourcesInfo(true)}
            sx={{ mb: 3 }}
          >
            {t('domains.showInfo')}
          </Button>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Selection Interface */}
        <Box sx={{ mb: 3 }}>
          <FormControl sx={{ minWidth: 400 }}>
            <InputLabel>{t('skills.title')}</InputLabel>
            <Select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value as number | '')}
              label={t('skills.title')}
              disabled={loading}
            >
              <MenuItem value="">
                <em>{t('skills.selectSkill')}</em>
              </MenuItem>
              {skills.map((skill) => (
                <MenuItem 
                  key={skill.id} 
                  value={skill.id}
                >
                  {skill.name} ({skill.domain_name}) - {skill.sources_count || 0} sources
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Skill Description */}
          {selectedSkill && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'primary.50', borderRadius: 1, border: 1, borderColor: 'primary.200' }}>
              <Typography variant="subtitle2" color="primary.dark" sx={{ fontWeight: 'bold', mb: 1 }}>
                Skill Description:
              </Typography>
              <Typography variant="body2" color="primary.dark">
                {skills.find(s => s.id === selectedSkill)?.description || 'No description available'}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Sources Display Section */}
        {selectedSkill && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {tSkills('availableSources')} ({sources.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<LinkIcon />}
                  onClick={() => setShowLinkExistingModal(true)}
                >
                  {t('sources.linkExistingSources')}
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setShowAddSourceDialog(true)}
                >
                  {tSkills('addNewSource')}
                </Button>
              </Box>
            </Box>

            {sourcesLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Box sx={{ maxHeight: 400, overflow: 'auto', mb: 2 }}>
                  {sources.map((source) => (
                    <Paper 
                      key={source.id} 
                      sx={{ 
                        p: 2, 
                        mb: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        backgroundColor: selectedSources.includes(source.id) ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSources.includes(source.id)}
                        onChange={() => handleSourceToggle(source.id)}
                        style={{ margin: 0 }}
                      />
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                        <Description color="primary" />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography 
                            variant="subtitle2" 
                            noWrap
                            sx={{ 
                              cursor: 'pointer',
                              color: 'primary.main',
                              '&:hover': {
                                textDecoration: 'underline'
                              }
                            }}
                            onClick={() => handleOpenPDFViewer(source)}
                          >
                            {source.title}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
                        {source.authors && (
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {source.authors}
                            {source.publication_year && ` (${source.publication_year})`}
                          </Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 150 }}>
                        {getProcessingStatusIcon(source.pdf_processing_status)}
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {getProcessingStatusText(source.pdf_processing_status)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 80 }}>
                        {source.pdf_file_size && (
                          <Typography variant="body2" color="text.secondary">
                            {(source.pdf_file_size / 1024 / 1024).toFixed(1)} MB
                          </Typography>
                        )}
                      </Box>
                      
                      {source.is_custom && (
                        <Chip label={tSkills('custom')} size="small" color="secondary" />
                      )}
                      
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteSource(source)}
                        sx={{ ml: 1 }}
                        title="Delete source"
                      >
                        <Delete />
                      </IconButton>
                    </Paper>
                  ))}
                  {sources.length === 0 && (
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        {tSkills('noSourcesFound')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {tSkills('noSourcesFoundDescription')}
                      </Typography>
                    </Paper>
                  )}
                </Box>

                {sources.length > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={handleSaveSources}
                      disabled={sourcesLoading}
                      startIcon={sourcesLoading ? <CircularProgress size={20} /> : <BookIcon />}
                    >
                      {sourcesLoading ? tCommon('saving') : t('sources.linkUnlinkSources')}
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Paper>
        )}

        {/* Add Source Dialog */}
        <Dialog 
          open={showAddSourceDialog} 
          onClose={() => setShowAddSourceDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                {tSkills('addNewSource')}
              </Typography>
              <IconButton onClick={() => setShowAddSourceDialog(false)}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent>
            <Box sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label={tSkills('sourceTitle')}
                value={newSource.title}
                onChange={(e) => setNewSource(prev => ({ ...prev, title: e.target.value }))}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label={tSkills('authors')}
                value={newSource.authors}
                onChange={(e) => setNewSource(prev => ({ ...prev, authors: e.target.value }))}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label={tSkills('publicationYear')}
                type="number"
                value={newSource.publication_year || ''}
                onChange={(e) => setNewSource(prev => ({ 
                  ...prev, 
                  publication_year: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                sx={{ mb: 2 }}
              />
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                fullWidth
                sx={{ height: 56, mb: 2 }}
              >
                {selectedFile ? selectedFile.name : tSkills('selectPDFFile')}
                <input
                  type="file"
                  hidden
                  accept=".pdf"
                  onChange={handleFileSelect}
                />
              </Button>
            </Box>
          </DialogContent>

          <DialogActions sx={{ flexDirection: 'column', gap: 1, p: 2 }}>
            <Button
              variant="contained"
              onClick={handleAddSource}
              disabled={uploading || !newSource.title || !selectedFile}
              startIcon={uploading ? <CircularProgress size={20} /> : <Upload />}
              fullWidth
            >
              {uploading ? tCommon('uploading') : tSkills('uploadSource')}
            </Button>
            <Button
              onClick={() => {
                setShowAddSourceDialog(false);
                setNewSource({ title: '', authors: '', publication_year: undefined });
                setSelectedFile(null);
              }}
              fullWidth
            >
              {tCommon('cancel')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Link Existing Sources Modal */}
        {selectedSkill && (
          <LinkExistingSourcesModal
            open={showLinkExistingModal}
            skillId={selectedSkill}
            skillName={skills.find(s => s.id === selectedSkill)?.name || ''}
            onClose={() => setShowLinkExistingModal(false)}
            onSourcesLinked={handleSourcesLinked}
          />
        )}



        {/* PDF Viewer Modal */}
        <PDFViewerModal
          open={showPDFViewer}
          source={selectedSourceForViewer}
          onClose={handleClosePDFViewer}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={showDeleteDialog} 
          onClose={handleCancelDelete}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6">
              Delete Source
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to delete the source "{sourceToDelete?.title}"?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This action will permanently delete the source from the database and remove the PDF file from storage. 
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelDelete} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmDelete}
              disabled={deleting}
              startIcon={deleting ? <CircularProgress size={20} /> : <Delete />}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
} 