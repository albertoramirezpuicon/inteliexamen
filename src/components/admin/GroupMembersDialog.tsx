'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  School as SchoolIcon
} from '@mui/icons-material';

interface GroupMember {
  id: number;
  given_name: string;
  family_name: string;
  email: string;
  role: string;
  created_at: string;
}

interface GroupMembersDialogProps {
  open: boolean;
  onClose: () => void;
  groupId: number;
  groupName: string;
}

export default function GroupMembersDialog({
  open,
  onClose,
  groupId,
  groupName
}: GroupMembersDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);

  const loadGroupMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setMembers([]); // Reset members while loading

      console.log('Loading group members for group ID:', groupId);
      const url = `/api/admin/groups/${groupId}/members`;
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
          throw new Error(errorData.error || 'Failed to load group members');
        } catch {
          console.log('Could not parse error as JSON, using text as error');
          throw new Error(`Server error: ${response.status} - ${text.substring(0, 200)}`);
        }
      }

      const data = await response.json();
      console.log('Successfully loaded group members data:', data);
      console.log('Data structure:', Object.keys(data));
      console.log('Members array:', data.members);
      console.log('Members array type:', typeof data.members);
      console.log('Members array length:', data.members ? data.members.length : 'undefined');
      
      // Ensure members is always an array
      setMembers(data.members || []);
    } catch (err) {
      console.error('Error in loadGroupMembers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load group members');
      setMembers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // Load group members when dialog opens
  useEffect(() => {
    if (open && groupId) {
      loadGroupMembers();
    } else {
      // Reset state when dialog closes
      setMembers([]);
      setError(null);
    }
  }, [open, groupId, loadGroupMembers]);

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setMembers([]);
      onClose();
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'teacher': return 'warning';
      case 'student': return 'primary';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown date';
    }
  };

  // Ensure members is always an array
  const safeMembers = Array.isArray(members) ? members : [];

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Group Members
          </Typography>
          <Button
            onClick={handleClose}
            disabled={loading}
            startIcon={<CloseIcon />}
          >
            Close
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {groupName}
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

            {safeMembers.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No members in this group.
              </Typography>
            ) : (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SchoolIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="subtitle2">
                    {safeMembers.length} member{safeMembers.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>

                <List>
                  {safeMembers.map((member, index) => (
                    <React.Fragment key={member.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                {member.given_name} {member.family_name}
                              </Typography>
                              <Chip
                                label={member.role}
                                size="small"
                                color={getRoleColor(member.role) as 'error' | 'warning' | 'primary' | 'default'}
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Box component="span" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.875rem' }}>
                                {member.email}
                              </Box>
                              <Box component="span" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.75rem' }}>
                                Member since: {formatDate(member.created_at)}
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < safeMembers.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
} 