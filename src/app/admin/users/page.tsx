import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import Navbar from '@/components/layout/Navbar';
import UserManagement from '@/components/admin/UserManagement';

export default function AdminUsersPage() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="admin" />
      
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href="/admin/dashboard" color="inherit" underline="hover">
            Dashboard
          </Link>
          <Typography color="text.primary">User Management</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" gutterBottom>
          User Management
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Create, edit, and manage system users. Control access levels and user roles.
        </Typography>
        
        <UserManagement />
      </Box>
    </Box>
  );
} 