import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import Navbar from '@/components/layout/Navbar';
import GroupManagement from '@/components/admin/GroupManagement';

export default function AdminGroupsPage() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="admin" />
      
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href="/admin/dashboard" color="inherit" underline="hover">
            Dashboard
          </Link>
          <Typography color="text.primary">Group Management</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" gutterBottom>
          Group Management
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Create and manage user groups. Groups can only contain students from the same institution.
        </Typography>
        
        <GroupManagement />
      </Box>
    </Box>
  );
} 