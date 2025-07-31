'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { 
  Save, 
  ArrowBack,
  Psychology,
  AutoAwesome,
  InfoOutlined,
  Close,
  HelpOutline
} from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
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
  standard?: number;
}

interface LevelSetting {
  id: number;
  order: number;
  label: string;
  description: string;
}

export default function TeacherSkillLevelsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('teacher');
  const tSkillLevels = useTranslations('skillLevels');
  
  const [user, setUser] = useState<User | null>(null);
  const [skill, setSkill] = useState<Skill | null>(null);
  const [levelSettings, setLevelSettings] = useState<LevelSetting[]>([]);
  const [skillLevels, setSkillLevels] = useState<SkillLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI assistance states
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const [showInfo, setShowInfo] = useState(true);

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
          router.push(`/${locale}/teacher/login`);
          return;
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push(`/${locale}/teacher/login`);
      }
    };

    const initializeData = async () => {
      await fetchUserData();
    };

    initializeData();
  }, [router, locale]);

  // Fetch skill levels after user data is loaded
  useEffect(() => {
    console.log('useEffect triggered - user state:', user);
    if (user) {
      console.log('User is available, calling fetchSkillLevels');
      fetchSkillLevels();
    } else {
      console.log('User is not available yet');
    }
  }, [user]);

  const fetchSkillLevels = async () => {
    try {
      const { id } = await params;
      console.log('Fetching skill levels for skill:', id);
      console.log('User institution ID:', user?.institution_id);
      
      if (!user?.institution_id) {
        console.error('No institution ID found for user');
        setError('User institution not found');
        return;
      }

      setLoading(true);
      const response = await fetch(`/api/teacher/skills/${id}/levels`, {
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
          description: '',
          standard: 0
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
      const { id } = await params;
      
      if (!user?.institution_id) {
        setError('User institution not found');
        return;
      }

      // Validate that at least one level is marked as standard
      if (!validateStandardLevel()) {
        return;
      }

      setSaving(true);
      
      const response = await fetch(`/api/teacher/skills/${id}/levels`, {
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

      // Redirect to skills page after successful save
      setTimeout(() => {
        router.push(`/${locale}/teacher/skills`);
      }, 1500);
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

  const handleLevelChange = (index: number, field: 'description' | 'standard', value: string | number) => {
    const updatedLevels = [...skillLevels];
    updatedLevels[index] = { ...updatedLevels[index], [field]: value };
    setSkillLevels(updatedLevels);
  };

  const handleStandardChange = (index: number, checked: boolean) => {
    const updatedLevels = [...skillLevels];
    // Set all levels to 0 first
    updatedLevels.forEach(level => level.standard = 0);
    // Set the selected level to 1 if checked
    updatedLevels[index].standard = checked ? 1 : 0;
    setSkillLevels(updatedLevels);
  };

  // Ensure at least one level is marked as standard
  const validateStandardLevel = () => {
    const hasStandard = skillLevels.some(level => level.standard === 1);
    if (!hasStandard) {
      setSnackbar({
        open: true,
        message: 'Please mark at least one level as the standard level',
        severity: 'error'
      });
      return false;
    }
    return true;
  };

  const handleGenerateWithAI = async () => {
    try {
      setAiLoading(true);
      setAiError(null);
      setAiSuggestions([]);

      const response = await fetch('/api/ai/skill-levels-suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          skillName: skill?.name,
          skillDescription: skill?.description,
          levelSettings: levelSettings,
          language: locale
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate suggestions');
      }

      const data = await response.json();
      setAiSuggestions(data.suggestions);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Failed to generate suggestions');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAISuggestions = () => {
    if (aiSuggestions.length === skillLevels.length) {
      const updatedLevels = skillLevels.map((level, index) => ({
        ...level,
        description: aiSuggestions[index]
      }));
      setSkillLevels(updatedLevels);
      setAiDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'AI suggestions applied successfully',
        severity: 'success'
      });
    }
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return `${user.given_name} ${user.family_name}`.trim() || user.email;
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
        <Navbar userType="teacher" userName={getUserDisplayName()} />
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
        <Navbar userType="teacher" userName={getUserDisplayName()} />
        <Box sx={{ p: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Box>
    );
  }

  if (!skill) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
        <Navbar userType="teacher" userName={getUserDisplayName()} />
        <Box sx={{ p: 3 }}>
          <Alert severity="error">Skill not found</Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Navbar userType="teacher" userName={getUserDisplayName()} />
      
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link
            color="inherit"
            href={`/${locale}/teacher/dashboard`}
            sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
          >
            {t('dashboard')}
          </Link>
          <Link
            color="inherit"
            href={`/${locale}/teacher/skills`}
            sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
          >
            {t('skills.title')}
          </Link>
          <Typography color="text.primary">Skill Levels</Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.push(`/${locale}/teacher/skills`)}
            sx={{ mr: 2 }}
          >
            {tSkillLevels('backToSkills')}
          </Button>
        </Box>

        {/* Info Box for Skill Levels */}
        {showInfo ? (
          <Box
            sx={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: 1,
              p: 2,
              mb: 3,
              position: 'relative'
            }}
          >
            <IconButton
              size="small"
              onClick={() => setShowInfo(false)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                color: 'text.secondary'
              }}
            >
              <HelpOutline />
            </IconButton>
            <Typography variant="h6" sx={{ mb: 1, pr: 4 }}>
              {tSkillLevels('whatIsSkillLevel')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tSkillLevels('skillLevelExplanation')}
            </Typography>
            <Button
              size="small"
              onClick={() => setShowInfo(false)}
              sx={{ mt: 1 }}
            >
              {tSkillLevels('hideInfo')}
            </Button>
          </Box>
        ) : (
          <Button
            size="small"
            startIcon={<HelpOutline />}
            onClick={() => setShowInfo(true)}
            sx={{ mb: 3 }}
          >
            {tSkillLevels('showInfo')}
          </Button>
        )}

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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Skill Levels
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              Define the proficiency levels for this skill. Each level should have a clear description of what students should be able to demonstrate.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              <strong>Standard Level:</strong> Mark one level as the "standard" - this is the target level that feedback should guide students toward.
            </Typography>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<AutoAwesome />}
            onClick={() => setAiDialogOpen(true)}
            sx={{ ml: 2 }}
          >
            Generate with AI
          </Button>
        </Box>

        {/* Skill Levels Table */}
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="8%">Level</TableCell>
                <TableCell width="82%">Skill Level Details</TableCell>
                <TableCell width="10%">Standard</TableCell>
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
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight="medium" gutterBottom>
                        {level.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        {levelSettings[index]?.description || 'No template description available'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Your Description:</strong>
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={level.description}
                        onChange={(e) => handleLevelChange(index, 'description', e.target.value)}
                        placeholder={`Describe what students should demonstrate at ${level.label} level...`}
                        variant="outlined"
                        size="small"
                        required
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={level.standard === 1}
                          onChange={(e) => handleStandardChange(index, e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2">Standard</Typography>
                          {level.standard === 1 && (
                            <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>
                              Target Level
                            </Typography>
                          )}
                        </Box>
                      }
                      labelPlacement="top"
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

      {/* AI Generation Dialog */}
      <Dialog open={aiDialogOpen} onClose={() => setAiDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Generate Skill Level Descriptions with AI
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            AI will generate comprehensive descriptions for all skill levels based on the skill information. 
            You can review and apply the suggestions to your skill levels.
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Button
              variant="contained"
              startIcon={aiLoading ? <CircularProgress size={20} /> : <AutoAwesome />}
              onClick={handleGenerateWithAI}
              disabled={aiLoading}
              size="large"
            >
              {aiLoading ? 'Generating...' : 'Generate Descriptions'}
            </Button>
          </Box>

          {aiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {aiError}
            </Alert>
          )}

          {aiSuggestions.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Generated Descriptions
              </Typography>
              {aiSuggestions.map((suggestion, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Level {index + 1}: {skillLevels[index]?.label}
                  </Typography>
                  <Typography variant="body2">
                    {suggestion}
                  </Typography>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAiDialogOpen(false)}>
            Cancel
          </Button>
          {aiSuggestions.length > 0 && (
            <Button 
              onClick={handleApplyAISuggestions} 
              variant="contained"
              disabled={aiSuggestions.length !== skillLevels.length}
            >
              Apply Suggestions
            </Button>
          )}
        </DialogActions>
      </Dialog>

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