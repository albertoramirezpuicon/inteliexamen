import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import Navbar from '@/components/layout/Navbar';
import AssessmentForm from '@/components/admin/AssessmentForm';

interface EditAssessmentPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditAssessmentPage({ params }: EditAssessmentPageProps) {
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
          <Typography color="text.primary">Edit Assessment</Typography>
        </Breadcrumbs>
        
        <AssessmentForm userType="admin" assessmentId={assessmentId} />
      </Box>
    </Box>
  );
} 