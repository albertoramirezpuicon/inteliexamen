'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Chip, 
  IconButton, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Button,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Grid,
  Pagination,
  Breadcrumbs,
  Link
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  Assignment as AssignmentIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import Navbar from '@/components/layout/Navbar';
import { useRouter } from 'next/navigation';

interface Attempt {
  id: number;
  user_id: number;
  student_name: string;
  student_email: string;
  status: 'In progress' | 'Completed';
  final_grade: number | null;
  created_at: string;
  completed_at: string | null;
}

interface Assessment {
  id: number;
  name: string;
  description: string;
  difficulty_level: string;
  educational_level: string;
  status: string;
}

interface Institution {
  id: number;
  name: string;
}

interface User {
  id: number;
  email: string;
  given_name: string;
  family_name: string;
  role: string;
  institution_id: number | null;
  institution_name: string | null;
}

const steps = ['Select Institution', 'Select Assessment', 'View Attempts'];

export default function AttemptsPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  
  // Selection states
  const [selectedInstitution, setSelectedInstitution] = useState<number | ''>('');
  const [selectedAssessment, setSelectedAssessment] = useState<number | ''>('');
  
  // Assessment details
  const [assessmentDetails, setAssessmentDetails] = useState<Assessment | null>(null);
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAttempts, setTotalAttempts] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } else {
          const response = await fetch('/api/auth/me');
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
    fetchInstitutions();
  }, []);

  // Refetch attempts when page changes
  useEffect(() => {
    if (selectedAssessment && activeStep === 2) {
      fetchAttempts(selectedAssessment as number);
    }
  }, [page]);

  const fetchInstitutions = async () => {
    try {
      const response = await fetch('/api/admin/institutions/list');
      if (response.ok) {
        const data = await response.json();
        setInstitutions(data.institutions);
      }
    } catch (error) {
      console.error('Error fetching institutions:', error);
    }
  };

  const fetchAssessments = async (institutionId: number) => {
    try {
      const response = await fetch(`/api/admin/assessments?institution_id=${institutionId}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setAssessments(data.assessments);
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
    }
  };

  const fetchAttempts = async (assessmentId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/attempts/assessment/${assessmentId}?page=${page}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setAttempts(data.attempts);
        setAssessmentDetails(data.assessment);
        setTotalPages(data.totalPages);
        setTotalAttempts(data.total);
      }
    } catch (error) {
      console.error('Error fetching attempts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstitutionChange = (institutionId: number) => {
    setSelectedInstitution(institutionId);
    setSelectedAssessment('');
    setAssessments([]);
    setAttempts([]);
    setAssessmentDetails(null);
    setPage(1);
    setTotalPages(1);
    setTotalAttempts(0);
    setActiveStep(1);
    fetchAssessments(institutionId);
  };

  const handleAssessmentChange = (assessmentId: number) => {
    setSelectedAssessment(assessmentId);
    setPage(1);
    setActiveStep(2);
    fetchAttempts(assessmentId);
  };

  const handleViewAttempt = (attemptId: number) => {
    router.push(`/admin/attempts/${attemptId}`);
  };

  const handleNewSearch = () => {
    setActiveStep(0);
    setSelectedInstitution('');
    setSelectedAssessment('');
    setAssessments([]);
    setAttempts([]);
    setAssessmentDetails(null);
    setPage(1);
    setTotalPages(1);
    setTotalAttempts(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In progress':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return `${user.given_name} ${user.family_name}`.trim() || user.email;
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Institution
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose an institution to view its assessments and attempts
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Institution</InputLabel>
                <Select
                  value={selectedInstitution}
                  label="Institution"
                  onChange={(e) => handleInstitutionChange(e.target.value as number)}
                >
                  {institutions.map((institution) => (
                    <MenuItem key={institution.id} value={institution.id}>
                      {institution.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Assessment
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose an assessment to view its attempts
              </Typography>
              {loading ? (
                <Typography>Loading assessments...</Typography>
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Assessment</InputLabel>
                  <Select
                    value={selectedAssessment}
                    label="Assessment"
                    onChange={(e) => handleAssessmentChange(e.target.value as number)}
                  >
                    {assessments.map((assessment) => (
                      <MenuItem key={assessment.id} value={assessment.id}>
                        {assessment.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Box sx={{ mt: 3 }}>
            {assessmentDetails && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {assessmentDetails.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {assessmentDetails.description}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2">
                        <strong>Difficulty:</strong> {assessmentDetails.difficulty_level}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2">
                        <strong>Level:</strong> {assessmentDetails.educational_level}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2">
                        <strong>Status:</strong> {assessmentDetails.status}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* New Search Button */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={handleNewSearch}
                sx={{ minWidth: 150 }}
              >
                New Search
              </Button>
            </Box>

            <Typography variant="h6" gutterBottom>
              Attempts ({totalAttempts} total)
            </Typography>

            {loading ? (
              <Typography>Loading attempts...</Typography>
            ) : attempts.length > 0 ? (
              <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Grade</TableCell>
                        <TableCell>Started</TableCell>
                        <TableCell>Completed</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attempts.map((attempt) => (
                        <TableRow key={attempt.id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {attempt.student_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {attempt.student_email}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={attempt.status}
                              color={getStatusColor(attempt.status) as any}
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
                              {new Date(attempt.created_at).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {attempt.completed_at ? (
                              <Typography variant="body2">
                                {new Date(attempt.completed_at).toLocaleDateString()}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                -
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleViewAttempt(attempt.id)}
                              title="View Details"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No attempts found for this assessment
                </Typography>
              </Paper>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, newPage) => setPage(newPage)}
                  color="primary"
                />
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="admin" userName={getUserDisplayName()} />
      
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href="/admin/dashboard" color="inherit" underline="hover">
            Dashboard
          </Link>
          <Typography color="text.primary">Assessment Attempts</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" gutterBottom>
          Assessment Attempts
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          View detailed information about student attempts for specific assessments
        </Typography>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content */}
        {renderStepContent()}
      </Box>
    </Box>
  );
} 