/**
 * ADMIN DASHBOARD - MAIN ADMIN HUB
 * 
 * PURPOSE: Admin main dashboard with system-wide management functions and navigation
 * 
 * CONNECTIONS:
 * - GLOBAL FUNCTIONS: Links to /admin/institutions, /admin/users, /admin/groups
 * - ACADEMIC FUNCTIONS: Links to /admin/domains, /admin/skills
 * - ASSESSMENT FUNCTIONS: Links to /admin/assessments, /admin/attempts
 * - SYSTEM FUNCTIONS: Links to /admin/analytics, /admin/settings
 * - Accessible after successful admin login
 * 
 * KEY FEATURES:
 * - User information display and management
 * - Categorized function cards for system management
 * - Navigation to all admin functions
 * - System-wide overview and statistics
 * - Role-based access control
 * 
 * NAVIGATION FLOW:
 * - Entry point after admin login
 * - Central hub for all admin functions
 * - Organized by functional categories
 * 
 * SYSTEM MANAGEMENT:
 * - Institution management across platform
 * - User management with role assignment
 * - Group management for student organization
 * - Domain and skill configuration
 * - Assessment and attempt monitoring
 * - System analytics and settings
 */

'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, CardActionArea } from '@mui/material';
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
  Assignment as AssignmentIcon
} from '@mui/icons-material';
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

export default function AdminDashboard() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('admin');
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

  const navigateTo = (path: string) => {
    router.push(`/${locale}${path}`);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography>{t('loading')}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="admin" userName={getUserDisplayName()} />
      
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {t('dashboard')}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('manageSystemFunctions')}
        </Typography>
        
        {/* Global Functions */}
        <Typography variant="h5" sx={{ mb: 2, mt: 4, color: '#1976d2', fontWeight: 'bold' }}>
          {t('globalFunctions')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('globalFunctionsDescription')}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, mb: 4 }}>
          <FunctionCard
            title={t('institutions')}
            description={t('institutionsDescription')}
            icon={<BusinessIcon />}
            onClick={() => navigateTo('/admin/institutions')}
            color="#388e3c"
          />
          
          <FunctionCard
            title={t('users')}
            description={t('usersDescription')}
            icon={<PeopleIcon />}
            onClick={() => navigateTo('/admin/users')}
            color="#1976d2"
          />
          
          <FunctionCard
            title={t('groups')}
            description={t('groupsDescription')}
            icon={<GroupIcon />}
            onClick={() => navigateTo('/admin/groups')}
            color="#f57c00"
          />
        </Box>

        {/* Academic Functions */}
        <Typography variant="h5" sx={{ mb: 2, mt: 4, color: '#ff6f00', fontWeight: 'bold' }}>
          {t('academicFunctions')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('academicFunctionsDescription')}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, mb: 4 }}>
          <FunctionCard
            title={t('domains')}
            description={t('domainsDescription')}
            icon={<CategoryIcon />}
            onClick={() => navigateTo('/admin/domains')}
            color="#ff6f00"
          />
          
          <FunctionCard
            title={t('skills')}
            description={t('skillsDescription')}
            icon={<PsychologyIcon />}
            onClick={() => navigateTo('/admin/skills')}
            color="#0097a7"
          />
        </Box>

        {/* Assessment Functions */}
        <Typography variant="h5" sx={{ mb: 2, mt: 4, color: '#7b1fa2', fontWeight: 'bold' }}>
          {t('assessmentFunctions')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('assessmentFunctionsDescription')}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, mb: 4 }}>
          <FunctionCard
            title={t('assessments')}
            description={t('assessmentsDescription')}
            icon={<AssessmentIcon />}
            onClick={() => navigateTo('/admin/assessments')}
            color="#7b1fa2"
          />
          
          <FunctionCard
            title={t('attempts')}
            description={t('attemptsDescription')}
            icon={<AssignmentIcon />}
            onClick={() => navigateTo('/admin/attempts')}
            color="#c2185b"
          />
        </Box>

        {/* System Functions */}
        <Typography variant="h5" sx={{ mb: 2, mt: 4, color: '#d32f2f', fontWeight: 'bold' }}>
          {t('systemFunctions')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('systemFunctionsDescription')}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, mb: 4 }}>
          <FunctionCard
            title={t('analytics')}
            description={t('analyticsDescription')}
            icon={<AnalyticsIcon />}
            onClick={() => navigateTo('/admin/analytics')}
            color="#d32f2f"
          />
          
          <FunctionCard
            title={t('settings')}
            description={t('settingsDescription')}
            icon={<SettingsIcon />}
            onClick={() => navigateTo('/admin/settings')}
            color="#5d4037"
          />
        </Box>
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
          p: 3
        }}>
          <Box sx={{ 
            color: color,
            mb: 2,
            '& svg': { fontSize: 48 }
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
              mb: 1
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
              minHeight: '4.2em', // 3 lines * 1.4 line height
              flexGrow: 1
            }}
          >
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
} 