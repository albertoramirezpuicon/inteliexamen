'use client';

import { Box, Container, Typography, Button, Grid, Card, CardContent, ButtonGroup } from '@mui/material';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function DemoPage() {
  const t = useTranslations();
  const params = useParams();

  const switchLanguage = (locale: string) => {
    // Get current path and replace locale
    const currentPath = window.location.pathname;
    const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}/, '');
    const newPath = `/${locale}${pathWithoutLocale}`;
    
    // Use window.location for a full page reload
    window.location.href = newPath;
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      py: 4
    }}>
      <Container maxWidth="lg">
        {/* Language Switcher */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <ButtonGroup variant="outlined" size="small">
            <Button 
              onClick={() => switchLanguage('en')}
              variant={params.locale === 'en' ? 'contained' : 'outlined'}
            >
              English
            </Button>
            <Button 
              onClick={() => switchLanguage('es')}
              variant={params.locale === 'es' ? 'contained' : 'outlined'}
            >
              Español
            </Button>
          </ButtonGroup>
        </Box>

        <Typography 
          variant="h2" 
          component="h1" 
          align="center" 
          gutterBottom
          sx={{ 
            color: 'var(--text-primary)',
            mb: 6
          }}
        >
          {t('demo.title')}
        </Typography>
        
        <Typography 
          variant="h5" 
          align="center" 
          sx={{ mb: 6, color: 'var(--text-secondary)' }}
        >
          {t('demo.subtitle')}
        </Typography>

        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  {t('common.welcome')}
                </Typography>
                <Typography variant="body1">
                  {t('demo.welcomeDescription')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  {t('navigation.assessments')}
                </Typography>
                <Typography variant="body1">
                  {t('demo.assessmentsDescription')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  {t('navigation.analytics')}
                </Typography>
                <Typography variant="body1">
                  {t('demo.analyticsDescription')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ textAlign: 'center' }}>
          <Link href="/test-translation" passHref>
            <Button variant="contained" size="large" sx={{ mr: 2 }}>
              {t('test.testButton')}
            </Button>
          </Link>
          <Button variant="outlined" size="large">
            {t('common.learnMore')}
          </Button>
        </Box>
      </Container>
    </Box>
  );
} 