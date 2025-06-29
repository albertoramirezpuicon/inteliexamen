'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  Divider,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { ArrowBack, Save, Psychology, AutoAwesome } from '@mui/icons-material';
import Navbar from '@/components/layout/Navbar';

interface SkillLevel {
  id?: number;
  order: number;
  label: string;
  description: string;
}

interface Skill {
  id: string;
  name: string;
  institution_id: number;
  institution_name: string;
  description: string;
}

interface LevelSetting {
  id: number;
  order: number;
  label: string;
  description: string;
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
];

export default function SkillLevelsPage() {
  const params = useParams();
  const router = useRouter();
  const skillId = params.id as string;

  const [skill, setSkill] = useState<Skill | null>(null);
  const [levelSettings, setLevelSettings] = useState<LevelSetting[]>([]);
  const [skillLevels, setSkillLevels] = useState<SkillLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [outputLanguage, setOutputLanguage] = useState('es');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSkillLevels();
  }, [skillId]);

  const fetchSkillLevels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/skills/${skillId}/levels`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch skill levels');
      }

      setSkill(data.skill);
      setLevelSettings(data.levelSettings);
      
      // Initialize skill levels from template if none exist
      if (data.skillLevels.length === 0) {
        const initialLevels = data.levelSettings.map((setting: LevelSetting) => ({
          order: setting.order,
          label: setting.label,
          description: ''
        }));
        setSkillLevels(initialLevels);
      } else {
        setSkillLevels(data.skillLevels);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLevelChange = (index: number, field: 'description', value: string) => {
    const updatedLevels = [...skillLevels];
    updatedLevels[index] = { ...updatedLevels[index], [field]: value };
    setSkillLevels(updatedLevels);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validate all descriptions are filled
      const emptyDescriptions = skillLevels.filter(level => !level.description.trim());
      if (emptyDescriptions.length > 0) {
        setError('All level descriptions are required');
        return;
      }

      const response = await fetch(`/api/admin/skills/${skillId}/levels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levels: skillLevels })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save skill levels');
      }

      setSuccess('Skill levels saved successfully');
      setSkillLevels(data.skillLevels);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/admin/skills');
  };

  const generateAILevels = async () => {
    try {
      setAiLoading(true);
      setError(null);
      
      const response = await fetch('/api/ai/skill-levels-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillName: skill?.name,
          skillDescription: skill?.description,
          levelSettings: levelSettings,
          language: outputLanguage
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate AI suggestions');
      }

      // Update skill levels with AI suggestions
      const updatedLevels = skillLevels.map((level, index) => ({
        ...level,
        description: data.suggestions[index] || ''
      }));
      
      setSkillLevels(updatedLevels);
      setSuccess('AI suggestions generated successfully! You can now review and edit them.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !skill) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={handleBack} startIcon={<ArrowBack />}>
          Back to Skills
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'grey.50' }}>
      <Navbar />
      <Box sx={{ p: 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link href="/admin/dashboard" color="inherit" underline="hover">
            Dashboard
          </Link>
          <Link href="/admin/skills" color="inherit" underline="hover">
            Skills
          </Link>
          <Typography color="text.primary">Skill Levels</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 1 }}>
              Skill Levels: {skill?.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic', backgroundColor: 'primary.50', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
              <strong>Skill Description:</strong> {skill?.description}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Institution: {skill?.institution_name}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={handleBack}
            startIcon={<ArrowBack />}
          >
            Back to Skills
          </Button>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Info Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Psychology sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Level Template</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              This skill must have {levelSettings.length} levels as defined by your institution. 
              Please provide specific descriptions for each level based on the skill "{skill?.name}".
            </Typography>
          </CardContent>
        </Card>

        {/* Skill Levels Form */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Define Skill Levels
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="language-label">Language</InputLabel>
                <Select
                  labelId="language-label"
                  value={outputLanguage}
                  label="Language"
                  onChange={(e) => setOutputLanguage(e.target.value)}
                  disabled={aiLoading}
                >
                  {LANGUAGES.map(lang => (
                    <MenuItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                color="secondary"
                onClick={generateAILevels}
                disabled={aiLoading || !skill}
                startIcon={aiLoading ? <CircularProgress size={18} /> : <AutoAwesome />}
              >
                {aiLoading ? 'Generating suggestions...' : 'Get AI suggestions for all levels'}
              </Button>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {skillLevels.map((level, index) => (
              <Card key={index} variant="outlined" sx={{ minHeight: 280 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>
                      Level {level.order}: {level.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', backgroundColor: 'grey.50', p: 1, borderRadius: 1 }}>
                      Template: {levelSettings[index]?.description}
                    </Typography>
                  </Box>
                  
                  <TextField
                    label="Level Description"
                    value={level.description}
                    onChange={(e) => handleLevelChange(index, 'description', e.target.value)}
                    multiline
                    rows={8}
                    fullWidth
                    required
                    placeholder={`Describe what a student at ${level.label} level should demonstrate for this skill...`}
                    inputProps={{ maxLength: 1024 }}
                    helperText={`${level.description.length}/1024 characters`}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        minHeight: 200,
                        alignItems: 'flex-start'
                      }
                    }}
                  />
                </CardContent>
              </Card>
            ))}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
              size="large"
            >
              {saving ? 'Saving...' : 'Save Skill Levels'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
} 