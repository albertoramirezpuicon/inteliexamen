'use client';

import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import Navbar from '@/components/layout/Navbar';
import SkillManagement from '@/components/admin/SkillManagement';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function AdminSkillsPage() {
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
          <Typography color="text.primary">{t('skills')}</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" gutterBottom>
          {t('skills')}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('skillsDescription')}
        </Typography>
        
        <SkillManagement />
      </Box>
    </Box>
  );
} 