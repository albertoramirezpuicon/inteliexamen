'use client';

import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import Navbar from '@/components/layout/Navbar';
import AssessmentView from '@/components/admin/AssessmentView';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

interface AssessmentViewPageProps {
  params: {
    id: string;
  };
}

export default function AdminAssessmentViewPage({ params }: AssessmentViewPageProps) {
  const t = useTranslations('admin');
  const locale = useLocale();
  const router = useRouter();
  const assessmentId = parseInt(params.id, 10);

  const navigateTo = (path: string) => {
    router.push(`/${locale}${path}`);
  };

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
          <Link 
            component="button"
            onClick={() => navigateTo('/admin/assessments')}
            color="inherit" 
            underline="hover"
            sx={{ cursor: 'pointer' }}
          >
            {t('assessments')}
          </Link>
          <Typography color="text.primary">{t('viewAssessment')}</Typography>
        </Breadcrumbs>
        
        <AssessmentView assessmentId={assessmentId} />
      </Box>
    </Box>
  );
} 