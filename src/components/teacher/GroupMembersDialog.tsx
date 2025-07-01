'use client';

import { useState, useEffect, useCallback } from 'react';
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
  ListItemSecondaryAction,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  People as PeopleIcon
} from '@mui/icons-material';

interface User {
  id: number;
  email: string;
  given_name: string;
  family_name: string;
  role: string;
  institution_id: number;
}

interface Group {
  id: number;
  name: string;
  description: string;
  institution_id: number;
  institution_name: string;
  created_at: string;
  member_count: number;
}

interface GroupMembersDialogProps {
  open: boolean;
  group: Group | null;
  onClose: () => void;
  onAddMember: (groupId: number, userId: number) => void;
  onRemoveMember: (groupId: number, userId: number) => void;
  userInstitutionId: number | null;
}

export default function GroupMembersDialog({
  open,
  group,
  onClose,
  onAddMember,
  onRemoveMember,
  userInstitutionId
}: GroupMembersDialogProps) {
  const [members, setMembers] = useState<User[]>([]);
  const [availableStudents, setAvailableStudents] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (open && group) {
      fetchGroupData();
    }
  }, [open, group, fetchGroupData]);

  const fetchGroupData = useCallback(async () => {
    if (!group || !userInstitutionId) return;

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching group data for group:', group.id, 'institution:', userInstitutionId);

      // Fetch current members
      const membersResponse = await fetch(`/api/teacher/groups/${group.id}/members`, {
        headers: {
          'x-institution-id': userInstitutionId.toString()
        }
      });

      console.log('Members response status:', membersResponse.status);

      if (!membersResponse.ok) {
        const errorText = await membersResponse.text();
        console.error('Members response error:', errorText);
        throw new Error('Failed to fetch group members');
      }

      const membersData = await membersResponse.json();
      console.log('Members data:', membersData);
      setMembers(membersData.members);

      // Fetch available students
      const studentsResponse = await fetch(`/api/teacher/groups/${group.id}/members/available`, {
        headers: {
          'x-institution-id': userInstitutionId.toString()
        }
      });

      console.log('Available students response status:', studentsResponse.status);

      if (!studentsResponse.ok) {
        const errorText = await studentsResponse.text();
        console.error('Available students response error:', errorText);
        throw new Error('Failed to fetch available students');
      }

      const studentsData = await studentsResponse.json();
      console.log('Available students data:', studentsData);
      setAvailableStudents(studentsData.availableStudents);
    } catch (error) {
      console.error('Error in fetchGroupData:', error);
      setError(error instanceof Error ? error.message : 'Failed to load group data');
    } finally {
      setLoading(false);
    }
  }, [group, userInstitutionId]);

  const handleAddMember = async () => {
    if (!selectedStudent || !group) return;

    try {
      setError(null);
      setSuccess(null);

      await onAddMember(group.id, parseInt(selectedStudent));
      setSuccess('Member added successfully');
      setSelectedStudent('');
      
      // Refresh data
      fetchGroupData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!group) return;

    try {
      setError(null);
      setSuccess(null);

      await onRemoveMember(group.id, userId);
      setSuccess('Member removed successfully');
      
      // Refresh data
      fetchGroupData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to remove member');
    }
  };

  const handleClose = () => {
    setMembers([]);
    setAvailableStudents([]);
    setSelectedStudent('');
    setError(null);
    setSuccess(null);
    onClose();
  };

  if (!group) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon />
          <Typography variant="h6">
            Manage Members - {group.name}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Loading group data...
          </Alert>
        )}

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

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Current Members ({members.length})
          </Typography>
          
          {!loading && members.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No members in this group.
            </Typography>
          ) : (
            <List dense>
              {members.map((member) => (
                <ListItem key={member.id}>
                  <ListItemText
                    primary={`${member.given_name} ${member.family_name}`}
                    secondary={member.email}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="remove member"
                      onClick={() => handleRemoveMember(member.id)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="h6" gutterBottom>
            Add New Member
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel>Select Student</InputLabel>
              <Select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                label="Select Student"
                disabled={availableStudents.length === 0}
              >
                {availableStudents.map((student) => (
                  <MenuItem key={student.id} value={student.id}>
                    {student.given_name} {student.family_name} ({student.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddMember}
              disabled={!selectedStudent || availableStudents.length === 0}
            >
              Add Member
            </Button>
          </Box>
          
          {availableStudents.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              No available students to add to this group.
            </Typography>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
} 