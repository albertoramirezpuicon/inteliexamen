import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import Navbar from '@/components/layout/Navbar';
import InstitutionManagement from '@/components/admin/InstitutionManagement';

export default function AdminInstitutionsPage() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="admin" />
      
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href="/admin/dashboard" color="inherit" underline="hover">
            Dashboard
          </Link>
          <Typography color="text.primary">Institution Management</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" gutterBottom>
          Institution Management
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Create, edit, and manage educational institutions. Control institution data and contact information.
        </Typography>
        
        <InstitutionManagement />
      </Box>
    </Box>
  );
} 