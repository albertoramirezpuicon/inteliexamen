import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import Navbar from '@/components/layout/Navbar';
import DomainManagement from '@/components/admin/DomainManagement';

export default function AdminDomainsPage() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="admin" />
      
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href="/admin/dashboard" color="inherit" underline="hover">
            Dashboard
          </Link>
          <Typography color="text.primary">Domain Management</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" gutterBottom>
          Domain Management
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Create, edit, and manage educational domains within institutions. Organize skills and competencies by domain areas.
        </Typography>
        
        <DomainManagement />
      </Box>
    </Box>
  );
} import Navbar from '@/components/layout/Navbar';
import DomainManagement from '@/components/admin/DomainManagement';

export default function AdminDomainsPage() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="admin" />
      
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href="/admin/dashboard" color="inherit" underline="hover">
            Dashboard
          </Link>
          <Typography color="text.primary">Domain Management</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" gutterBottom>
          Domain Management
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Create, edit, and manage educational domains within institutions. Organize skills and competencies by domain areas.
        </Typography>
        
        <DomainManagement />
      </Box>
    </Box>
  );
} 
