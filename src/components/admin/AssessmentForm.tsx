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
  Grid,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  AutoAwesome as AIIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface AssessmentFormProps {
  userType: 'admin' | 'teacher';
  currentUserId?: number;
  currentInstitutionId?: number;
  assessmentId?: number;
}

interface Institution {
  id: number;
  name: string;
}

interface Domain {
  id: number;
  name: string;
  institution_id: number;
}

interface Skill {
  id: number;
  name: string;
  description: string;
  domain_id: number;
}

interface Teacher {
  id: number;
  given_name: string;
  family_name: string;
  institution_id: number;
  role: string;
}

const steps = ['Basic Information', 'Skill Selection', 'Assessment Details', 'Case Generation', 'Preview'];

export default function AssessmentForm({ 
  userType, 
  currentUserId, 
  currentInstitutionId, 
  assessmentId 
}: AssessmentFormProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    institution_id: currentInstitutionId?.toString() || '',
    teacher_id: currentUserId?.toString() || '',
    show_teacher_name: false,
    name: '',
    description: '',
    difficulty_level: '',
    educational_level: '',
    output_language: 'es',
    evaluation_context: '',
    case_text: '',
    questions_per_skill: 5,
    available_from: new Date().toISOString().slice(0, 16),
    available_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    dispute_period: 7,
    status: 'Active',
    skill_id: ''
  });

  // Data for dropdowns
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Case generation
  const [generatingCase, setGeneratingCase] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
    if (assessmentId) {
      loadAssessment();
    }
  }, [assessmentId]);

  const loadInitialData = async () => {
    try {
      // Load user data for teachers
      if (userType === 'teacher') {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setFormData(prev => ({
            ...prev,
            institution_id: user.institution_id.toString(),
            teacher_id: user.id.toString()
          }));
        }
      }

      // Load institutions (only for admins)
      if (userType === 'admin') {
        const institutionsResponse = await fetch('/api/admin/institutions/list');
        if (institutionsResponse.ok) {
          const data = await institutionsResponse.json();
          setInstitutions(data.institutions);
        }
      }

      // Load teachers (filtered by role) - only for admins
      if (userType === 'admin') {
        const teachersResponse = await fetch('/api/admin/users');
        if (teachersResponse.ok) {
          const data = await teachersResponse.json();
          console.log('All users loaded:', data.users.length);
          
          // Filter teachers by role
          const teacherUsers = data.users.filter((user: { role: string; given_name: string; family_name: string; institution_id: number }) => {
            const isTeacher = user.role === 'teacher';
            if (isTeacher) {
              console.log('Found teacher:', user.given_name, user.family_name, 'from institution:', user.institution_id);
            }
            return isTeacher;
          });
          
          console.log('Total teachers found:', teacherUsers.length);
          setTeachers(teacherUsers);
        }
      }
    } catch (err) {
      setError('Failed to load initial data');
    }
  };

  const loadAssessment = async () => {
    if (!assessmentId) return;

    try {
      setLoading(true);
      console.log('Loading assessment with ID:', assessmentId);
      
      // Use different API endpoints based on user type
      let apiUrl = '';
      if (userType === 'teacher') {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          apiUrl = `/api/teacher/assessments/${assessmentId}?teacher_id=${user.id}&institution_id=${user.institution_id}`;
        } else {
          throw new Error('User data not found');
        }
      } else {
        apiUrl = `/api/admin/assessments/${assessmentId}`;
      }
      
      const response = await fetch(apiUrl);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response not OK:', response.status, errorText);
        throw new Error(`Failed to load assessment: ${response.status}`);
      }

      const data = await response.json();
      console.log('Assessment data received:', data);
      
      const assessment = data.assessment;
      if (!assessment) {
        throw new Error('No assessment data received');
      }

      setFormData({
        institution_id: assessment.institution_id?.toString() || '',
        teacher_id: assessment.teacher_id?.toString() || '',
        show_teacher_name: assessment.show_teacher_name === 1,
        name: assessment.name || '',
        description: assessment.description || '',
        difficulty_level: assessment.difficulty_level || '',
        educational_level: assessment.educational_level || '',
        output_language: assessment.output_language || 'es',
        evaluation_context: assessment.evaluation_context || '',
        case_text: assessment.case_text || '',
        questions_per_skill: assessment.questions_per_skill || 5,
        available_from: assessment.available_from ? assessment.available_from.slice(0, 16) : new Date().toISOString().slice(0, 16),
        available_until: assessment.available_until ? assessment.available_until.slice(0, 16) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        dispute_period: assessment.dispute_period || 7,
        status: assessment.status || 'Active',
        skill_id: assessment.skill_id?.toString() || ''
      });

      // Load related data if institution_id exists
      if (assessment.institution_id) {
        if (userType === 'teacher') {
          // For teachers, always use their own institution ID
          const userData = localStorage.getItem('user');
          if (userData) {
            const user = JSON.parse(userData);
            await loadDomains(user.institution_id);
          }
        } else {
          await loadDomains(assessment.institution_id);
        }
      }
      
      // Load skills if domain_id exists
      if (assessment.domain_id) {
        await loadSkills(assessment.domain_id);
      }
      
      // Set the selected domain and skill from assessment data
      if (assessment.domain_id) {
        setSelectedDomain({
          id: assessment.domain_id,
          name: assessment.domain_name || 'Unknown Domain',
          institution_id: assessment.institution_id
        });
      }
      
      if (assessment.skill_id) {
        setSelectedSkill({
          id: parseInt(assessment.skill_id),
          name: assessment.skill_name || 'Unknown Skill',
          description: assessment.skill_description || '',
          domain_id: assessment.domain_id
        });
      }
    } catch (err) {
      console.error('Error in loadAssessment:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const loadDomains = async (institutionId: number) => {
    try {
      console.log('Loading domains for institution:', institutionId, 'userType:', userType);
      
      // Use different API endpoints based on user type
      let apiUrl = '';
      let headers: HeadersInit = {};
      
      if (userType === 'teacher') {
        apiUrl = '/api/teacher/domains';
        headers = {
          'x-institution-id': institutionId.toString()
        };
        console.log('Teacher API call:', apiUrl, 'headers:', headers);
      } else {
        apiUrl = `/api/admin/domains?institution_id=${institutionId}`;
        console.log('Admin API call:', apiUrl);
      }
      
      const response = await fetch(apiUrl, { headers });
      console.log('Domains API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Domains data received:', data);
        setDomains(data.domains);
        
        // Update selectedDomain if it exists in the loaded domains
        if (selectedDomain) {
          const updatedDomain = data.domains.find((d: Domain) => d.id === selectedDomain.id);
          if (updatedDomain) {
            setSelectedDomain(updatedDomain);
          }
        }
      } else {
        const errorData = await response.json();
        console.error('Domains API error:', errorData);
      }
    } catch (err) {
      console.error('Error loading domains:', err);
    }
  };

  const loadSkills = async (domainId: number) => {
    try {
      // Use different API endpoints based on user type
      let apiUrl = '';
      let headers: HeadersInit = {};
      
      if (userType === 'teacher') {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          apiUrl = `/api/teacher/skills?domain_id=${domainId}`;
          headers = {
            'x-institution-id': user.institution_id.toString()
          };
        } else {
          throw new Error('User data not found');
        }
      } else {
        apiUrl = `/api/admin/skills?domain_id=${domainId}`;
      }
      
      const response = await fetch(apiUrl, { headers });
      if (response.ok) {
        const data = await response.json();
        setSkills(data.skills);
        
        // Update selectedSkill if it exists in the loaded skills
        if (selectedSkill) {
          const updatedSkill = data.skills.find((s: Skill) => s.id === selectedSkill.id);
          if (updatedSkill) {
            setSelectedSkill(updatedSkill);
          }
        }
      }
    } catch (err) {
      console.error('Error loading skills:', err);
    }
  };

  const handleInstitutionChange = async (institutionId: number) => {
    setFormData(prev => ({ ...prev, institution_id: institutionId.toString(), skill_id: '' }));
    setDomains([]);
    setSkills([]);
    setSelectedDomain(null);
    setSelectedSkill(null);
    
    if (institutionId) {
      await loadDomains(institutionId);
    }
  };

  const handleDomainChange = async (domainId: number) => {
    setFormData(prev => ({ ...prev, skill_id: '' }));
    setSkills([]);
    setSelectedSkill(null);
    
    if (domainId) {
      await loadSkills(domainId);
      const domain = domains.find(d => d.id === domainId);
      setSelectedDomain(domain || null);
    }
  };

  const handleSkillChange = (skillId: number) => {
    setFormData(prev => ({ ...prev, skill_id: skillId.toString() }));
    const skill = skills.find(s => s.id === skillId);
    setSelectedSkill(skill || null);
  };

  const generateCase = async () => {
    if (!selectedSkill || !selectedDomain) {
      setError('Please select a skill first');
      return;
    }

    try {
      setGeneratingCase(true);
      setError(null);

      const response = await fetch('/api/ai/generate-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentDescription: formData.description,
          difficultyLevel: formData.difficulty_level,
          educationalLevel: formData.educational_level,
          outputLanguage: formData.output_language,
          evaluationContext: formData.evaluation_context,
          domainName: selectedDomain.name,
          skillName: selectedSkill.name,
          skillDescription: selectedSkill.description
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate case');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, case_text: data.caseText }));
      setSuccess('Case generated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate case');
    } finally {
      setGeneratingCase(false);
    }
  };

  const handleSubmit = async (saveAsDraft: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const submitData = {
        ...formData,
        status: saveAsDraft ? 'Inactive' : 'Active'
      };

      // Use different API endpoints based on user type
      let url = '';
      if (userType === 'teacher') {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          url = assessmentId 
            ? `/api/teacher/assessments/${assessmentId}?teacher_id=${user.id}&institution_id=${user.institution_id}`
            : `/api/teacher/assessments?teacher_id=${user.id}&institution_id=${user.institution_id}`;
        } else {
          throw new Error('User data not found');
        }
      } else {
        url = assessmentId 
          ? `/api/admin/assessments/${assessmentId}`
          : '/api/admin/assessments';
      }
      
      const method = assessmentId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save assessment');
      }

      const data = await response.json();
      setSuccess(data.message);
      
      // Redirect to assessment management after a short delay
      setTimeout(() => {
        if (userType === 'teacher') {
          router.push('/teacher/assessments');
        } else {
          router.push('/admin/assessments');
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0: // Basic Information
        return formData.institution_id && formData.name && formData.description;
      case 1: // Skill Selection
        return formData.skill_id;
      case 2: // Assessment Details
        return formData.difficulty_level && formData.educational_level && 
               formData.evaluation_context && formData.questions_per_skill > 0;
      case 3: // Case Generation
        return formData.case_text;
      default:
        return true;
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Assessment Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                helperText={`${formData.name.length}/45 characters`}
                required
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                helperText={`${formData.description.length}/1024 characters`}
                multiline
                rows={3}
                required
              />
            </Grid>
            
            {userType === 'admin' && (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Institution</InputLabel>
                  <Select
                    value={formData.institution_id}
                    onChange={(e) => handleInstitutionChange(Number(e.target.value))}
                    label="Institution"
                  >
                    {institutions.map((institution) => (
                      <MenuItem key={institution.id} value={institution.id}>
                        {institution.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {userType === 'admin' && (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Teacher</InputLabel>
                  <Select
                    value={formData.teacher_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, teacher_id: e.target.value.toString() }))}
                    label="Teacher"
                    disabled={!formData.institution_id}
                  >
                    {teachers
                      .filter(teacher => !formData.institution_id || teacher.institution_id.toString() === formData.institution_id)
                      .map((teacher) => (
                        <MenuItem key={teacher.id} value={teacher.id}>
                          {teacher.given_name} {teacher.family_name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {userType === 'teacher' && (
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Teacher"
                  value="You (current teacher)"
                  disabled
                  helperText="You can only edit your own assessments"
                />
              </Grid>
            )}

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
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Domain</InputLabel>
                <Select
                  value={selectedDomain?.id || ''}
                  onChange={(e) => handleDomainChange(Number(e.target.value))}
                  label="Domain"
                  disabled={!formData.institution_id}
                >
                  {domains.map((domain) => (
                    <MenuItem key={domain.id} value={domain.id}>
                      {domain.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Skill</InputLabel>
                <Select
                  value={formData.skill_id}
                  onChange={(e) => handleSkillChange(Number(e.target.value))}
                  label="Skill"
                  disabled={!selectedDomain}
                >
                  {skills.map((skill) => (
                    <MenuItem key={skill.id} value={skill.id}>
                      {skill.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {selectedSkill && (
              <Grid size={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Selected Skill: {selectedSkill.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedSkill.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Difficulty Level</InputLabel>
                <Select
                  value={formData.difficulty_level}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty_level: e.target.value }))}
                  label="Difficulty Level"
                >
                  <MenuItem value="Easy">Easy</MenuItem>
                  <MenuItem value="Intermediate">Intermediate</MenuItem>
                  <MenuItem value="Difficult">Difficult</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Educational Level</InputLabel>
                <Select
                  value={formData.educational_level}
                  onChange={(e) => setFormData(prev => ({ ...prev, educational_level: e.target.value }))}
                  label="Educational Level"
                >
                  <MenuItem value="Primary">Primary</MenuItem>
                  <MenuItem value="Secondary">Secondary</MenuItem>
                  <MenuItem value="Technical">Technical</MenuItem>
                  <MenuItem value="University">University</MenuItem>
                  <MenuItem value="Professional">Professional</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Output Language</InputLabel>
                <Select
                  value={formData.output_language}
                  onChange={(e) => setFormData(prev => ({ ...prev, output_language: e.target.value }))}
                  label="Output Language"
                >
                  <MenuItem value="es">Spanish</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Questions per Skill"
                type="number"
                value={formData.questions_per_skill}
                onChange={(e) => setFormData(prev => ({ ...prev, questions_per_skill: parseInt(e.target.value) || 0 }))}
                inputProps={{ min: 1, max: 20 }}
                required
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Evaluation Context"
                value={formData.evaluation_context}
                onChange={(e) => setFormData(prev => ({ ...prev, evaluation_context: e.target.value }))}
                helperText={`${formData.evaluation_context.length}/1024 characters`}
                multiline
                rows={4}
                required
                placeholder="Describe the characteristics of the students, their environment, cultural features that can be relevant to create a case..."
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Available From"
                type="datetime-local"
                value={formData.available_from}
                onChange={(e) => setFormData(prev => ({ ...prev, available_from: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Available Until"
                type="datetime-local"
                value={formData.available_until}
                onChange={(e) => setFormData(prev => ({ ...prev, available_until: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Dispute Period (days)"
                type="number"
                value={formData.dispute_period}
                onChange={(e) => setFormData(prev => ({ ...prev, dispute_period: parseInt(e.target.value) || 0 }))}
                inputProps={{ min: 3, max: 30 }}
                required
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Case Generation</Typography>
              <Button
                variant="contained"
                startIcon={generatingCase ? <CircularProgress size={20} /> : <AIIcon />}
                onClick={generateCase}
                disabled={generatingCase || !selectedSkill}
              >
                {generatingCase ? 'Generating...' : 'Generate Case'}
              </Button>
            </Box>

            {selectedSkill && (
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Skill Context for Case Generation
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Chip label={formData.difficulty_level} color="primary" size="small" />
                    <Chip label={formData.educational_level} color="secondary" size="small" />
                    <Chip label={formData.output_language === 'es' ? 'Spanish' : 'English'} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Skill:</strong> {selectedSkill.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Description:</strong> {selectedSkill.description}
                  </Typography>
                </CardContent>
              </Card>
            )}

            <TextField
              fullWidth
              label="Case Text"
              value={formData.case_text}
              onChange={(e) => setFormData(prev => ({ ...prev, case_text: e.target.value }))}
              inputProps={{ maxLength: 8192 }}
              helperText={`${formData.case_text.length}/8192 characters`}
              multiline
              rows={12}
              required
              placeholder="The AI will generate a realistic case scenario here..."
            />
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Assessment Preview</Typography>
            
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>{formData.name}</Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {formData.description}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip label={formData.difficulty_level} color="primary" />
                  <Chip label={formData.educational_level} color="secondary" />
                  <Chip label={formData.output_language === 'es' ? 'Spanish' : 'English'} />
                </Box>

                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>Skill to Assess</Typography>
                <Typography variant="subtitle1" gutterBottom>{selectedSkill?.name}</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedSkill?.description}
                </Typography>

                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>Case Scenario</Typography>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'grey.50', 
                  borderRadius: 1,
                  maxHeight: 400,
                  overflow: 'auto'
                }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {formData.case_text || 'No case text generated yet.'}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>Assessment Details</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, md: 6 }}>
                    <Typography variant="body2">
                      <strong>Available From:</strong> {new Date(formData.available_from).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 6 }}>
                    <Typography variant="body2">
                      <strong>Available Until:</strong> {new Date(formData.available_until).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 6 }}>
                    <Typography variant="body2">
                      <strong>Questions per Skill:</strong> {formData.questions_per_skill}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 6 }}>
                    <Typography variant="body2">
                      <strong>Dispute Period:</strong> {formData.dispute_period} days
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.back()}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4">
          {assessmentId ? 'Edit Assessment' : 'Create Assessment'}
        </Typography>
      </Box>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Step Content */}
      <Paper sx={{ p: 3, mb: 3 }}>
        {renderStepContent(activeStep)}
      </Paper>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {activeStep === steps.length - 1 ? (
            <>
              <Button
                variant="outlined"
                onClick={() => handleSubmit(true)}
                disabled={loading}
                startIcon={<SaveIcon />}
              >
                Save as Draft
              </Button>
              <Button
                variant="contained"
                onClick={() => handleSubmit(false)}
                disabled={loading}
                startIcon={<SaveIcon />}
              >
                Save and Activate
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
} 