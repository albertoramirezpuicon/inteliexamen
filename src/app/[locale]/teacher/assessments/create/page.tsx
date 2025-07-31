'use client';

import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import Navbar from '@/components/layout/Navbar';
import AssessmentForm from '@/components/admin/AssessmentForm';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function TeacherAssessmentCreatePage() {
  const t = useTranslations('teacher');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const navigateTo = (path: string) => {
    router.push(`/${locale}${path}`);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
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
          <Typography color="text.primary">{t('createAssessment')}</Typography>
        </Breadcrumbs>
        

        
        <AssessmentForm userType="teacher" />
      </Box>
    </Box>
  );
} 