'use client';

import { Box, Container, Typography, Button } from '@mui/material';
import { useTranslations } from 'next-intl';

export default function TestTranslation() {
  const t = useTranslations();

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      display: 'flex',
      alignItems: 'center',
      py: 4
    }}>
      <Container maxWidth="md">
        <Typography 
          variant="h3" 
          component="h1" 
          align="center" 
          gutterBottom
          sx={{ 
            color: 'var(--text-primary)',
            mb: 4
          }}
        >
          {t('test.title')}
        </Typography>
        
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            {t('test.welcome')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {t('test.description')}
          </Typography>
          <Button variant="contained" size="large">
            {t('test.testButton')}
          </Button>
        </Box>

        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 3
        }}>
          <Box sx={{ p: 3, border: '1px solid #ddd', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('test.sectionOne')}
            </Typography>
            <Typography variant="body2">
              {t('test.sectionOneText')}
            </Typography>
          </Box>
          
          <Box sx={{ p: 3, border: '1px solid #ddd', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('test.sectionTwo')}
            </Typography>
            <Typography variant="body2">
              {t('test.sectionTwoText')}
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
} 