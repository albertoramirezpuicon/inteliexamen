'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Breadcrumbs,
  Link
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

interface LimitedAssessmentFormProps {
  assessmentId: number;
  currentUserId?: number;
  currentInstitutionId?: number;
}

interface Assessment {
  id: number;
  name: string;
  description: string;
  difficulty_level: string;
  educational_level: string;
  output_language: string;
  evaluation_context: string;
  case_text: string;
  questions_per_skill: number;
  available_from: string;
  available_until: string;
  dispute_period: number;
  status: string;
  show_teacher_name: boolean;
  integrity_protection: boolean;
  created_at: string;
  institution_name: string;
  teacher_name: string;
  attempt_count: number;
}

export default function LimitedAssessmentForm({ 
  assessmentId, 
  currentUserId, 
  currentInstitutionId 
}: LimitedAssessmentFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('teacher');
  const tCommon = useTranslations('common');
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    show_teacher_name: false,
    integrity_protection: false,
    available_until: '',
    dispute_period: 3,
    status: 'Active'
  });

  // Load assessment data
  useEffect(() => {
    const loadAssessment = async () => {
      try {
        setLoading(true);
        const userData = localStorage.getItem('user');
        if (!userData) {
          throw new Error('User data not found');
        }
        
        const user = JSON.parse(userData);
        const response = await fetch(`/api/teacher/assessments/${assessmentId}?teacher_id=${user.id}&institution_id=${user.institution_id}`);
        
        if (!response.ok) {
          throw new Error('Failed to load assessment');
        }
        
        const data = await response.json();
        const assessmentData = data.assessment;
        setAssessment(assessmentData);
        
        // Initialize form data with current values
        setFormData({
          show_teacher_name: assessmentData.show_teacher_name,
          integrity_protection: assessmentData.integrity_protection,
          available_until: assessmentData.available_until ? new Date(assessmentData.available_until).toISOString().slice(0, 16) : '',
          dispute_period: assessmentData.dispute_period,
          status: assessmentData.status
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assessment');
      } finally {
        setLoading(false);
      }
    };

    if (assessmentId) {
      loadAssessment();
    }
  }, [assessmentId]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('User data not found');
      }
      
      const user = JSON.parse(userData);
      const response = await fetch(`/api/teacher/assessments/${assessmentId}/limited?teacher_id=${user.id}&institution_id=${user.institution_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update assessment');
      }

      const data = await response.json();
      setSuccess(data.message || 'Assessment updated successfully');
      
      // Update local assessment data
      if (assessment) {
        setAssessment({
          ...assessment,
          ...formData
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update assessment');
    } finally {
      setSaving(false);
    }
  };

  const navigateTo = (path: string) => {
    router.push(`/${locale}${path}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!assessment) {
    return (
      <Alert severity="error">
        Assessment not found
      </Alert>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link 
            component="button"
            onClick={() => navigateTo('/teacher/dashboard')}
            color="inherit" 
            underline="hover"
            sx={{ cursor: 'pointer' }}
          >
            {t('dashboard')}
          </Link>
          <Link 
            component="button"
            onClick={() => navigateTo('/teacher/assessments')}
            color="inherit" 
            underline="hover"
            sx={{ cursor: 'pointer' }}
          >
            {t('assessments.title')}
          </Link>
          <Link 
            component="button"
            onClick={() => navigateTo(`/teacher/assessments/${assessment.id}`)}
            color="inherit" 
            underline="hover"
            sx={{ cursor: 'pointer' }}
          >
            {assessment.name}
          </Link>
          <Typography color="text.primary">Limited Edit</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigateTo(`/teacher/assessments/${assessment.id}`)}
          >
            {tCommon('back')}
          </Button>
        </Box>

        <Typography variant="h4" gutterBottom>
          Limited Assessment Edit
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          This assessment has {assessment.attempt_count} attempt(s). Only certain fields can be modified to preserve assessment integrity.
        </Alert>

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

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Assessment Information (Read-only)
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Assessment Name"
                value={assessment.name}
                disabled
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Difficulty Level"
                value={assessment.difficulty_level}
                disabled
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={assessment.description}
                disabled
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Editable Fields
          </Typography>
          
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Available Until"
                value={formData.available_until}
                onChange={(e) => setFormData(prev => ({ ...prev, available_until: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Dispute Period (days)"
                value={formData.dispute_period}
                onChange={(e) => setFormData(prev => ({ ...prev, dispute_period: parseInt(e.target.value) }))}
                inputProps={{ min: 3 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  label="Status"
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.show_teacher_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, show_teacher_name: e.target.checked }))}
                  />
                }
                label="Show teacher name to students"
              />
            </Grid>
            <Grid size={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.integrity_protection}
                    onChange={(e) => setFormData(prev => ({ ...prev, integrity_protection: e.target.checked }))}
                  />
                }
                label="Enable integrity protection"
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
} 