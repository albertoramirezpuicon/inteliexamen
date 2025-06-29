'use client';

import { Box, Container, Typography, Button } from '@mui/material';

export default function TestTranslation() {
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
          Translation Test Page
        </Typography>
        
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Welcome to our test page
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            This is a simple test to verify that our translation system works correctly.
          </Typography>
          <Button variant="contained" size="large">
            Test Button
          </Button>
        </Box>

        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 3
        }}>
          <Box sx={{ p: 3, border: '1px solid #ddd', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Section One
            </Typography>
            <Typography variant="body2">
              This is the first section with some sample text.
            </Typography>
          </Box>
          
          <Box sx={{ p: 3, border: '1px solid #ddd', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Section Two
            </Typography>
            <Typography variant="body2">
              This is the second section with different content.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
} 