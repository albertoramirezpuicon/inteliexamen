'use client';

import { Box, Typography, Breadcrumbs, Link, Alert, CircularProgress } from '@mui/material';
import Navbar from '@/components/layout/Navbar';
import AssessmentForm from '@/components/admin/AssessmentForm';
import LimitedAssessmentForm from '@/components/teacher/LimitedAssessmentForm';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { use, useState, useEffect } from 'react';

interface AssessmentEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface Assessment {
  id: number;
  attempt_count: number;
}

export default function TeacherAssessmentEditPage({ params }: AssessmentEditPageProps) {
  const t = useTranslations('teacher');
  const locale = useLocale();
  const router = useRouter();
  const assessmentId = parseInt(use(params).id, 10);
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load assessment data to check attempt count
  useEffect(() => {
    const loadAssessment = async () => {
      try {
        setLoading(true);
        const userData = localStorage.getItem('user');
        if (!userData) {
          throw new Error('User data not found');
        }
        
        const user = JSON.parse(userData);
        const response = await fetch(`/api/teacher/assessments/${assessmentId}?teacher_id=${user.id}&institution_id=${user.institution_id}`);
        
        if (!response.ok) {
          throw new Error('Failed to load assessment');
        }
        
        const data = await response.json();
        setAssessment(data.assessment);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assessment');
      } finally {
        setLoading(false);
      }
    };

    if (assessmentId) {
      loadAssessment();
    }
  }, [assessmentId]);

  const navigateTo = (path: string) => {
    router.push(`/${locale}${path}`);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
        <Navbar userType="teacher" />
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
        <Navbar userType="teacher" />
        <Box sx={{ p: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Box>
    );
  }

  if (!assessment) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
        <Navbar userType="teacher" />
        <Box sx={{ p: 3 }}>
          <Alert severity="error">Assessment not found</Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Navbar userType="teacher" />
      
      {assessment.attempt_count > 0 ? (
        <LimitedAssessmentForm 
          assessmentId={assessmentId} 
        />
      ) : (
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
            <Typography color="text.primary">{t('assessments.editAssessment')}</Typography>
          </Breadcrumbs>
          
          <AssessmentForm userType="teacher" assessmentId={assessmentId} />
        </Box>
      )}
    </Box>
  );
} 