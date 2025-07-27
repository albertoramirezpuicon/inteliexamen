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
  Paper,
  Checkbox,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Divider
} from '@mui/material';
import {
  Close,
  Description,
  CheckCircle,
  Error,
  Warning,
  Link as LinkIcon
} from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { Source } from '@/lib/types';

interface LinkExistingSourcesModalProps {
  open: boolean;
  skillId: number;
  skillName: string;
  onClose: () => void;
  onSourcesLinked: (sources: Source[]) => void;
}

export default function LinkExistingSourcesModal({
  open,
  skillId,
  skillName,
  onClose,
  onSourcesLinked
}: LinkExistingSourcesModalProps) {
  const t = useTranslations('teacher');
  const tCommon = useTranslations('common');
  
  const [unlinkedSources, setUnlinkedSources] = useState<Source[]>([]);
  const [selectedSources, setSelectedSources] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchUnlinkedSources();
    }
  }, [open, skillId]);

  const fetchUnlinkedSources = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/teacher/sources/unlinked?skillId=${skillId}`);
      
      if (response.ok) {
        const data = await response.json();
        setUnlinkedSources(data.sources);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch unlinked sources');
      }
    } catch (error) {
      console.error('Error fetching unlinked sources:', error);
      setError('Failed to fetch unlinked sources');
    } finally {
      setLoading(false);
    }
  };

  const handleSourceToggle = (sourceId: number) => {
    setSelectedSources(prev => 
      prev.includes(sourceId) 
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleLinkSelected = async () => {
    if (selectedSources.length === 0) {
      setError('Please select at least one source');
      return;
    }

    setLinking(true);
    setError(null);

    try {
      // Link the selected sources to the skill
      const response = await fetch('/api/teacher/sources/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skillId,
          sourceIds: selectedSources
        }),
      });
      
      if (response.ok) {
        const selectedSourceData = unlinkedSources.filter(source => 
          selectedSources.includes(source.id)
        );
        onSourcesLinked(selectedSourceData);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to link sources');
      }
    } catch (error) {
      console.error('Error linking sources:', error);
      setError('Failed to link sources');
    } finally {
      setLinking(false);
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
            {t('sources.linkExistingSources')} to "{skillName}"
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

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
            {unlinkedSources.length > 0 ? (
              unlinkedSources.map((source) => (
                <Paper 
                  key={source.id} 
                  sx={{ 
                    p: 2, 
                    mb: 1,
                    backgroundColor: selectedSources.includes(source.id) ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                  }}
                >
                  <Box display="flex" alignItems="flex-start" gap={2}>
                    <Checkbox
                      checked={selectedSources.includes(source.id)}
                      onChange={() => handleSourceToggle(source.id)}
                    />
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1">
                        {source.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {source.authors && `${source.authors}`}
                        {source.year && ` (${source.year})`}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              ))
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  {t('sources.noUnlinkedSourcesFound')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('sources.noUnlinkedSourcesDescription')}
                </Typography>
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {tCommon('cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleLinkSelected}
          disabled={selectedSources.length === 0 || linking}
          startIcon={linking ? <CircularProgress size={20} /> : <LinkIcon />}
        >
          {linking 
            ? `${tCommon('linking')} (${selectedSources.length})`
            : `${t('sources.linkSelected')} (${selectedSources.length})`
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
} 