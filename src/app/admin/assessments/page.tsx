import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import Navbar from '@/components/layout/Navbar';
import AssessmentManagement from '@/components/admin/AssessmentManagement';

export default function AdminAssessmentsPage() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="admin" />
      
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href="/admin/dashboard" color="inherit" underline="hover">
            Dashboard
          </Link>
          <Typography color="text.primary">Assessment Management</Typography>
        </Breadcrumbs>
        
        <AssessmentManagement userType="admin" />
      </Box>
    </Box>
  );
} 