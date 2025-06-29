'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface AssessmentViewProps {
  assessmentId: number;
}

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
  case_text: string;
  evaluation_context: string;
  questions_per_skill: number;
  dispute_period: number;
  show_teacher_name: number;
  updated_at: string;
}

export default function AssessmentView({ assessmentId }: AssessmentViewProps) {
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssessment();
  }, [assessmentId]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/assessments/${assessmentId}`);
      if (!response.ok) throw new Error('Failed to load assessment');

      const data = await response.json();
      setAssessment(data.assessment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!assessment) {
    return (
      <Alert severity="warning">
        Assessment not found
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.back()}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Assessment Details
        </Typography>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => router.push(`/admin/assessments/${assessmentId}/edit`)}
        >
          Edit Assessment
        </Button>
      </Box>

      {/* Assessment Information */}
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" gutterBottom>{assessment.name}</Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {assessment.description}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip label={assessment.difficulty_level} color="primary" />
                <Chip label={assessment.educational_level} color="secondary" />
                <Chip label={assessment.output_language === 'es' ? 'Spanish' : 'English'} />
              </Box>

              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>Case Scenario</Typography>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                maxHeight: 400,
                overflow: 'auto'
              }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {assessment.case_text}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Assessment Details</Typography>
              <Grid container spacing={2}>
                <Grid xs={6}>
                  <Typography variant="body2">
                    <strong>Status:</strong>
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">
                    <Chip 
                      label={assessment.status} 
                      color={assessment.status === 'Active' ? 'success' : 'default'}
                      size="small"
                    />
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">
                    <strong>Available From:</strong>
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">
                    {new Date(assessment.available_from).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">
                    <strong>Available Until:</strong>
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">
                    {new Date(assessment.available_until).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">
                    <strong>Created:</strong>
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">
                    {formatDate(assessment.created_at)}
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">
                    <strong>Updated:</strong>
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">
                    {formatDate(assessment.updated_at)}
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">
                    <strong>Institution:</strong>
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">
                    {assessment.institution_name}
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">
                    <strong>Teacher:</strong>
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">
                    {assessment.teacher_name}
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">
                    <strong>Domain:</strong>
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">
                    {assessment.domain_name}
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">
                    <strong>Skill:</strong>
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">
                    {assessment.skill_name}
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">
                    <strong>Questions per Skill:</strong>
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">
                    {assessment.questions_per_skill}
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">
                    <strong>Dispute Period:</strong>
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">
                    {assessment.dispute_period} days
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">
                    <strong>Show Teacher Name:</strong>
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">
                    {assessment.show_teacher_name ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Evaluation Context */}
      {assessment.evaluation_context && (
        <Card variant="outlined" sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Evaluation Context</Typography>
            <Box sx={{ 
              p: 2, 
              bgcolor: 'grey.50', 
              borderRadius: 1,
              maxHeight: 300,
              overflow: 'auto'
            }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {assessment.evaluation_context}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
} 