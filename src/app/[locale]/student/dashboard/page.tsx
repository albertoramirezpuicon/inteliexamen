'use client';

import { Box, Typography, Paper, Card, CardContent, Avatar, Button, Chip, Tooltip } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useTranslations } from 'next-intl';
import { 
  Person as PersonIcon, 
  CheckCircle as CheckCircleIcon, 
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Gavel as GavelIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface Student {
  id: number;
  given_name: string;
  family_name: string;
  email: string;
  institution_name: string;
}

interface Assessment {
  id: string;
  name: string;
  description: string;
  difficulty_level: string;
  educational_level: string;
  evaluation_context: string;
  available_from: string;
  available_until: string;
  dispute_period: number;
  status: string;
  created_at: string;
  updated_at: string;
  institution_name: string;
  teacher_given_name: string;
  teacher_family_name: string;
  group_name: string;
  group_id: string;
  attempt?: {
    assessment_id: string;
    status: string;
    final_grade: number;
    created_at: string;
    completed_at: string;
  } | null;
}

interface AssessmentData {
  activeAssessments: Assessment[];
  completedAssessments: Assessment[];
  totalActive: number;
  totalCompleted: number;
}

export default function StudentDashboard() {
  const t = useTranslations('student');
  const tCommon = useTranslations('common');
  const [student, setStudent] = useState<Student | null>(null);
  const [assessments, setAssessments] = useState<AssessmentData>({
    activeAssessments: [],
    completedAssessments: [],
    totalActive: 0,
    totalCompleted: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loadStudentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // First, try to get data from localStorage (most reliable for current session)
      const storedName = localStorage.getItem('userName');
      const storedRole = localStorage.getItem('userRole');
      const storedEmail = localStorage.getItem('userEmail');
      const storedUserId = localStorage.getItem('userId');
      const storedLanguage = localStorage.getItem('userLanguage');

      console.log('Stored user data:', { storedName, storedRole, storedEmail, storedUserId, storedLanguage });

      if (storedName && storedRole === 'student') {
        // Use localStorage data directly
        const [givenName, ...familyNameParts] = storedName.split(' ');
        const familyName = familyNameParts.join(' ');
        setStudent({
          id: parseInt(storedUserId || '1'),
          given_name: givenName,
          family_name: familyName,
          email: storedEmail || 'student@example.com',
          institution_name: 'Your Institution'
        });
        console.log('Using localStorage data for student');
        return;
      }

      // If no localStorage data, try API with fallback
      const userId = storedUserId || '1';
      console.log('No localStorage data, trying API for user ID:', userId);
      
      // Get user data from API
      const url = `/api/admin/users/${userId}`;
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);

      if (!response.ok) {
        console.log('Response not OK, using fallback data');
        throw new Error('Failed to load student data from API');
      }

      const data = await response.json();
      console.log('Successfully loaded student data from API:', data);
      setStudent(data.user);
    } catch (err) {
      console.error('Error loading student data:', err);
      setError(tCommon('error'));
      
      // Final fallback to placeholder data for development
      setStudent({
        id: 1,
        given_name: 'John',
        family_name: 'Doe',
        email: 'john.doe@example.com',
        institution_name: 'Sample University'
      });
    } finally {
      setLoading(false);
    }
  }, [tCommon]);

  const loadAssessments = useCallback(async () => {
    if (!student) return;

    try {
      const response = await fetch(`/api/student/assessments?userId=${student.id}`);
      if (response.ok) {
        const data = await response.json();
        setAssessments(data);
      }
    } catch (error) {
      console.error('Error loading assessments:', error);
    }
  }, [student]);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  useEffect(() => {
    if (student) {
      loadAssessments();
    }
  }, [student, loadAssessments]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isWithinDisputePeriod = (assessment: Assessment) => {
    if (!assessment.attempt?.completed_at || !assessment.dispute_period) {
      return false;
    }
    
    const completedDate = new Date(assessment.attempt.completed_at);
    const disputeDeadline = new Date(completedDate.getTime() + (assessment.dispute_period * 24 * 60 * 60 * 1000));
    const now = new Date();
    
    return now <= disputeDeadline;
  };

  const handleStartAssessment = (assessment: Assessment) => {
    router.push(`/student/assessments/${assessment.id}/attempt`);
  };

  const handleContinueAssessment = (assessment: Assessment) => {
    router.push(`/student/assessments/${assessment.id}/attempt`);
  };

  const handleViewResults = (assessment: Assessment) => {
    router.push(`/student/assessments/${assessment.id}/results`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>{tCommon('loading')}</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="student" />
      
      <Box sx={{ p: 3 }}>
        {/* Student Welcome Section */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
            <PersonIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>
              {t('welcomeBack')}, {student ? `${student.given_name} ${student.family_name}` : t('student')}!
            </Typography>
            <Typography variant="h6" color="primary" gutterBottom>
              {student ? student.institution_name : t('yourInstitution')}
            </Typography>
          </Box>
        </Box>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        
        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid xs={12} md={6} lg={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {t('availableAssessments')}
                </Typography>
                <Typography variant="h4">
                  {assessments.totalActive}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid xs={12} md={6} lg={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {t('completedAssessments')}
                </Typography>
                <Typography variant="h4">
                  {assessments.totalCompleted}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid xs={12} md={6} lg={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {t('averageScore')}
                </Typography>
                <Typography variant="h4">
                  N/A
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Active Assessments Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ScheduleIcon color="primary" />
            <Typography variant="h5">
              {t('activeAssessments')} ({assessments.totalActive})
            </Typography>
          </Box>
          
          {assessments.activeAssessments.length > 0 ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              {assessments.activeAssessments.map((assessment) => (
                <Card key={assessment.id} sx={{ 
                  display: 'flex', 
                  flexDirection: 'column'
                }}>
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          flexGrow: 1, 
                          mr: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: 1.2
                        }}
                      >
                        {assessment.name}
                      </Typography>
                      <Chip 
                        label={assessment.difficulty_level} 
                        color={getDifficultyColor(assessment.difficulty_level) as 'success' | 'warning' | 'error' | 'default'}
                        size="small"
                        sx={{ flexShrink: 0 }}
                      />
                    </Box>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.4,
                        minHeight: '4.2em' // 3 lines * 1.4 line height
                      }}
                    >
                      {assessment.description}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>{t('group')}:</strong> {assessment.group_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>{t('teacher')}:</strong> {assessment.teacher_given_name} {assessment.teacher_family_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>{t('level')}:</strong> {assessment.educational_level}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>{t('due')}:</strong> {formatDate(assessment.available_until)}
                      </Typography>
                    </Box>

                    {assessment.attempt && assessment.attempt.status === 'In progress' ? (
                      <Button 
                        variant="contained" 
                        color="warning" 
                        fullWidth
                        onClick={() => handleContinueAssessment(assessment)}
                      >
                        {t('continueAssessment')}
                      </Button>
                    ) : (
                      <Button 
                        variant="contained" 
                        fullWidth
                        onClick={() => handleStartAssessment(assessment)}
                      >
                        {t('takeAssessment')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              {t('noActiveAssessments')}
            </Typography>
          )}
        </Paper>

        {/* Completed Assessments Section */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CheckCircleIcon color="success" />
            <Typography variant="h5">
              {t('completedAssessments')} ({assessments.totalCompleted})
            </Typography>
          </Box>
          
          {assessments.completedAssessments.length > 0 ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              {assessments.completedAssessments.map((assessment) => (
                <Card key={assessment.id} sx={{ 
                  display: 'flex', 
                  flexDirection: 'column'
                }}>
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, mr: 1 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: 1.2
                          }}
                        >
                          {assessment.name}
                        </Typography>
                        {isWithinDisputePeriod(assessment) && (
                          <Tooltip title={t('disputeAvailable')}>
                            <GavelIcon color="warning" fontSize="small" />
                          </Tooltip>
                        )}
                      </Box>
                      <Chip 
                        label={`${t('score')}: ${assessment.attempt?.final_grade || 'N/A'}`} 
                        color="success"
                        size="small"
                        sx={{ flexShrink: 0 }}
                      />
                    </Box>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.4,
                        minHeight: '4.2em' // 3 lines * 1.4 line height
                      }}
                    >
                      {assessment.description}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>{t('group')}:</strong> {assessment.group_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>{t('teacher')}:</strong> {assessment.teacher_given_name} {assessment.teacher_family_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>{t('completed')}:</strong> {assessment.attempt?.completed_at ? formatDate(assessment.attempt.completed_at) : 'N/A'}
                      </Typography>
                      {isWithinDisputePeriod(assessment) && (
                        <Typography variant="body2" color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <WarningIcon fontSize="small" />
                          <strong>{t('disputePeriodActive')}</strong>
                        </Typography>
                      )}
                    </Box>

                    <Button 
                      variant="outlined" 
                      fullWidth
                      onClick={() => handleViewResults(assessment)}
                    >
                      {t('viewResults')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              {t('noCompletedAssessments')}
            </Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );
} 