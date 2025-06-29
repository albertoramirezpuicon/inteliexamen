'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Alert,
  Snackbar,
  Breadcrumbs,
  Link,
  CircularProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { 
  Save, 
  ArrowBack,
  Psychology
} from '@mui/icons-material';
import Navbar from '@/components/layout/Navbar';

interface User {
  id: number;
  email: string;
  given_name: string;
  family_name: string;
  role: string;
  institution_id: number | null;
  institution_name: string | null;
}

interface Skill {
  id: number;
  name: string;
  description: string;
  institution_id: number;
  institution_name: string;
}

interface SkillLevel {
  id?: number;
  order: number;
  label: string;
  description: string;
}

interface LevelSetting {
  id: number;
  order: number;
  label: string;
  description: string;
}

export default function TeacherSkillLevelsPage() {
  const router = useRouter();
  const params = useParams();
  const skillId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [skill, setSkill] = useState<Skill | null>(null);
  const [levelSettings, setLevelSettings] = useState<LevelSetting[]>([]);
  const [skillLevels, setSkillLevels] = useState<SkillLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('Fetching user data from localStorage...');
        const storedUser = localStorage.getItem('user');
        console.log('Raw stored user data:', storedUser);
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          console.log('Parsed user data:', userData);
          console.log('User institution ID:', userData.institution_id);
          setUser(userData);
        } else {
          console.log('No user data found in localStorage, redirecting to login');
          router.push('/teacher/login');
          return;
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/teacher/login');
      }
    };

    const initializeData = async () => {
      await fetchUserData();
    };

    initializeData();
  }, [router]);

  // Fetch skill levels after user data is loaded
  useEffect(() => {
    console.log('useEffect triggered - user state:', user);
    if (user && skillId) {
      console.log('User and skillId are available, calling fetchSkillLevels');
      fetchSkillLevels();
    } else {
      console.log('User or skillId is not available yet');
    }
  }, [user, skillId]);

  const fetchSkillLevels = async () => {
    try {
      console.log('Fetching skill levels for skill:', skillId);
      console.log('User institution ID:', user?.institution_id);
      
      if (!user?.institution_id) {
        console.error('No institution ID found for user');
        setError('User institution not found');
        return;
      }

      setLoading(true);
      const response = await fetch(`/api/teacher/skills/${skillId}/levels`, {
        headers: {
          'x-institution-id': user.institution_id.toString()
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch skill levels');
      }
      
      const data = await response.json();
      console.log('Skill levels data:', data);
      
      setSkill(data.skill);
      setLevelSettings(data.levelSettings);
      
      // Initialize skill levels with template if none exist
      if (data.skillLevels.length === 0) {
        const templateLevels = data.levelSettings.map((setting: LevelSetting) => ({
          order: setting.order,
          label: setting.label,
          description: ''
        }));
        setSkillLevels(templateLevels);
      } else {
        setSkillLevels(data.skillLevels);
      }
    } catch (error) {
      setError('Failed to fetch skill levels');
      console.error('Error fetching skill levels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!user?.institution_id) {
        setError('User institution not found');
        return;
      }

      setSaving(true);
      
      const response = await fetch(`/api/teacher/skills/${skillId}/levels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-institution-id': user.institution_id.toString()
        },
        body: JSON.stringify({
          levels: skillLevels
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save skill levels');
      }

      const data = await response.json();
      setSnackbar({
        open: true,
        message: data.message || 'Skill levels saved successfully',
        severity: 'success'
      });

      // Refresh the data
      fetchSkillLevels();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save skill levels',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLevelChange = (index: number, field: 'description', value: string) => {
    const updatedLevels = [...skillLevels];
    updatedLevels[index] = { ...updatedLevels[index], [field]: value };
    setSkillLevels(updatedLevels);
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return `${user.given_name} ${user.family_name}`.trim() || user.email;
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
        <Navbar userType="teacher" userName={getUserDisplayName()} />
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
        <Navbar userType="teacher" userName={getUserDisplayName()} />
        <Box sx={{ p: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Box>
    );
  }

  if (!skill) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
        <Navbar userType="teacher" userName={getUserDisplayName()} />
        <Box sx={{ p: 3 }}>
          <Alert severity="error">Skill not found</Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="teacher" userName={getUserDisplayName()} />
      
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href="/teacher/dashboard" color="inherit" underline="hover">
            Dashboard
          </Link>
          <Link href="/teacher/skills" color="inherit" underline="hover">
            Skills
          </Link>
          <Typography color="text.primary">Skill Levels</Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.push('/teacher/skills')}
            sx={{ mr: 2 }}
          >
            Back to Skills
          </Button>
        </Box>

        {/* Skill Info Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Psychology sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h5" component="h1">
                {skill.name}
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              {skill.description}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Institution: {skill.institution_name}
            </Typography>
          </CardContent>
        </Card>

        <Typography variant="h6" gutterBottom>
          Skill Levels
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Define the proficiency levels for this skill. Each level should have a clear description of what students should be able to demonstrate.
        </Typography>

        {/* Skill Levels Table */}
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="10%">Level</TableCell>
                <TableCell width="20%">Label</TableCell>
                <TableCell width="70%">Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {skillLevels.map((level, index) => (
                <TableRow key={level.order}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {level.order}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {level.label}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      value={level.description}
                      onChange={(e) => handleLevelChange(index, 'description', e.target.value)}
                      placeholder={`Describe what students should demonstrate at ${level.label} level...`}
                      variant="outlined"
                      size="small"
                      required
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Save Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            onClick={handleSave}
            disabled={saving}
            size="large"
          >
            {saving ? 'Saving...' : 'Save Skill Levels'}
          </Button>
        </Box>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 