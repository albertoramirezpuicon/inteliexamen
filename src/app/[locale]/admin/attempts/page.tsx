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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Breadcrumbs,
  Link,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  Grid
} from '@mui/material';

import {
  Visibility as ViewIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useTranslations, useLocale } from 'next-intl';

interface Institution {
  id: number;
  name: string;
}

interface Assessment {
  id: number;
  name: string;
  description: string;
  institution_name: string;
}

interface Attempt {
  id: number;
  student_name: string;
  student_email: string;
  assessment_name: string;
  institution_name: string;
  teacher_name: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  final_grade: number;
}

interface AssessmentResult {
  id: number;
  skill_name: string;
  skill_level_label: string;
  feedback: string;
  skill_level_id: number;
}

export default function AdminAttemptsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('admin');
  
  const [user, setUser] = useState<{ id: number; email: string; given_name: string; family_name: string; role: string } | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState<number | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Results modal
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteAttemptId, setDeleteAttemptId] = useState<number | null>(null);
  const [deleteAttemptName, setDeleteAttemptName] = useState<string>('');
  const [deleting, setDeleting] = useState(false);

  // Load user info
  const loadUserInfo = useCallback(async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } else {
        router.push(`/${locale}/admin/login`);
      }
    } catch (err) {
      console.error('Error loading user info:', err);
      router.push(`/${locale}/admin/login`);
    }
  }, [locale, router]);

  // Load all institutions
  const loadInstitutions = async () => {
    try {
      const response = await fetch('/api/admin/institutions');
      if (response.ok) {
        const data = await response.json();
        setInstitutions(data.institutions || []);
      }
    } catch (err) {
      console.error('Error loading institutions:', err);
    }
  };

  // Load all assessments
  const loadAssessments = async () => {
    try {
      const response = await fetch('/api/admin/assessments');
      if (response.ok) {
        const data = await response.json();
        setAssessments(data.assessments || []);
      }
    } catch (err) {
      console.error('Error loading assessments:', err);
    }
  };

  // Load attempts with filters
  const loadAttempts = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/api/admin/attempts';
      const params = new URLSearchParams();
      
      if (selectedInstitution) {
        params.append('institution_id', selectedInstitution.toString());
      }
      if (selectedAssessment) {
        params.append('assessment_id', selectedAssessment.toString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAttempts(data.attempts || []);
      } else {
        setError('Failed to load attempts');
      }
    } catch {
      setError('Failed to load attempts');
    } finally {
      setLoading(false);
    }
  }, [selectedInstitution, selectedAssessment]);

  // Load results for an attempt
  const loadResults = async (attemptId: number) => {
    try {
      setResultsLoading(true);
      const response = await fetch(`/api/admin/attempts/${attemptId}/results`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      } else {
        setError('Failed to load results');
      }
    } catch {
      setError('Failed to load results');
    } finally {
      setResultsLoading(false);
    }
  };

  const handleInstitutionChange = (institutionId: number | null) => {
    setSelectedInstitution(institutionId);
    setSelectedAssessment(null); // Reset assessment when institution changes
  };

  const handleAssessmentChange = (assessmentId: number | null) => {
    setSelectedAssessment(assessmentId);
  };

  const handleViewResults = async (attemptId: number) => {
    setResultsModalOpen(true);
    await loadResults(attemptId);
  };

  const handleDeleteAttempt = (attemptId: number, studentName: string) => {
    setDeleteAttemptId(attemptId);
    setDeleteAttemptName(studentName);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteAttemptId) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/attempts/${deleteAttemptId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Reload attempts after successful deletion
        await loadAttempts();
        setDeleteModalOpen(false);
        setDeleteAttemptId(null);
        setDeleteAttemptName('');
      } else {
        setError('Failed to delete attempt');
      }
    } catch {
      setError('Failed to delete attempt');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setDeleteAttemptId(null);
    setDeleteAttemptName('');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'pending':
        return 'info';
      default:
        return 'default';
    }
  };

  const navigateTo = (path: string) => {
    router.push(`/${locale}${path}`);
  };

  useEffect(() => {
    loadUserInfo();
  }, [loadUserInfo]);

  useEffect(() => {
    if (user) {
      loadInstitutions();
      loadAssessments();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadAttempts();
    }
  }, [user, selectedInstitution, selectedAssessment, loadAttempts]);

  if (!user) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="admin" />
      
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link 
            component="button"
            onClick={() => navigateTo('/admin/dashboard')}
            color="inherit" 
            underline="hover"
            sx={{ cursor: 'pointer' }}
          >
            {t('dashboard')}
          </Link>
          <Typography color="text.primary">{t('attempts')}</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" gutterBottom>
          {t('attempts')}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('attemptsDescription')}
        </Typography>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Institution</InputLabel>
                <Select
                  value={selectedInstitution || ''}
                  onChange={(e) => handleInstitutionChange(e.target.value ? Number(e.target.value) : null)}
                  label="Institution"
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="">
                    <em>All Institutions</em>
                  </MenuItem>
                  {institutions.map((institution) => (
                    <MenuItem key={institution.id} value={institution.id}>
                      {institution.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Assessment</InputLabel>
                <Select
                  value={selectedAssessment || ''}
                  onChange={(e) => handleAssessmentChange(e.target.value ? Number(e.target.value) : null)}
                  label="Assessment"
                  disabled={!selectedInstitution}
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="">
                    <em>All Assessments</em>
                  </MenuItem>
                  {assessments
                    .filter(assessment => !selectedInstitution || assessment.institution_name === institutions.find(i => i.id === selectedInstitution)?.name)
                    .map((assessment) => (
                      <MenuItem key={assessment.id} value={assessment.id}>
                        {assessment.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Attempts Table */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Assessment</TableCell>
                  <TableCell>Institution</TableCell>
                  <TableCell>Teacher</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Completed</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      Loading attempts...
                    </TableCell>
                  </TableRow>
                ) : attempts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No attempts found
                    </TableCell>
                  </TableRow>
                ) : (
                  attempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {attempt.student_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {attempt.student_email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {attempt.assessment_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BusinessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {attempt.institution_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {attempt.teacher_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={attempt.status}
                          color={getStatusColor(attempt.status) as 'success' | 'warning' | 'info' | 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {attempt.final_grade !== null ? (
                          <Typography variant="body2" fontWeight="medium">
                            {attempt.final_grade}%
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDateTime(attempt.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {attempt.completed_at ? (
                          <Typography variant="body2">
                            {formatDateTime(attempt.completed_at)}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Results">
                            <IconButton
                              size="small"
                              onClick={() => handleViewResults(attempt.id)}
                              color="primary"
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Attempt">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteAttempt(attempt.id, attempt.student_name)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Results Modal */}
        <Dialog
          open={resultsModalOpen}
          onClose={() => setResultsModalOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Assessment Results</Typography>
              <IconButton onClick={() => setResultsModalOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {resultsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <Typography>Loading results...</Typography>
              </Box>
            ) : results.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No results available
              </Typography>
            ) : (
              <List>
                {results.map((result, index) => (
                  <React.Fragment key={result.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {result.skill_name}
                            </Typography>
                            <Chip
                              label={result.skill_level_label}
                              color="primary"
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary" component="span">
                              {result.feedback}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < results.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteModalOpen} onClose={cancelDelete}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the attempt for student &quot;{deleteAttemptName}&quot;? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelDelete} disabled={deleting}>
              Cancel
            </Button>
            <Button onClick={confirmDelete} color="error" disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
} 