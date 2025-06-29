import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import Navbar from '@/components/layout/Navbar';
import SkillManagement from '@/components/admin/SkillManagement';

export default function AdminSkillsPage() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="admin" />
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href="/admin/dashboard" color="inherit" underline="hover">
            Dashboard
          </Link>
          <Typography color="text.primary">Skill Management</Typography>
        </Breadcrumbs>
        <Typography variant="h4" gutterBottom>
          Skill Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Create, edit, and manage skills for each domain and institution. Use the AI helper to generate clear, context-appropriate names and descriptions.
        </Typography>
        <SkillManagement />
      </Box>
    </Box>
  );
} import Navbar from '@/components/layout/Navbar';
import SkillManagement from '@/components/admin/SkillManagement';

export default function AdminSkillsPage() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="admin" />
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href="/admin/dashboard" color="inherit" underline="hover">
            Dashboard
          </Link>
          <Typography color="text.primary">Skill Management</Typography>
        </Breadcrumbs>
        <Typography variant="h4" gutterBottom>
          Skill Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Create, edit, and manage skills for each domain and institution. Use the AI helper to generate clear, context-appropriate names and descriptions.
        </Typography>
        <SkillManagement />
      </Box>
    </Box>
  );
} 
