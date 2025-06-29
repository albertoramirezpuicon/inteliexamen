'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActionArea, Divider } from '@mui/material';
import Navbar from '@/components/layout/Navbar';
import { 
  People as PeopleIcon, 
  Business as BusinessIcon, 
  Group as GroupIcon, 
  Assessment as AssessmentIcon, 
  Settings as SettingsIcon, 
  Analytics as AnalyticsIcon, 
  Category as CategoryIcon, 
  Psychology as PsychologyIcon, 
  Layers as LayersIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
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

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // First try to get user data from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setLoading(false);
          return;
        }

        // If not in localStorage, fetch from API
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          // Store in localStorage for future use
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          console.error('Failed to fetch user data:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const getUserDisplayName = () => {
    if (!user) return '';
    return `${user.given_name} ${user.family_name}`.trim() || user.email;
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
      <Navbar userType="admin" userName={getUserDisplayName()} />
      
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Manage your system's core functions and configurations
        </Typography>
        
        {/* Global Functions */}
        <Typography variant="h5" sx={{ mb: 2, mt: 4, color: '#1976d2', fontWeight: 'bold' }}>
          Global Functions
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Manage system-wide entities and user access
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid xs={12} sm={6} md={4}>
            <FunctionCard
              title="Institutions"
              description="Manage educational institutions and their settings"
              icon={<BusinessIcon />}
              onClick={() => router.push('/admin/institutions')}
              color="#388e3c"
            />
          </Grid>
          
          <Grid xs={12} sm={6} md={4}>
            <FunctionCard
              title="Users"
              description="Create, edit, and manage system users and roles"
              icon={<PeopleIcon />}
              onClick={() => router.push('/admin/users')}
              color="#1976d2"
            />
          </Grid>
          
          <Grid xs={12} sm={6} md={4}>
            <FunctionCard
              title="Groups"
              description="Create and manage user groups for assessment access"
              icon={<GroupIcon />}
              onClick={() => router.push('/admin/groups')}
              color="#f57c00"
            />
          </Grid>
        </Grid>

        {/* Academic Functions */}
        <Typography variant="h5" sx={{ mb: 2, mt: 4, color: '#ff6f00', fontWeight: 'bold' }}>
          Academic Functions
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Manage educational content and skill frameworks
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid xs={12} sm={6} md={4}>
            <FunctionCard
              title="Domains"
              description="Manage educational domains within institutions"
              icon={<CategoryIcon />}
              onClick={() => router.push('/admin/domains')}
              color="#ff6f00"
            />
          </Grid>
          
          <Grid xs={12} sm={6} md={4}>
            <FunctionCard
              title="Skills"
              description="Create and manage skills for each domain"
              icon={<PsychologyIcon />}
              onClick={() => router.push('/admin/skills')}
              color="#0097a7"
            />
          </Grid>
          
          <Grid xs={12} sm={6} md={4}>
            <FunctionCard
              title="Skill Levels"
              description="Define mastery levels and progression for skills"
              icon={<LayersIcon />}
              onClick={() => router.push('/admin/skills')}
              color="#6a1b9a"
            />
          </Grid>
        </Grid>

        {/* Assessment Functions */}
        <Typography variant="h5" sx={{ mb: 2, mt: 4, color: '#7b1fa2', fontWeight: 'bold' }}>
          Assessment Functions
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Manage exams, assessments, and student attempts
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid xs={12} sm={6} md={4}>
            <FunctionCard
              title="Assessments"
              description="Create, edit, and manage exams and assessments"
              icon={<AssessmentIcon />}
              onClick={() => router.push('/admin/assessments')}
              color="#7b1fa2"
            />
          </Grid>
          
          <Grid xs={12} sm={6} md={4}>
            <FunctionCard
              title="Attempts"
              description="View and manage student assessment attempts and results"
              icon={<AssignmentIcon />}
              onClick={() => router.push('/admin/attempts')}
              color="#c2185b"
            />
          </Grid>
        </Grid>

        {/* System Functions */}
        <Typography variant="h5" sx={{ mb: 2, mt: 4, color: '#d32f2f', fontWeight: 'bold' }}>
          System Functions
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          System configuration and monitoring
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid xs={12} sm={6} md={4}>
            <FunctionCard
              title="Settings"
              description="Configure system parameters and preferences"
              icon={<SettingsIcon />}
              onClick={() => router.push('/admin/settings')}
              color="#d32f2f"
            />
          </Grid>
          
          <Grid xs={12} sm={6} md={4}>
            <FunctionCard
              title="Analytics & Reports"
              description="View system analytics, performance reports, and insights"
              icon={<AnalyticsIcon />}
              onClick={() => router.push('/admin/analytics')}
              color="#0288d1"
            />
          </Grid>
        </Grid>
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