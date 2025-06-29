'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TextField, Button, Box, Typography, Alert, Link, Dialog, DialogContent } from '@mui/material';
import { hasAccessToArea, UserRole } from '@/lib/auth';
import { useTranslations } from 'next-intl';
import ForgotPasswordForm from './ForgotPasswordForm';

interface LoginFormProps {
  userType: 'admin' | 'student' | 'teacher';
}

export default function LoginForm({ userType }: LoginFormProps) {
  const router = useRouter();
  const t = useTranslations('auth');
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getLoginTitle = () => {
    switch (userType) {
      case 'admin':
        return t('adminLogin');
      case 'teacher':
        return t('teacherLogin');
      case 'student':
        return t('studentLogin');
      default:
        return t('login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting login for:', email);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (!response.ok) {
        setError(data.error || t('loginError'));
        return;
      }

      const user = data.user;
      console.log('User data:', user);
      console.log('User role:', user.role, 'Target area:', userType);
      console.log('User language preference:', user.language_preference);

      if (!hasAccessToArea(user.role as UserRole, userType)) {
        console.log('Access denied - user role:', user.role, 'target area:', userType);
        setError(t('accessDenied'));
        return;
      }

      console.log('Access granted, storing user data...');

      // Store user data in localStorage for future use
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userId', user.id.toString());
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userName', `${user.given_name} ${user.family_name}`);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userLanguage', user.language_preference || 'en');

      console.log('User data stored, redirecting...');

      // Get user's preferred language
      const userLanguage = user.language_preference || 'en';
      console.log('Redirecting with user language preference:', userLanguage);

      // Redirect to appropriate dashboard with user's language preference
      switch (user.role) {
        case 'admin':
          console.log('Redirecting to admin dashboard');
          router.replace(`/${userLanguage}/admin/dashboard`);
          break;
        case 'teacher':
          console.log('Redirecting to teacher dashboard');
          router.replace(`/${userLanguage}/teacher/dashboard`);
          break;
        case 'student':
          console.log('Redirecting to student dashboard');
          router.replace(`/${userLanguage}/student/dashboard`);
          break;
        case 'clerk':
          // Clerk can access both admin and teacher areas
          if (userType === 'admin') {
            console.log('Redirecting clerk to admin dashboard');
            router.replace(`/${userLanguage}/admin/dashboard`);
          } else {
            console.log('Redirecting clerk to teacher dashboard');
            router.replace(`/${userLanguage}/teacher/dashboard`);
          }
          break;
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(t('loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null; // or a loading spinner
  }

  return (
    <>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          maxWidth: 400,
          mx: 'auto',
          p: 3,
          backgroundColor: '#ffffff',
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom>
          {getLoginTitle()}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label={t('email')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
        />

        <TextField
          label={t('password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={isLoading}
        >
          {isLoading ? t('loggingIn') : t('login')}
        </Button>

        <Box sx={{ textAlign: 'center', mt: 1 }}>
          <Link
            component="button"
            onClick={() => setForgotPasswordOpen(true)}
            sx={{ cursor: 'pointer', fontSize: '0.875rem' }}
          >
            {t('forgotPassword')}
          </Link>
        </Box>
      </Box>

      <Dialog
        open={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          <ForgotPasswordForm onClose={() => setForgotPasswordOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
} 