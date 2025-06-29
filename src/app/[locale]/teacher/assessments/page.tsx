'use client';

import React, { useState, useEffect } from 'react';
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
  DialogContentText,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Group as GroupIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import AssessmentGroupsModal from '@/components/admin/AssessmentGroupsModal';
import Navbar from '@/components/layout/Navbar';

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

export default function TeacherAssessmentsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('teacher');
  const tCommon = useTranslations('common');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // User info
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentInstitutionId, setCurrentInstitutionId] = useState<number | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);

  // Groups modal
  const [groupsModalOpen, setGroupsModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  // Load user info
  const loadUserInfo = async () => {
    try {
      console.log('Loading user info...');
      // Try to get from localStorage first (using same key as dashboard)
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        console.log('User data from localStorage:', user);
        setCurrentUserId(user.id);
        setCurrentInstitutionId(user.institution_id);
        return;
      }

      console.log('No user data in localStorage, redirecting to login...');
      // If no user data, redirect to login like the dashboard does
      router.push(`/${locale}/teacher/login`);
    } catch (err) {
      console.error('Error loading user info:', err);
      setError('Failed to load user information');
      router.push(`/${locale}/teacher/login`);
    }
  };

  // Load assessments
  const loadAssessments = async () => {
    if (!currentUserId || !currentInstitutionId) {
      console.log('Missing user info - currentUserId:', currentUserId, 'currentInstitutionId:', currentInstitutionId);
      return;
    }

    try {
      console.log('Loading assessments for teacher:', currentUserId, 'institution:', currentInstitutionId);
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        institution_id: currentInstitutionId.toString(),
        teacher_id: currentUserId.toString()
      });

      console.log('API URL:', `/api/teacher/assessments?${params}`);
      const response = await fetch(`/api/teacher/assessments?${params}`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to fetch assessments: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Assessments data:', data);
      setAssessments(data.assessments);
      setTotal(data.pagination.total);
    } catch (err) {
      console.error('Error in loadAssessments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserInfo();
  }, []);

  useEffect(() => {
    if (currentUserId && currentInstitutionId) {
      loadAssessments();
    }
  }, [page, rowsPerPage, search, statusFilter, currentUserId, currentInstitutionId]);

  const handleDelete = async () => {
    if (!assessmentToDelete) return;

    try {
      const response = await fetch(`/api/teacher/assessments/${assessmentToDelete.id}`, {
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
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    return status === 'Active' ? 'success' : 'default';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'error';
      default:
        return 'default';
    }
  };

  const canManageGroups = (assessment: Assessment) => {
    return assessment.teacher_id === currentUserId;
  };

  const handleOpenGroupsModal = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setGroupsModalOpen(true);
  };

  const handleCloseGroupsModal = () => {
    setGroupsModalOpen(false);
    setSelectedAssessment(null);
  };

  if (loading && assessments.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography>{tCommon('loading')}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="teacher" />
      
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link
            color="inherit"
            href={`/${locale}/teacher/dashboard`}
            sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            {t('dashboard')}
          </Link>
          <Typography color="text.primary">{t('assessments')}</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            {t('assessments')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push(`/${locale}/teacher/assessments/create`)}
          >
            {tCommon('create')} {t('assessments')}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label={tCommon('search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>{tCommon('status')}</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label={tCommon('status')}
              >
                <MenuItem value="">{tCommon('all')}</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Draft">Draft</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
            >
              {tCommon('clear')}
            </Button>
          </Box>
        </Paper>

        {/* Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{tCommon('name')}</TableCell>
                  <TableCell>{tCommon('status')}</TableCell>
                  <TableCell>Difficulty</TableCell>
                  <TableCell>Domain</TableCell>
                  <TableCell>Skill</TableCell>
                  <TableCell>Groups</TableCell>
                  <TableCell>{tCommon('createdAt')}</TableCell>
                  <TableCell>{tCommon('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assessments.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {assessment.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {assessment.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={assessment.status}
                        color={getStatusColor(assessment.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={assessment.difficulty_level}
                        color={getDifficultyColor(assessment.difficulty_level) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{assessment.domain_name}</TableCell>
                    <TableCell>{assessment.skill_name}</TableCell>
                    <TableCell>
                      {canManageGroups(assessment) ? (
                        <Button
                          size="small"
                          startIcon={<GroupIcon />}
                          onClick={() => handleOpenGroupsModal(assessment)}
                        >
                          {assessment.associated_groups || '0'} Groups
                        </Button>
                      ) : (
                        <Typography variant="body2">
                          {assessment.associated_groups || '0'} Groups
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(assessment.created_at)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => router.push(`/${locale}/teacher/assessments/${assessment.id}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => router.push(`/${locale}/teacher/assessments/${assessment.id}/edit`)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setAssessmentToDelete(assessment);
                            setDeleteDialogOpen(true);
                          }}
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
          <DialogTitle>{tCommon('confirm')} {tCommon('delete')}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete "{assessmentToDelete?.name}"? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              {tCommon('delete')}
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
          />
        )}
      </Box>
    </Box>
  );
} 