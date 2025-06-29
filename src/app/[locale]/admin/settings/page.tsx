'use client';

import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import Navbar from '@/components/layout/Navbar';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function AdminSettingsPage() {
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
          <Typography color="text.primary">{t('settings')}</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" gutterBottom>
          {t('settings')}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('settingsDescription')}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          System settings functionality will be implemented here.
        </Typography>
      </Box>
    </Box>
  );
} 