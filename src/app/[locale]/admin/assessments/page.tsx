/**
 * ADMIN ASSESSMENTS MANAGEMENT PAGE
 * 
 * PURPOSE: System-wide assessment management for administrators
 * 
 * CONNECTIONS:
 * - Links to /admin/assessments/create for creating new assessments
 * - Links to /admin/assessments/[id] for viewing specific assessment details
 * - Accessible from /admin/dashboard under Assessment Functions
 * - Uses AssessmentManagement component for CRUD operations
 * 
 * KEY FEATURES:
 * - Assessment listing and management across all institutions
 * - Create, view, edit, and delete assessments
 * - Assessment group assignment and management
 * - System-wide assessment monitoring
 * - Breadcrumb navigation for easy navigation
 * 
 * NAVIGATION FLOW:
 * - Accessible from admin dashboard
 * - Create button navigates to assessment creation
 * - View buttons navigate to specific assessment details
 * - Back navigation to dashboard
 * 
 * SYSTEM SCOPE:
 * - Manages assessments across all institutions
 * - Global assessment configuration
 * - Cross-institutional assessment monitoring
 */

'use client';

import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import Navbar from '@/components/layout/Navbar';
import AssessmentManagement from '@/components/admin/AssessmentManagement';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function AdminAssessmentsPage() {
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
          <Typography color="text.primary">{t('assessments')}</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" gutterBottom>
          {t('assessments')}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('assessmentsDescription')}
        </Typography>
        
        <AssessmentManagement userType="admin" />
      </Box>
    </Box>
  );
} 