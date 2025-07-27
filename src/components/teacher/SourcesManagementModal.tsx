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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import {
  Close,
  Book
} from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import SkillSourcesModal from './SkillSourcesModal';

interface Domain {
  id: number;
  name: string;
}

interface Skill {
  id: number;
  name: string;
  domain_id: number;
  domain_name: string;
}

interface SourcesManagementModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SourcesManagementModal({ 
  open, 
  onClose 
}: SourcesManagementModalProps) {
  const t = useTranslations('teacher');
  const tCommon = useTranslations('common');
  
  const [domains, setDomains] = useState<Domain[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<number | ''>('');
  const [selectedSkill, setSelectedSkill] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Skill sources modal state
  const [sourcesModalOpen, setSourcesModalOpen] = useState(false);
  const [selectedSkillForSources, setSelectedSkillForSources] = useState<Skill | null>(null);

  useEffect(() => {
    if (open) {
      fetchDomains();
      fetchSkills();
    }
  }, [open]);

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/teacher/domains');
      if (response.ok) {
        const data = await response.json();
        setDomains(data.domains);
      } else {
        setError('Failed to fetch domains');
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
      setError('Failed to fetch domains');
    }
  };

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teacher/skills');
      if (response.ok) {
        const data = await response.json();
        setSkills(data.skills);
      } else {
        setError('Failed to fetch skills');
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
      setError('Failed to fetch skills');
    } finally {
      setLoading(false);
    }
  };

  const handleDomainChange = (domainId: number | '') => {
    setSelectedDomain(domainId);
    setSelectedSkill(''); // Reset skill selection when domain changes
  };

  const handleManageSources = () => {
    if (selectedSkill) {
      const skill = skills.find(s => s.id === selectedSkill);
      if (skill) {
        setSelectedSkillForSources(skill);
        setSourcesModalOpen(true);
      }
    }
  };

  const handleSourcesModalClose = () => {
    setSourcesModalOpen(false);
    setSelectedSkillForSources(null);
  };

  const handleSourcesSaved = () => {
    // Refresh skills to get updated source counts
    fetchSkills();
  };

  // Group skills by domain
  const skillsByDomain = skills.reduce((acc, skill) => {
    if (!acc[skill.domain_name]) {
      acc[skill.domain_name] = [];
    }
    acc[skill.domain_name].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  // Filter skills by selected domain
  const filteredSkills = selectedDomain 
    ? skills.filter(skill => skill.domain_id === selectedDomain)
    : skills;

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {t('skills.manageSources')}
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

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('skills.sourcesManagementDescription')}
          </Typography>

          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>{t('domains.title')}</InputLabel>
              <Select
                value={selectedDomain}
                onChange={(e) => handleDomainChange(e.target.value as number | '')}
                label={t('domains.title')}
              >
                <MenuItem value="">
                  <em>{t('skills.allDomains')}</em>
                </MenuItem>
                {domains.map((domain) => (
                  <MenuItem key={domain.id} value={domain.id}>
                    {domain.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
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
                {Object.entries(skillsByDomain).map(([domainName, domainSkills]) => (
                  <Box key={domainName}>
                    {!selectedDomain && (
                      <MenuItem disabled sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                        {domainName}
                      </MenuItem>
                    )}
                    {domainSkills.map((skill) => (
                      <MenuItem 
                        key={skill.id} 
                        value={skill.id}
                        sx={{ pl: selectedDomain ? 2 : 4 }}
                      >
                        {skill.name}
                      </MenuItem>
                    ))}
                  </Box>
                ))}
              </Select>
            </FormControl>
          </Box>

          {selectedSkill && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<Book />}
                onClick={handleManageSources}
                fullWidth
              >
                {t('skills.manageSourcesForSkill')}
              </Button>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>
            {tCommon('cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Skill Sources Modal */}
      {selectedSkillForSources && (
        <SkillSourcesModal
          open={sourcesModalOpen}
          skillId={selectedSkillForSources.id}
          skillName={selectedSkillForSources.name}
          onClose={handleSourcesModalClose}
          onSave={handleSourcesSaved}
        />
      )}
    </>
  );
} 