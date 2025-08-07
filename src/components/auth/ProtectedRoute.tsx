'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useTranslations } from 'next-intl';

interface ProtectedRouteProps {
  children: React.ReactNode;
  userType: 'admin' | 'student' | 'teacher';
  fallback?: React.ReactNode;
}

interface User {
  id: number;
  email: string;
  given_name: string;
  family_name: string;
  role: string;
  institution_id: number | null;
  institution_name: string | null;
}

export default function ProtectedRoute({ 
  children, 
  userType, 
  fallback 
}: ProtectedRouteProps) {
  const router = useRouter();
  const t = useTranslations('common');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Check for user data in localStorage
        const storedUser = localStorage.getItem('user');
        
        if (!storedUser) {
          console.log('No user data found, redirecting to login');
          redirectToLogin();
          return;
        }

        const userData: User = JSON.parse(storedUser);
        
        // Validate user data structure
        if (!userData.id || !userData.role) {
          console.log('Invalid user data structure, redirecting to login');
          redirectToLogin();
          return;
        }

        // Check if user has access to this area
        if (!hasAccessToArea(userData.role, userType)) {
          console.log('User does not have access to this area');
          redirectToLogin();
          return;
        }

        setUser(userData);
        setAuthorized(true);
      } catch (error) {
        console.error('Error checking authentication:', error);
        redirectToLogin();
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, [userType]);

  const hasAccessToArea = (userRole: string, targetArea: string): boolean => {
    // Clerk can access both admin and teacher areas
    if (userRole === 'clerk') {
      return targetArea === 'admin' || targetArea === 'teacher';
    }

    // Other roles can only access their own area
    return userRole === targetArea;
  };

  const redirectToLogin = () => {
    const loginPath = `/${userType}/login`;
    router.replace(loginPath);
  };

  if (loading) {
    return fallback || (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          backgroundColor: '#ffffff', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center' 
        }}
      >
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          {t('loading')}
        </Typography>
      </Box>
    );
  }

  if (!authorized) {
    return fallback || (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          backgroundColor: '#ffffff', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}
      >
        <Typography variant="body1" color="text.secondary">
          {t('accessDenied')}
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
}
