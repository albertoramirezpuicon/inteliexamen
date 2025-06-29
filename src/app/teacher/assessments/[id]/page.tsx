'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Breadcrumbs,
  Link,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Psychology as PsychologyIcon,
  Category as CategoryIcon,
  School as SchoolIcon,
  Language as LanguageIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';

interface Assessment {
  id: number;
  name: string;
  description: string;
  difficulty_level: string;
  educational_level: string;
  output_language: string;
  evaluation_context: string;
  case_text: string;
  questions_per_skill: number;
  available_from: string;
  available_until: string;
  dispute_period: number;
  status: string;
  show_teacher_name: boolean;
  skill_name: string;
  domain_name: string;
  institution_name: string;
  teacher_name: string;
  associated_groups: string;
  created_at: string;
}

export default function TeacherAssessmentViewPage() {
  const router = useRouter();
  const params = useParams();
  const assessmentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  // User info
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentInstitutionId, setCurrentInstitutionId] = useState<number | null>(null);

  // Load user info
  const loadUserInfo = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUserId(user.id);
        setCurrentInstitutionId(user.institution_id);
        return;
      }
      router.push('/teacher/login');
    } catch (err) {
      console.error('Error loading user info:', err);
      router.push('/teacher/login');
    }
  };

  // Load assessment data
  const loadAssessment = async () => {
    if (!currentUserId || !currentInstitutionId) return;

    try {
      const response = await fetch(`/api/teacher/assessments/${assessmentId}?teacher_id=${currentUserId}&institution_id=${currentInstitutionId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Assessment not found or access denied');
          return;
        }
        throw new Error('Failed to fetch assessment');
      }

      const data = await response.json();
      setAssessment(data.assessment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserInfo();
  }, []);

  useEffect(() => {
    if (currentUserId && currentInstitutionId) {
      loadAssessment();
    }
  }, [currentUserId, currentInstitutionId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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

  const canEdit = () => {
    return assessment && assessment.teacher_name && assessment.teacher_name.includes(currentUserId?.toString() || '');
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/teacher/assessments')}
        >
          Back to Assessments
        </Button>
      </Box>
    );
  }

  if (!assessment) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Assessment not found.</Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/teacher/assessments')}
          sx={{ mt: 2 }}
        >
          Back to Assessments
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          color="inherit"
          href="/teacher/dashboard"
          sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Dashboard
        </Link>
        <Link
          color="inherit"
          href="/teacher/assessments"
          sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
        >
          Assessments
        </Link>
        <Typography color="text.primary">{assessment.name}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {assessment.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              label={assessment.status} 
              color={getStatusColor(assessment.status) as any}
              size="small"
            />
            <Chip 
              label={assessment.difficulty_level} 
              color={getDifficultyColor(assessment.difficulty_level) as any}
              size="small"
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/teacher/assessments')}
          >
            Back to Assessments
          </Button>
          {canEdit() && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => router.push(`/teacher/assessments/${assessment.id}/edit`)}
            >
              Edit Assessment
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Assessment Details
            </Typography>
            <Typography variant="body1" paragraph>
              {assessment.description}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Case Scenario
            </Typography>
            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
              {assessment.case_text}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Evaluation Context
            </Typography>
            <Typography variant="body1" paragraph>
              {assessment.evaluation_context}
            </Typography>
          </Paper>
        </Grid>

        {/* Sidebar Information */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Assessment Information
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <PsychologyIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Skill" 
                    secondary={assessment.skill_name}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CategoryIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Domain" 
                    secondary={assessment.domain_name}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SchoolIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Educational Level" 
                    secondary={assessment.educational_level}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LanguageIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Output Language" 
                    secondary={assessment.output_language}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AssignmentIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Questions per Skill" 
                    secondary={assessment.questions_per_skill}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Show Teacher Name" 
                    secondary={assessment.show_teacher_name ? 'Yes' : 'No'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Availability
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Available From" 
                    secondary={formatDate(assessment.available_from)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Available Until" 
                    secondary={formatDate(assessment.available_until)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Dispute Period" 
                    secondary={`${assessment.dispute_period} days`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Associated Groups
              </Typography>
              {assessment.associated_groups ? (
                <Box>
                  {assessment.associated_groups.split(', ').map((groupName, index) => (
                    <Chip 
                      key={index}
                      label={groupName} 
                      size="small" 
                      variant="outlined"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No groups associated
                </Typography>
              )}
              <Button
                startIcon={<GroupIcon />}
                variant="outlined"
                size="small"
                sx={{ mt: 1 }}
                onClick={() => {
                  // This would open the groups modal - for now just show a message
                  alert('Group management functionality would be implemented here');
                }}
              >
                Manage Groups
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 