'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActionArea,
  Breadcrumbs, 
  Link,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider
} from '@mui/material';
import {
  People as PeopleIcon,
  Group as GroupIcon,
  Category as CategoryIcon,
  Psychology as PsychologyIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon
} from '@mui/icons-material';
import Navbar from '@/components/layout/Navbar';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  given_name: string;
  family_name: string;
  role: string;
  institution_id: number | null;
  institution_name: string | null;
}

interface DashboardStats {
  totalStudents: number;
  totalGroups: number;
  totalDomains: number;
  totalSkills: number;
  totalAssessments: number;
  totalAttempts: number;
  activeAssessments: number;
  completedAssessments: number;
  recentAttempts: Array<{
    id: number;
    student_name: string;
    assessment_name: string;
    status: string;
    created_at: string;
  }>;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          return userData; // Return user data for immediate use
        } else {
          // If no user data in localStorage, redirect to login
          router.push('/teacher/login');
          return null;
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // If there's an error parsing user data, redirect to login
        router.push('/teacher/login');
        return null;
      }
    };

    const initializeData = async () => {
      setLoading(true);
      await fetchUserData();
      setLoading(false);
    };

    initializeData();
  }, [router]);

  // Separate useEffect to fetch stats when user is available
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/teacher/dashboard/stats', {
          headers: {
            'x-user-id': user.id.toString(),
            'x-institution-id': user.institution_id?.toString() || ''
          }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          console.error('Failed to fetch dashboard stats:', response.status);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchDashboardStats();
  }, [user]);

  const getUserDisplayName = () => {
    if (!user) return '';
    return `${user.given_name} ${user.family_name}`.trim() || user.email;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'draft':
        return 'warning';
      case 'completed':
        return 'info';
      case 'in progress':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="teacher" userName={getUserDisplayName()} />
      
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Typography color="text.primary">Teacher Dashboard</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" gutterBottom>
          Teacher Dashboard
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Welcome back, {getUserDisplayName()}. Manage your educational content and track student progress.
        </Typography>

        {/* Remove old Student Management and Academic Content section headers and descriptions */}
        {/* Only Assessment Management header/description above first row */}
        {/* First row: Assessment Management */}
        <Typography variant="h5" sx={{ mb: 2, mt: 4, color: '#7b1fa2', fontWeight: 'bold' }}>
          Assessment Management
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Create and manage assessments, track student attempts
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid xs={12} sm={6} md={4}>
            <FunctionCard
              title="Assessments"
              description={`Manage ${stats?.totalAssessments || 0} assessments (${stats?.activeAssessments || 0} active)`}
              icon={<AssignmentIcon />}
              onClick={() => router.push('/teacher/assessments')}
              color="#7b1fa2"
            />
          </Grid>
          <Grid xs={12} sm={6} md={4}>
            <FunctionCard
              title="Attempts"
              description={`View ${stats?.totalAttempts || 0} student attempts and results`}
              icon={<AssessmentIcon />}
              onClick={() => router.push('/teacher/attempts')}
              color="#c2185b"
            />
          </Grid>
        </Grid>

        {/* Second row: Combined Student Management and Academic Content */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid xs={12} sm={6} md={3}>
            <FunctionCard
              title="Students"
              description={`View ${stats?.totalStudents || 0} students in your institution`}
              icon={<PeopleIcon />}
              onClick={() => router.push('/teacher/users')}
              color="#1976d2"
            />
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <FunctionCard
              title="Groups"
              description={`Manage ${stats?.totalGroups || 0} groups for assessment access`}
              icon={<GroupIcon />}
              onClick={() => router.push('/teacher/groups')}
              color="#f57c00"
            />
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <FunctionCard
              title="Domains"
              description={`Manage ${stats?.totalDomains || 0} educational domains`}
              icon={<CategoryIcon />}
              onClick={() => router.push('/teacher/domains')}
              color="#ff6f00"
            />
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <FunctionCard
              title="Skills"
              description={`Create and manage ${stats?.totalSkills || 0} skills and competencies`}
              icon={<PsychologyIcon />}
              onClick={() => router.push('/teacher/skills')}
              color="#0097a7"
            />
          </Grid>
        </Grid>

        {/* Recent Activity */}
        {stats?.recentAttempts && stats.recentAttempts.length > 0 && (
          <>
            <Typography variant="h5" sx={{ mb: 2, mt: 4, color: '#388e3c', fontWeight: 'bold' }}>
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Latest student attempts and activities
            </Typography>
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <List>
                  {stats.recentAttempts.map((attempt, index) => (
                    <Box key={attempt.id}>
                      <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <AssessmentIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" fontWeight="medium">
                                {attempt.student_name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                attempted
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {attempt.assessment_name}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Chip 
                                label={attempt.status} 
                                size="small" 
                                color={getStatusColor(attempt.status) as any}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(attempt.created_at)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </ListItem>
                      {index < stats.recentAttempts.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          </>
        )}
      </Box>
    </Box>
  );
}

interface FunctionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
}

function FunctionCard({ title, description, icon, onClick, color }: FunctionCardProps) {
  return (
    <Card sx={{ 
      height: 200, // Fixed height for all cards
      transition: 'transform 0.2s', 
      '&:hover': { transform: 'translateY(-4px)' },
      display: 'flex',
      flexDirection: 'column'
    }}>
      <CardActionArea 
        sx={{ 
          height: '100%', 
          p: 2,
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={onClick}
      >
        <CardContent sx={{ 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'space-between'
        }}>
          <Box>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mb: 2,
              '& svg': { 
                fontSize: 48,
                color: color
              }
            }}>
              {icon}
            </Box>
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
} 