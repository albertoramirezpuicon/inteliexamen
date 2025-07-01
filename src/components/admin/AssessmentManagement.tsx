'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  TablePagination,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import AssessmentGroupsModal from './AssessmentGroupsModal';

interface Assessment {
  id: number;
  name: string;
  description: string;
  difficulty_level: string;
  educational_level: string;
  output_language: string;
  status: string;
  available_from: string;
  available_until: string;
  created_at: string;
  institution_name: string;
  teacher_name: string;
  skill_name: string;
  domain_name: string;
  associated_groups: string;
  teacher_id: number;
}

interface Institution {
  id: number;
  name: string;
}

interface Teacher {
  id: number;
  first_name: string;
  last_name: string;
}

interface AssessmentManagementProps {
  userType: 'admin' | 'teacher';
  currentUserId?: number;
  currentInstitutionId?: number;
}

export default function AssessmentManagement({ 
  userType, 
  currentUserId, 
  currentInstitutionId 
}: AssessmentManagementProps) {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  
  // Institutions and teachers for filters
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);

  // Groups modal
  const [groupsModalOpen, setGroupsModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  // Load assessments
  const loadAssessments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(institutionFilter && { institution_id: institutionFilter }),
        ...(teacherFilter && { teacher_id: teacherFilter }),
        ...(userType === 'teacher' && currentInstitutionId && { institution_id: currentInstitutionId.toString() }),
        ...(userType === 'teacher' && currentUserId && { teacher_id: currentUserId.toString() })
      });

      const response = await fetch(`/api/admin/assessments?${params}`);
      if (!response.ok) throw new Error('Failed to fetch assessments');
      
      const data = await response.json();
      setAssessments(data.assessments);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  // Load institutions and teachers for filters
  const loadFilterData = async () => {
    try {
      // Load institutions
      const institutionsResponse = await fetch('/api/admin/institutions/list');
      if (institutionsResponse.ok) {
        const institutionsData = await institutionsResponse.json();
        setInstitutions(institutionsData.institutions);
      }

      // Load teachers (users with teacher role)
      const teachersResponse = await fetch('/api/admin/users?role=teacher');
      if (teachersResponse.ok) {
        const teachersData = await teachersResponse.json();
        setTeachers(teachersData.users);
      }
    } catch (err) {
      console.error('Error loading filter data:', err);
    }
  };

  useEffect(() => {
    loadFilterData();
  }, []);

  useEffect(() => {
    loadAssessments();
  }, [page, rowsPerPage, search, statusFilter, institutionFilter, teacherFilter, userType, currentUserId, currentInstitutionId, loadAssessments]);

  const handleDelete = async () => {
    if (!assessmentToDelete) return;

    try {
      const response = await fetch(`/api/admin/assessments/${assessmentToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete assessment');
      }

      setDeleteDialogOpen(false);
      setAssessmentToDelete(null);
      loadAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete assessment');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setInstitutionFilter('');
    setTeacherFilter('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    return status === 'Active' ? 'success' : 'default';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'success';
      case 'Intermediate': return 'warning';
      case 'Difficult': return 'error';
      default: return 'default';
    }
  };

  const canManageGroups = (assessment: Assessment) => {
    return userType === 'admin' || 
           (userType === 'teacher' && assessment.teacher_id === currentUserId);
  };

  const handleOpenGroupsModal = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setGroupsModalOpen(true);
  };

  const handleCloseGroupsModal = () => {
    setGroupsModalOpen(false);
    setSelectedAssessment(null);
    // Reload assessments to get updated group associations
    loadAssessments();
  };

  if (loading && assessments.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading assessments...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Assessment Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/admin/assessments/create')}
        >
          Create Assessment
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </Select>
          </FormControl>

          {userType === 'admin' && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Institution</InputLabel>
              <Select
                value={institutionFilter}
                onChange={(e) => setInstitutionFilter(e.target.value)}
                label="Institution"
              >
                <MenuItem value="">All</MenuItem>
                {institutions.map((institution) => (
                  <MenuItem key={institution.id} value={institution.id}>
                    {institution.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {userType === 'admin' && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Teacher</InputLabel>
              <Select
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                label="Teacher"
              >
                <MenuItem value="">All</MenuItem>
                {teachers.map((teacher) => (
                  <MenuItem key={teacher.id} value={teacher.id}>
                    {teacher.first_name} {teacher.last_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Button
            startIcon={<ClearIcon />}
            onClick={clearFilters}
            variant="outlined"
            size="small"
          >
            Clear Filters
          </Button>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Assessments Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Skill</TableCell>
                <TableCell>Difficulty</TableCell>
                <TableCell>Educational Level</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Available From</TableCell>
                <TableCell>Available Until</TableCell>
                {userType === 'admin' && <TableCell>Institution</TableCell>}
                {userType === 'admin' && <TableCell>Teacher</TableCell>}
                <TableCell>Groups</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assessments.map((assessment) => (
                <TableRow key={assessment.id}>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {assessment.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }}>
                      {assessment.description}
                    </Typography>
                  </TableCell>
                  <TableCell>{assessment.skill_name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={assessment.difficulty_level} 
                      color={getDifficultyColor(assessment.difficulty_level) as 'success' | 'warning' | 'error' | 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{assessment.educational_level}</TableCell>
                  <TableCell>
                    <Chip 
                      label={assessment.status} 
                      color={getStatusColor(assessment.status) as 'success' | 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(assessment.available_from)}</TableCell>
                  <TableCell>{formatDate(assessment.available_until)}</TableCell>
                  {userType === 'admin' && <TableCell>{assessment.institution_name}</TableCell>}
                  {userType === 'admin' && <TableCell>{assessment.teacher_name}</TableCell>}
                  <TableCell>
                    <Box sx={{ minWidth: 150 }}>
                      {assessment.associated_groups ? (
                        <Box>
                          {assessment.associated_groups.split(', ').map((groupName, index) => (
                            <Typography 
                              key={index} 
                              variant="caption" 
                              display="block" 
                              sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}
                            >
                              {groupName}
                            </Typography>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No groups
                        </Typography>
                      )}
                      {canManageGroups(assessment) && (
                        <Button
                          size="small"
                          startIcon={<GroupIcon />}
                          onClick={() => handleOpenGroupsModal(assessment)}
                          sx={{ mt: 0.5 }}
                        >
                          Manage
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => router.push(`/admin/assessments/${assessment.id}`)}
                        title="View Assessment"
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => router.push(`/admin/assessments/${assessment.id}/edit`)}
                        title="Edit Assessment"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setAssessmentToDelete(assessment);
                          setDeleteDialogOpen(true);
                        }}
                        title="Delete Assessment"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Assessment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the assessment &quot;{assessmentToDelete?.name}&quot;? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Groups Modal */}
      {selectedAssessment && (
        <AssessmentGroupsModal
          open={groupsModalOpen}
          onClose={handleCloseGroupsModal}
          assessmentId={selectedAssessment.id}
          assessmentName={selectedAssessment.name}
          userType={userType}
          currentUserId={currentUserId}
        />
      )}
    </Box>
  );
} 