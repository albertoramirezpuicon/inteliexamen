'use client';

import { Box, Typography, Breadcrumbs, Link, Paper, Grid, Chip, Button } from '@mui/material';
import Navbar from '@/components/layout/Navbar';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Edit as EditIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { use } from 'react';

interface AssessmentViewPageProps {
  params: Promise<{
    id: string;
  }>;
}

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
  integrity_protection: boolean;
  created_at: string;
  institution_name: string;
  teacher_name: string;
  selected_skills: number[];
  selected_groups: number[];
  attempt_count: number;
}

export default function TeacherAssessmentViewPage({ params }: AssessmentViewPageProps) {
  const t = useTranslations('teacher');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const assessmentId = parseInt(use(params).id, 10);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigateTo = (path: string) => {
    router.push(`/${locale}${path}`);
  };

  useEffect(() => {
    const loadAssessment = async () => {
      try {
        // Get user info from localStorage
        const userData = localStorage.getItem('user');
        if (!userData) {
          router.push(`/${locale}/teacher/login`);
          return;
        }

        const user = JSON.parse(userData);
        const params = new URLSearchParams({
          teacher_id: user.id.toString(),
          institution_id: user.institution_id.toString()
        });

        const response = await fetch(`/api/teacher/assessments/${assessmentId}?${params}`);
        if (!response.ok) {
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

    loadAssessment();
  }, [assessmentId, locale, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Draft': return 'default';
      case 'Inactive': return 'error';
      default: return 'default';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'success';
      case 'Medium': return 'warning';
      case 'Hard': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
        <Navbar userType="teacher" />
        <Box sx={{ p: 3 }}>
          <Typography>Loading...</Typography>
        </Box>
      </Box>
    );
  }

  if (error || !assessment) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
        <Navbar userType="teacher" />
        <Box sx={{ p: 3 }}>
          <Typography color="error">{error || 'Assessment not found'}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="teacher" />
      
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link 
            component="button"
            onClick={() => navigateTo('/teacher/dashboard')}
            color="inherit" 
            underline="hover"
            sx={{ cursor: 'pointer' }}
          >
            {t('dashboard')}
          </Link>
          <Link 
            component="button"
            onClick={() => navigateTo('/teacher/assessments')}
            color="inherit" 
            underline="hover"
            sx={{ cursor: 'pointer' }}
          >
            {t('assessments.title')}
          </Link>
          <Typography color="text.primary">{assessment.name}</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigateTo('/teacher/assessments')}
          >
            {tCommon('back')}
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigateTo(`/teacher/assessments/${assessment.id}/edit`)}
          >
            {assessment.attempt_count > 0 ? 'Limited Edit' : t('assessments.editAssessment')}
          </Button>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h4" gutterBottom>
                {assessment.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {assessment.description}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                {tCommon('evaluationContext')}
              </Typography>
              <Typography variant="body2" paragraph>
                {assessment.evaluation_context}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                {tCommon('caseText')}
              </Typography>
              <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                {assessment.case_text}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                {tCommon('details')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    {tCommon('status')}
                  </Typography>
                  <Chip
                    label={assessment.status}
                    color={getStatusColor(assessment.status) as 'success' | 'default' | 'error'}
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('assessments.difficulty')}
                  </Typography>
                  <Chip
                    label={assessment.difficulty_level}
                    color={getDifficultyColor(assessment.difficulty_level) as 'success' | 'warning' | 'error' | 'default'}
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('assessmentForm.educationalLevel')}
                  </Typography>
                  <Typography variant="body2">{assessment.educational_level}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    {tCommon('outputLanguage')}
                  </Typography>
                  <Typography variant="body2">{assessment.output_language}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    {tCommon('questionsPerSkill')}
                  </Typography>
                  <Typography variant="body2">{assessment.questions_per_skill}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    {tCommon('disputePeriod')}
                  </Typography>
                  <Typography variant="body2">{assessment.dispute_period} {tCommon('days')}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    {tCommon('attemptCount')}
                  </Typography>
                  <Typography variant="body2">{assessment.attempt_count}</Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                {tCommon('dates')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    {tCommon('availableFrom')}
                  </Typography>
                  <Typography variant="body2">{formatDate(assessment.available_from)}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    {tCommon('availableUntil')}
                  </Typography>
                  <Typography variant="body2">{formatDate(assessment.available_until)}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    {tCommon('createdAt')}
                  </Typography>
                  <Typography variant="body2">{formatDate(assessment.created_at)}</Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                {tCommon('settings')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Chip
                  label={assessment.show_teacher_name ? tCommon('showTeacherName') : tCommon('hideTeacherName')}
                  color={assessment.show_teacher_name ? 'success' : 'default'}
                  size="small"
                />
                <Chip
                  label={assessment.integrity_protection ? tCommon('integrityProtectionEnabled') : tCommon('integrityProtectionDisabled')}
                  color={assessment.integrity_protection ? 'success' : 'default'}
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
} 