import { Box, Container, Paper, Typography, Button } from '@mui/material';
import Link from 'next/link';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';

export default function Demo() {
  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      display: 'flex',
      alignItems: 'center',
      py: 4
    }}>
      <Container maxWidth="lg">
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(3, 1fr)'
          },
          gap: 4
        }}>
          <Paper 
            elevation={3}
            sx={{ 
              p: 4,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              backgroundColor: 'var(--card-background)',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}
          >
            <AdminPanelSettingsIcon sx={{ fontSize: 60, color: 'var(--primary)', mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom sx={{ color: 'var(--text-primary)' }}>
              Admin Area
            </Typography>
            <Typography variant="body1" sx={{ color: 'var(--text-secondary)', mb: 3 }}>
              Manage users, settings, and system configuration
            </Typography>
            <Button 
              component={Link}
              href="/admin/login"
              variant="contained"
              size="large"
              sx={{ mt: 'auto' }}
            >
              Access Admin Area
            </Button>
          </Paper>

          <Paper 
            elevation={3}
            sx={{ 
              p: 4,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              backgroundColor: 'var(--card-background)',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}
          >
            <SchoolIcon sx={{ fontSize: 60, color: 'var(--primary)', mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom sx={{ color: 'var(--text-primary)' }}>
              Student Area
            </Typography>
            <Typography variant="body1" sx={{ color: 'var(--text-secondary)', mb: 3 }}>
              Access your courses, assignments, and track your progress
            </Typography>
            <Button 
              component={Link}
              href="/student/login"
              variant="contained"
              size="large"
              sx={{ mt: 'auto' }}
            >
              Access Student Area
            </Button>
          </Paper>

          <Paper 
            elevation={3}
            sx={{ 
              p: 4,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              backgroundColor: 'var(--card-background)',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}
          >
            <PersonIcon sx={{ fontSize: 60, color: 'var(--primary)', mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom sx={{ color: 'var(--text-primary)' }}>
              Teacher Area
            </Typography>
            <Typography variant="body1" sx={{ color: 'var(--text-secondary)', mb: 3 }}>
              Manage your classes, assignments, and student progress
            </Typography>
            <Button 
              component={Link}
              href="/teacher/login"
              variant="contained"
              size="large"
              sx={{ mt: 'auto' }}
            >
              Access Teacher Area
            </Button>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
} 