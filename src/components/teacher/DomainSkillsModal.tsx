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
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  List as ListIcon
} from '@mui/icons-material';

interface Skill {
  id: number;
  name: string;
  description: string;
}

interface DomainSkillsModalProps {
  open: boolean;
  onClose: () => void;
  domainId: number;
  domainName: string;
}

export default function DomainSkillsModal({
  open,
  onClose,
  domainId,
  domainName
}: DomainSkillsModalProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && domainId) {
      loadDomainSkills();
    }
  }, [open, domainId]);

  const loadDomainSkills = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user info from localStorage
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('User not found');
      }

      const user = JSON.parse(userData);
      const response = await fetch(`/api/teacher/domains/${domainId}/skills`, {
        headers: {
          'x-institution-id': user.institution_id.toString()
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load domain skills');
      }

      const data = await response.json();
      setSkills(data.skills);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load domain skills');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSkills([]);
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
            <ListIcon />
            <Typography variant="h6">
              Skills in Domain
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
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {skills.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No skills found for this domain.
              </Typography>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Typography variant="subtitle1">
                    Skills ({skills.length}):
                  </Typography>
                </Box>
                
                <List>
                  {skills.map((skill) => (
                    <ListItem key={skill.id} sx={{ px: 0 }}>
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
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
} 