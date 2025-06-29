'use client';

import { useState } from 'react';
import { TextField, Button, Box, Typography, Alert, Link } from '@mui/material';
import { useTranslations } from 'next-intl';

interface ForgotPasswordFormProps {
  onClose: () => void;
}

export default function ForgotPasswordForm({ onClose }: ForgotPasswordFormProps) {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('forgotPasswordError'));
        return;
      }

      setSuccess(data.message);
      setEmail('');
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(t('forgotPasswordError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
        {t('forgotPassword')}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('forgotPasswordDescription')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <TextField
        label={t('email')}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        fullWidth
        disabled={isLoading}
      />

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={isLoading}
      >
        {isLoading ? t('sending') : t('sendResetLink')}
      </Button>

      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Link
          component="button"
          onClick={onClose}
          sx={{ cursor: 'pointer' }}
        >
          {t('backToLogin')}
        </Link>
      </Box>
    </Box>
  );
} 