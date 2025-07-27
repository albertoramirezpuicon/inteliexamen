/**
 * ADMIN USER MANAGEMENT PAGE
 * 
 * PURPOSE: System-wide user management for administrators
 * 
 * CONNECTIONS:
 * - Accessible from /admin/dashboard under Global Functions
 * - Links to /admin/users/[id] for user details
 * - Links to /admin/users/[id]/groups for user group management
 * - Uses UserManagement component for CRUD operations
 * 
 * KEY FEATURES:
 * - Create, edit, and delete users across all institutions
 * - Role assignment (Admin, Teacher, Student)
 * - Institution assignment and management
 * - User group membership management
 * - System-wide user monitoring and control
 * - Breadcrumb navigation for easy navigation
 * 
 * NAVIGATION FLOW:
 * - Accessible from admin dashboard
 * - Create button for new user creation
 * - View/Edit buttons for user details
 * - Group management for user assignments
 * - Back navigation to dashboard
 * 
 * SYSTEM SCOPE:
 * - Manages users across all institutions
 * - Global user configuration and control
 * - Cross-institutional user management
 * - Role-based access control administration
 */

'use client';

import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import Navbar from '@/components/layout/Navbar';
import UserManagement from '@/components/admin/UserManagement';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
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
          <Typography color="text.primary">{t('userManagement')}</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" gutterBottom>
          {t('userManagement')}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('userManagementDescription')}
        </Typography>
        
        <UserManagement />
      </Box>
    </Box>
  );
} 