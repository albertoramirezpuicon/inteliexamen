import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import Navbar from '@/components/layout/Navbar';
import AssessmentView from '@/components/admin/AssessmentView';

interface AssessmentViewPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminAssessmentViewPage({ params }: AssessmentViewPageProps) {
  const { id } = await params;
  const assessmentId = parseInt(id);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="admin" />
      
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href="/admin/dashboard" color="inherit" underline="hover">
            Dashboard
          </Link>
          <Link href="/admin/assessments" color="inherit" underline="hover">
            Assessment Management
          </Link>
          <Typography color="text.primary">View Assessment</Typography>
        </Breadcrumbs>
        
        <AssessmentView assessmentId={assessmentId} />
      </Box>
    </Box>
  );
} 