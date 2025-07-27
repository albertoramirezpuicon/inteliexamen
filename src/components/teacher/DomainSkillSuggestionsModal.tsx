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
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Checkbox,
  CircularProgress,
  Alert,
  Chip,
  FormGroup,
  FormControlLabel
} from '@mui/material';
import {
  Close as CloseIcon,
  Lightbulb as LightbulbIcon,
  Save as SaveIcon
} from '@mui/icons-material';

interface SkillSuggestion {
  name: string;
  description: string;
}

interface DomainSkillSuggestionsModalProps {
  open: boolean;
  onClose: () => void;
  domainId: number;
  domainName: string;
  domainDescription: string;
  onSkillsCreated?: () => void;
}

export default function DomainSkillSuggestionsModal({
  open,
  onClose,
  domainId,
  domainName,
  domainDescription,
  onSkillsCreated
}: DomainSkillSuggestionsModalProps) {
  const [suggestions, setSuggestions] = useState<SkillSuggestion[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auto-generate suggestions when modal opens
  useEffect(() => {
    if (open && domainId && domainName && domainDescription) {
      generateSuggestions();
    }
  }, [open, domainId, domainName, domainDescription]);

  const generateSuggestions = async () => {
    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/ai/domain-skill-suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domainName,
          domainDescription,
          language: 'es' // You can make this dynamic based on locale
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions);
      setSelectedSkills([]); // Reset selections
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions');
    } finally {
      setGenerating(false);
    }
  };

  const handleSkillToggle = (skillName: string) => {
    setSelectedSkills(prev => {
      if (prev.includes(skillName)) {
        return prev.filter(name => name !== skillName);
      } else {
        return [...prev, skillName];
      }
    });
  };

  const handleSaveSelectedSkills = async () => {
    if (selectedSkills.length === 0) {
      setError('Please select at least one skill to save');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Get the selected skill objects
      const skillsToSave = suggestions.filter(skill => selectedSkills.includes(skill.name));

      // Get user info from localStorage
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('User not found');
      }

      const user = JSON.parse(userData);
      const response = await fetch(`/api/teacher/domains/${domainId}/skills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-institution-id': user.institution_id.toString()
        },
        body: JSON.stringify({ skills: skillsToSave }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save skills');
      }

      const data = await response.json();
      setSuccess(`Successfully created ${data.createdSkills} skill(s)`);
      
      // Reset selections
      setSelectedSkills([]);
      
      // Call the callback to refresh parent data
      if (onSkillsCreated) {
        onSkillsCreated();
      }

      // Close modal after a short delay
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save skills');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setSuggestions([]);
    setSelectedSkills([]);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LightbulbIcon />
            <Typography variant="h6">
              AI Skill Suggestions
            </Typography>
          </Box>
          <Button
            onClick={handleClose}
            startIcon={<CloseIcon />}
          >
            Close
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {domainName}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Generate AI-powered suggestions for skills that would be appropriate for this domain. 
            Select the skills you want to create and save them to the domain.
          </Typography>

          {suggestions.length === 0 && !generating && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Button
                variant="contained"
                onClick={generateSuggestions}
                disabled={generating}
                startIcon={generating ? <CircularProgress size={20} /> : <LightbulbIcon />}
              >
                {generating ? 'Generating...' : 'Generate Suggestions'}
              </Button>
            </Box>
          )}

          {generating && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {suggestions.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">
                  Suggested Skills ({suggestions.length}):
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={generateSuggestions}
                  disabled={generating}
                >
                  Regenerate
                </Button>
              </Box>

              <FormGroup>
                <List>
                  {suggestions.map((skill, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemButton
                        onClick={() => handleSkillToggle(skill.name)}
                        sx={{ px: 0 }}
                      >
                        <Checkbox
                          checked={selectedSkills.includes(skill.name)}
                          onChange={() => handleSkillToggle(skill.name)}
                          disabled={saving}
                        />
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight="medium">
                              {skill.name}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {skill.description}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </FormGroup>

              {selectedSkills.length > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Skills ({selectedSkills.length}):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedSkills.map(skillName => (
                      <Chip
                        key={skillName}
                        label={skillName}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        {suggestions.length > 0 && selectedSkills.length > 0 && (
          <Button
            onClick={handleSaveSelectedSkills}
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={saving}
          >
            {saving ? 'Saving...' : `Save ${selectedSkills.length} Skill(s)`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
} 