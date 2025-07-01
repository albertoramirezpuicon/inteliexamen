'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Close as CloseIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import GroupMembersDialog from './GroupMembersDialog';

interface Group {
  id: number;
  name: string;
  description: string;
}

interface AssessmentGroupsModalProps {
  open: boolean;
  onClose: () => void;
  assessmentId: number;
  assessmentName: string;
  userType: 'admin' | 'teacher';
  currentUserId?: number;
}

export default function AssessmentGroupsModal({
  open,
  onClose,
  assessmentId,
  assessmentName
}: AssessmentGroupsModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [associatedGroups, setAssociatedGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);

  // Group members dialog state
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<Group | null>(null);

  // Load groups data when modal opens
  useEffect(() => {
    if (open && assessmentId) {
      loadGroupsData();
    }
  }, [open, assessmentId, loadGroupsData]);

  const loadGroupsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading groups data for assessment ID:', assessmentId);
      const url = `/api/admin/assessments/${assessmentId}/groups`;
      console.log('Fetching from URL:', url);

      const response = await fetch(url);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.log('Response not OK, trying to get error details');
        const text = await response.text();
        console.log('Response text:', text);
        
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.error || 'Failed to load groups data');
        } catch {
          console.log('Could not parse error as JSON, using text as error');
          throw new Error(`Server error: ${response.status} - ${text.substring(0, 200)}`);
        }
      }

      const data = await response.json();
      console.log('Successfully loaded groups data:', data);
      
      setAvailableGroups(data.availableGroups);
      setAssociatedGroups(data.associatedGroups);
      
      // Pre-select currently associated groups
      setSelectedGroups(data.associatedGroups.map((group: Group) => group.id));
    } catch (err) {
      console.error('Error in loadGroupsData:', err);
      setError(err instanceof Error ? err.message : 'Failed to load groups data');
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  const handleGroupToggle = (groupId: number) => {
    setSelectedGroups(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  const handleViewMembers = (group: Group, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedGroupForMembers(group);
    setMembersDialogOpen(true);
  };

  const handleCloseMembersDialog = () => {
    setMembersDialogOpen(false);
    setSelectedGroupForMembers(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Find groups to add (selected but not currently associated)
      const groupsToAdd = selectedGroups.filter(
        groupId => !associatedGroups.some(ag => ag.id === groupId)
      );

      // Find groups to remove (currently associated but not selected)
      const groupsToRemove = associatedGroups
        .filter(ag => !selectedGroups.includes(ag.id))
        .map(ag => ag.id);

      let addedCount = 0;
      let removedCount = 0;

      // Add new associations
      if (groupsToAdd.length > 0) {
        const addResponse = await fetch(`/api/admin/assessments/${assessmentId}/groups`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupIds: groupsToAdd })
        });

        if (!addResponse.ok) {
          const errorData = await addResponse.json();
          throw new Error(errorData.error || 'Failed to add groups');
        }

        const addData = await addResponse.json();
        addedCount = addData.addedAssociations;
      }

      // Remove associations
      if (groupsToRemove.length > 0) {
        const removeResponse = await fetch(
          `/api/admin/assessments/${assessmentId}/groups?groupIds=${groupsToRemove.join(',')}`,
          { method: 'DELETE' }
        );

        if (!removeResponse.ok) {
          const errorData = await removeResponse.json();
          throw new Error(errorData.error || 'Failed to remove groups');
        }

        const removeData = await removeResponse.json();
        removedCount = removeData.removedAssociations;
      }

      // Reload data to get updated state
      await loadGroupsData();

      // Show success message
      let message = '';
      if (addedCount > 0 && removedCount > 0) {
        message = `Added ${addedCount} group(s) and removed ${removedCount} group(s) successfully`;
      } else if (addedCount > 0) {
        message = `Added ${addedCount} group(s) successfully`;
      } else if (removedCount > 0) {
        message = `Removed ${removedCount} group(s) successfully`;
      } else {
        message = 'No changes made';
      }
      
      setSuccess(message);
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setError(null);
      setSuccess(null);
      setSelectedGroups([]);
      onClose();
    }
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Manage Groups for Assessment
            </Typography>
            <Button
              onClick={handleClose}
              disabled={saving}
              startIcon={<CloseIcon />}
            >
              Close
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {assessmentName}
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

              {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                  {success}
                </Alert>
              )}

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select the groups that should have access to this assessment. 
                Only groups from the same institution are available.
                Click on a group name to view its members.
              </Typography>

              {availableGroups.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No groups available for this institution.
                </Typography>
              ) : (
                <FormGroup>
                  {availableGroups.map((group) => (
                    <FormControlLabel
                      key={group.id}
                      control={
                        <Checkbox
                          checked={selectedGroups.includes(group.id)}
                          onChange={() => handleGroupToggle(group.id)}
                          disabled={saving}
                        />
                      }
                      label={
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 'medium',
                                cursor: 'pointer',
                                '&:hover': {
                                  textDecoration: 'underline',
                                  color: 'primary.main'
                                }
                              }}
                              onClick={(e) => handleViewMembers(group, e)}
                            >
                              {group.name}
                            </Typography>
                            <Button
                              size="small"
                              startIcon={<ViewIcon />}
                              onClick={(e) => handleViewMembers(group, e)}
                              sx={{ 
                                minWidth: 'auto',
                                p: 0.5,
                                color: 'text.secondary',
                                '&:hover': {
                                  color: 'primary.main'
                                }
                              }}
                            >
                              View Members
                            </Button>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {group.description}
                          </Typography>
                        </Box>
                      }
                      sx={{ 
                        mb: 1,
                        '& .MuiFormControlLabel-label': { width: '100%' }
                      }}
                    />
                  ))}
                </FormGroup>
              )}

              {selectedGroups.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Groups ({selectedGroups.length}):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedGroups.map(groupId => {
                      const group = availableGroups.find(g => g.id === groupId);
                      return group ? (
                        <Chip
                          key={groupId}
                          label={group.name}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ) : null;
                    })}
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={saving || loading}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Group Members Dialog */}
      {selectedGroupForMembers && (
        <GroupMembersDialog
          open={membersDialogOpen}
          onClose={handleCloseMembersDialog}
          groupId={selectedGroupForMembers.id}
          groupName={selectedGroupForMembers.name}
        />
      )}
    </>
  );
} 