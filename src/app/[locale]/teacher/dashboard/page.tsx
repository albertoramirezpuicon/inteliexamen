/**
 * TEACHER DASHBOARD - MAIN TEACHER HUB
 * 
 * PURPOSE: Teacher main dashboard with institution-specific functions and statistics
 * 
 * CONNECTIONS:
 * - ASSESSMENT MANAGEMENT: Links to /teacher/assessments, /teacher/attempts
 * - STUDENT MANAGEMENT: Links to /teacher/groups, /teacher/users
 * - ACADEMIC MANAGEMENT: Links to /teacher/domains, /teacher/skills
 * - Accessible after successful teacher login
 * 
 * KEY FEATURES:
 * - Teacher-specific statistics and overview
 * - Recent activity and attempt monitoring
 * - Quick access to main teaching functions
 * - Institution-specific data and management
 * - Role-based access control for teacher functions
 * 
 * NAVIGATION FLOW:
 * - Entry point after teacher login
 * - Central hub for all teacher functions
 * - Organized by functional categories
 * 
 * INSTITUTION SCOPE:
 * - Manages students and groups within teacher's institution
 * - Creates and manages assessments for assigned groups
 * - Monitors assessment attempts and results
 * - Manages domains and skills for educational content
 * - Handles student disputes and grade adjustments
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardActionArea,
  Breadcrumbs, 
  Chip,
  Avatar,
  List,
  ListItem,
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
  Book as BookIcon
} from '@mui/icons-material';
import Navbar from '@/components/layout/Navbar';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

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
  const locale = useLocale();
  const t = useTranslations('teacher');
  const tCommon = useTranslations('common');
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
          router.push(`/${locale}/teacher/login`);
          return null;
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // If there's an error parsing user data, redirect to login
        router.push(`/${locale}/teacher/login`);
        return null;
      }
    };

    const initializeData = async () => {
      setLoading(true);
      await fetchUserData();
      setLoading(false);
    };

    initializeData();
  }, [router, locale]);

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
        <Typography>{tCommon('loading')}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="teacher" userName={getUserDisplayName()} />
      
      <Box sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('welcomeMessage', { name: getUserDisplayName() })}
        </Typography>

        {/* Assessment Management */}
        <Typography variant="h5" sx={{ mb: 2, mt: 4, color: '#7b1fa2', fontWeight: 'bold' }}>
          {t('assessmentManagement')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('assessmentManagementDescription')}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
          <FunctionCard
            title={t('assessments.title')}
            description={t('assessmentsDescription', { total: stats?.totalAssessments || 0, active: stats?.activeAssessments || 0 })}
            icon={<AssessmentIcon />}
            onClick={() => router.push(`/${locale}/teacher/assessments`)}
            color="#4caf50"
          />
          <FunctionCard
            title={t('attempts.title')}
            description={t('attemptsDescription', { total: stats?.totalAttempts || 0 })}
            icon={<AssessmentIcon />}
            onClick={() => router.push(`/${locale}/teacher/attempts`)}
            color="#c2185b"
          />
        </Box>

        {/* Student Management */}
        <Typography variant="h5" sx={{ mb: 2, mt: 4, color: '#1976d2', fontWeight: 'bold' }}>
          {t('studentManagement')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('studentManagementDescription')}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
          <FunctionCard
            title={t('groups.title')}
            description={t('groupsDescription', { total: stats?.totalGroups || 0 })}
            icon={<GroupIcon />}
            onClick={() => router.push(`/${locale}/teacher/groups`)}
            color="#f57c00"
          />
          <FunctionCard
            title={t('users.title')}
            description={t('studentsDescription', { total: stats?.totalStudents || 0 })}
            icon={<PeopleIcon />}
            onClick={() => router.push(`/${locale}/teacher/users`)}
            color="#1976d2"
          />
        </Box>

        {/* Academic Content */}
        <Typography variant="h5" sx={{ mb: 2, mt: 4, color: '#ff6f00', fontWeight: 'bold' }}>
          {t('academicContent')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('academicContentDescription')}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
          <FunctionCard
            title={t('domains.title')}
            description={t('domainsDescription', { total: stats?.totalDomains || 0 })}
            icon={<CategoryIcon />}
            onClick={() => router.push(`/${locale}/teacher/domains`)}
            color="#ff6f00"
          />
          <FunctionCard
            title={t('skills.title')}
            description={t('skillsDescription', { total: stats?.totalSkills || 0 })}
            icon={<PsychologyIcon />}
            onClick={() => router.push(`/${locale}/teacher/skills`)}
            color="#0097a7"
          />
          <FunctionCard
            title={t('sources.title')}
            description={t('sources.description')}
            icon={<BookIcon />}
            onClick={() => router.push(`/${locale}/teacher/sources`)}
            color="#8e24aa"
          />
        </Box>

        {/* Recent Activity */}
        {stats?.recentAttempts && stats.recentAttempts.length > 0 && (
          <>
            <Typography variant="h5" sx={{ mb: 2, mt: 4, color: '#388e3c', fontWeight: 'bold' }}>
              {t('recentActivity')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('recentActivityDescription')}
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
                                {t('attempted')}
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {attempt.assessment_name}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Chip 
                                label={attempt.status} 
                                size="small" 
                                color={getStatusColor(attempt.status) as 'success' | 'warning' | 'info' | 'primary' | 'default'}
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
    <Card 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        minHeight: { xs: 'auto', md: '140px' },
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        }
      }}
    >
      <CardActionArea 
        onClick={onClick}
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch'
        }}
      >
        <CardContent sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          p: { xs: 2, md: 1.5 }
        }}>
          <Box sx={{ 
            color: color,
            mb: { xs: 1.5, md: 1 },
            '& svg': { fontSize: { xs: 40, md: 32 } }
          }}>
            {icon}
          </Box>
          <Typography 
            variant="h6" 
            component="h3" 
            gutterBottom 
            sx={{ 
              fontWeight: 'bold',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.2,
              mb: 0.5,
              fontSize: { xs: '1rem', md: '0.875rem' }
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.4,
              minHeight: { xs: '4.2em', md: '3.9em' }, // Adjusted for smaller text
              flexGrow: 1,
              fontSize: { xs: '0.875rem', md: '0.75rem' }
            }}
          >
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
} 