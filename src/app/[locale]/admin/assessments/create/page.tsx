/**
 * ADMIN ASSESSMENT CREATION PAGE
 * 
 * PURPOSE: Create new assessments system-wide for administrators
 * 
 * CONNECTIONS:
 * - Accessible from /admin/assessments via Create Assessment button
 * - Redirects to /admin/assessments after successful creation
 * - Uses AssessmentForm component with admin userType
 * - Breadcrumb navigation: Dashboard > Assessments > Create Assessment
 * 
 * KEY FEATURES:
 * - Assessment creation form with all configuration options
 * - System-wide assessment creation (not institution-specific)
 * - Integration with shared AssessmentForm component
 * - Breadcrumb navigation for easy navigation
 * - Admin-specific assessment configuration
 * 
 * NAVIGATION FLOW:
 * - Accessible from admin assessments page
 * - Form submission creates assessment and redirects to assessments list
 * - Breadcrumb navigation allows easy return to previous pages
 * 
 * SYSTEM SCOPE:
 * - Creates assessments available across all institutions
 * - Global assessment configuration
 * - Cross-institutional assessment setup
 */

'use client';

import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import Navbar from '@/components/layout/Navbar';
import AssessmentForm from '@/components/admin/AssessmentForm';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function AdminAssessmentCreatePage() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const router = useRouter();

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
          <Typography color="text.primary">{t('createAssessment')}</Typography>
        </Breadcrumbs>
        

        
        <AssessmentForm userType="admin" />
      </Box>
    </Box>
  );
} 