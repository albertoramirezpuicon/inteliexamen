import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import Navbar from '@/components/layout/Navbar';
import AssessmentForm from '@/components/admin/AssessmentForm';

interface EditAssessmentPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeacherEditAssessmentPage({ params }: EditAssessmentPageProps) {
  const { id } = await params;
  const assessmentId = parseInt(id);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="teacher" />
      
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href="/teacher/dashboard" color="inherit" underline="hover">
            Dashboard
          </Link>
          <Link href="/teacher/assessments" color="inherit" underline="hover">
            Assessments
          </Link>
          <Typography color="text.primary">Edit Assessment</Typography>
        </Breadcrumbs>
        
        <AssessmentForm userType="teacher" assessmentId={assessmentId} />
      </Box>
    </Box>
  );
} 