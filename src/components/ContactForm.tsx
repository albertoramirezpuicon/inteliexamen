'use client';

import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { useTranslations } from 'next-intl';

interface FormData {
  name: string;
  email: string;
  company: string;
  message: string;
}

export default function ContactForm() {
  const t = useTranslations('landing.contact');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({
    type: null,
    message: ''
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear status when user starts typing
    if (submitStatus.type) {
      setSubmitStatus({ type: null, message: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setSubmitStatus({
        type: 'error',
        message: t('validation.required')
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSubmitStatus({
        type: 'error',
        message: t('validation.invalidEmail')
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('error.general'));
      }

      setSubmitStatus({
        type: 'success',
        message: t('success.sent')
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        company: '',
        message: ''
      });

    } catch (error) {
      console.error('Contact form error:', error);
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : t('error.general')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper 
      component="form" 
      onSubmit={handleSubmit}
      sx={{ 
        p: { xs: 3, sm: 4 },
        backgroundColor: 'white',
        borderRadius: 3,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}
    >
      {submitStatus.type && (
        <Alert 
          severity={submitStatus.type} 
          sx={{ mb: 3 }}
          onClose={() => setSubmitStatus({ type: null, message: '' })}
        >
          {submitStatus.message}
        </Alert>
      )}

      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 3,
        mb: 3
      }}>
        <TextField
          label={t('form.name')}
          variant="outlined"
          fullWidth
          required
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          disabled={isSubmitting}
          sx={{ gridColumn: { xs: '1', sm: '1' } }}
        />
        
        <TextField
          label={t('form.email')}
          variant="outlined"
          type="email"
          fullWidth
          required
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          disabled={isSubmitting}
          sx={{ gridColumn: { xs: '1', sm: '2' } }}
        />
      </Box>

      <TextField
        label={t('form.company')}
        variant="outlined"
        fullWidth
        value={formData.company}
        onChange={(e) => handleInputChange('company', e.target.value)}
        disabled={isSubmitting}
        sx={{ mb: 3 }}
        helperText={t('form.companyHelper')}
      />

      <TextField
        label={t('form.message')}
        variant="outlined"
        fullWidth
        required
        multiline
        rows={4}
        value={formData.message}
        onChange={(e) => handleInputChange('message', e.target.value)}
        disabled={isSubmitting}
        sx={{ mb: 4 }}
        placeholder={t('form.messagePlaceholder')}
      />

      <Box sx={{ textAlign: 'center' }}>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
          sx={{
            px: { xs: 4, sm: 6 },
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 600,
            borderRadius: 3,
            minWidth: 200,
            '&:disabled': {
              backgroundColor: 'rgba(0, 112, 243, 0.6)',
              color: 'white'
            }
          }}
        >
          {isSubmitting ? t('form.sending') : t('form.send')}
        </Button>
      </Box>

      <Typography 
        variant="body2" 
        sx={{ 
          textAlign: 'center', 
          mt: 3, 
          color: 'text.secondary' 
        }}
      >
        {t('form.privacy')}
      </Typography>
    </Paper>
  );
}
