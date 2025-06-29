import { Box, Typography, Breadcrumbs, Link, Paper } from '@mui/material';
import Navbar from '@/components/layout/Navbar';

export default function AdminSettingsPage() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="admin" />
      
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href="/admin/dashboard" color="inherit" underline="hover">
            Dashboard
          </Link>
          <Typography color="text.primary">System Settings</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" gutterBottom>
          System Settings
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Configure system parameters and global settings.
        </Typography>
        
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            System Settings Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This feature is under development and will be available soon.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
} 