/**
 * ADMIN ASSESSMENT VIEW PAGE
 * 
 * PURPOSE: View and manage specific assessment details system-wide
 * 
 * CONNECTIONS:
 * - Accessible from /admin/assessments via View button
 * - Links to /admin/assessments/[id]/groups for group management
 * - Uses AssessmentView component for detailed display
 * - Breadcrumb navigation: Dashboard > Assessments > View Assessment
 * 
 * KEY FEATURES:
 * - Assessment details display and management
 * - Edit and delete functionality for assessments
 * - Group assignment management
 * - System-wide assessment monitoring
 * - Dynamic route handling with assessment ID
 * 
 * NAVIGATION FLOW:
 * - Accessible from admin assessments list
 * - View button navigates to specific assessment details
 * - Group management available for assessment assignment
 * - Breadcrumb navigation allows easy return to previous pages
 * 
 * SYSTEM SCOPE:
 * - Manages assessments across all institutions
 * - Global assessment configuration
 * - Cross-institutional assessment monitoring
 */

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