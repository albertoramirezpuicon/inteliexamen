/**
 * ADMIN INSTITUTION MANAGEMENT PAGE
 * 
 * PURPOSE: System-wide institution management for administrators
 * 
 * CONNECTIONS:
 * - Accessible from /admin/dashboard under Global Functions
 * - Links to /admin/institutions/[id] for institution details
 * - Uses InstitutionManagement component for CRUD operations
 * - Foundation for user and group organization
 * 
 * KEY FEATURES:
 * - Create, edit, and delete educational institutions
 * - Institution-user relationship management
 * - System organization and structure
 * - Institution-specific data isolation
 * - System-wide institution monitoring
 * - Breadcrumb navigation for easy navigation
 * 
 * NAVIGATION FLOW:
 * - Accessible from admin dashboard
 * - Create button for new institution creation
 * - View/Edit buttons for institution details
 * - Back navigation to dashboard
 * 
 * SYSTEM SCOPE:
 * - Manages institutions across the entire platform
 * - Global institution configuration and control
 * - Foundation for multi-institutional platform
 * - Organizational structure administration
 */

'use client';

import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import Navbar from '@/components/layout/Navbar';
import InstitutionManagement from '@/components/admin/InstitutionManagement';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function AdminInstitutionsPage() {
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
          <Typography color="text.primary">{t('institutionManagement')}</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" gutterBottom>
          {t('institutionManagement')}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('institutionManagementDescription')}
        </Typography>
        
        <InstitutionManagement />
      </Box>
    </Box>
  );
} 