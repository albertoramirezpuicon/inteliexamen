'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider,
  Chip,
  IconButton,
  Checkbox
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Save as SaveIcon,
  AutoAwesome as AIIcon,
  ArrowBack as BackIcon,
  HelpOutline
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import CaseSectionEditor from '@/components/teacher/CaseSectionEditor';

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
  domain_name?: string;
}

interface Group {
  id: number;
  name: string;
  description: string;
  institution_id: number;
  member_count: number;
}

interface Source {
  id: number;
  title: string;
  authors: string;
  publication_year: number;
  pdf_processing_status: string;
  is_custom: boolean;
}

interface Teacher {
  id: number;
  given_name: string;
  family_name: string;
  institution_id: number;
  role: string;
}

const steps = ['basicInformation', 'skillSelection', 'assessmentDetails', 'caseGeneration', 'caseSolution', 'preview'];

export default function AssessmentForm({ 
  userType, 
  currentUserId, 
  currentInstitutionId, 
  assessmentId 
}: AssessmentFormProps) {
  const router = useRouter();
  const t = useTranslations('teacher.assessmentForm');
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    institution_id: currentInstitutionId?.toString() || '',
    teacher_id: currentUserId?.toString() || '',
    show_teacher_name: false,
    integrity_protection: true,
    name: '',
    description: '',
    difficulty_level: '',
    educational_level: '',
    output_language: 'es',
    evaluation_context: '',
    case_text: '',
    case_solution: '',
    case_sections: null as any,
    case_navigation_enabled: false,
    case_sections_metadata: null as any,
    questions_per_skill: 5,
    available_from: new Date().toISOString().slice(0, 16),
    available_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    dispute_period: 7,
    status: 'Active',
    selected_skills: [] as number[],
    selected_groups: [] as number[]
  });

  // Data for dropdowns
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  
  // Sources data
  const [sourcesBySkill, setSourcesBySkill] = useState<Record<number, Source[]>>({});
  const [selectedSources, setSelectedSources] = useState<Record<number, number[]>>({});

  // Case generation
  const [generatingCase, setGeneratingCase] = useState(false);
  const [generatingSolution, setGeneratingSolution] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);

  // Info box state
  const [showAssessmentInfo, setShowAssessmentInfo] = useState(false);

  // Load initial data
  // Move this useEffect after the function declarations

  const loadInitialData = useCallback(async () => {
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
          
          // Load domains and skills for teacher's institution
          await loadDomains(user.institution_id);
          await loadAllSkills(user.institution_id);
          await loadGroups(user.institution_id);
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
    } catch {
      setError(t('failedToLoadInitialData'));
    }
  }, [userType]);

  const loadAssessment = useCallback(async () => {
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
          throw new Error(t('failedToLoadInitialData'));
        }
      } else {
        apiUrl = `/api/admin/assessments/${assessmentId}`;
      }
      
      const response = await fetch(apiUrl);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response not OK:', response.status, errorText);
        throw new Error(`${t('failedToLoadAssessment')}: ${response.status}`);
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
        integrity_protection: assessment.integrity_protection === 1,
        name: assessment.name || '',
        description: assessment.description || '',
        difficulty_level: assessment.difficulty_level || '',
        educational_level: assessment.educational_level || '',
        output_language: assessment.output_language || 'es',
        evaluation_context: assessment.evaluation_context || '',
        case_text: assessment.case_text || '',
        case_sections: assessment.case_sections || null,
        case_navigation_enabled: assessment.case_navigation_enabled === 1,
        case_sections_metadata: assessment.case_sections_metadata || null,
        questions_per_skill: assessment.questions_per_skill || 5,
        available_from: assessment.available_from ? assessment.available_from.slice(0, 16) : new Date().toISOString().slice(0, 16),
        available_until: assessment.available_until ? assessment.available_until.slice(0, 16) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        dispute_period: assessment.dispute_period || 7,
        status: assessment.status || 'Active',
        selected_skills: assessment.selected_skills || [],
        selected_groups: assessment.selected_groups || []
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
          domain_id: assessment.domain_id,
          domain_name: assessment.domain_name
        });
      }
    } catch (err) {
      console.error('Error in loadAssessment:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  }, [assessmentId, userType]);

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

  const loadAllSkills = async (institutionId: number) => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const response = await fetch(`/api/teacher/skills?institution_id=${institutionId}`, {
          headers: {
            'x-institution-id': user.institution_id.toString()
          }
        });
        if (response.ok) {
          const data = await response.json();
          setSkills(data.skills);
        }
      }
    } catch (error) {
      console.error('Error loading all skills:', error);
    }
  };

  const loadGroups = async (institutionId: number) => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const response = await fetch('/api/teacher/groups', {
          headers: {
            'x-institution-id': user.institution_id.toString()
          }
        });
        if (response.ok) {
          const data = await response.json();
          setGroups(data.groups);
        }
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadSourcesForSkill = async (skillId: number) => {
    try {
      console.log('Loading sources for skill:', skillId);
      
      // Use different API endpoints based on user type
      let apiUrl = '';
      let headers: HeadersInit = {};
      
      if (userType === 'teacher') {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          apiUrl = `/api/teacher/skills/${skillId}/sources`;
          headers = {
            'x-user-id': user.id.toString()
          };
        }
      } else {
        apiUrl = `/api/admin/skills/${skillId}/sources`;
      }
      
      const response = await fetch(apiUrl, { headers });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Sources loaded for skill', skillId, ':', data.sources.length);
        setSourcesBySkill(prev => ({
          ...prev,
          [skillId]: data.sources
        }));
      } else {
        console.error('Failed to load sources for skill:', skillId, response.status);
      }
    } catch (error) {
      console.error('Error loading sources for skill:', skillId, error);
    }
  };

  // Load initial data
  useEffect(() => {
    loadInitialData();
    if (assessmentId) {
      loadAssessment();
    }
  }, [assessmentId, loadInitialData, loadAssessment]);

  // Load sources when skills are selected
  useEffect(() => {
    formData.selected_skills.forEach(skillId => {
      if (!sourcesBySkill[skillId]) {
        loadSourcesForSkill(skillId);
      }
    });
  }, [formData.selected_skills]);

  const handleInstitutionChange = async (institutionId: number) => {
    setFormData(prev => ({ ...prev, institution_id: institutionId.toString(), selected_skills: [], selected_groups: [] }));
    setDomains([]);
    setSkills([]);
    setSelectedDomain(null);
    setSelectedSkill(null);
    
    if (institutionId) {
      await loadDomains(institutionId);
    }
  };

  const handleDomainChange = async (domainId: number) => {
    setFormData(prev => ({ ...prev, selected_skills: [], selected_groups: [] }));
    setSkills([]);
    setSelectedSkill(null);
    
    if (domainId) {
      await loadSkills(domainId);
      const domain = domains.find(d => d.id === domainId);
      setSelectedDomain(domain || null);
    }
  };

  const handleSkillChange = (skillId: number) => {
    setFormData(prev => ({ ...prev, selected_skills: [skillId], selected_groups: [] }));
    const skill = skills.find(s => s.id === skillId);
    setSelectedSkill(skill || null);
  };

  const handleSkillToggle = (skillId: number) => {
    setFormData(prev => {
      const currentSkills = prev.selected_skills;
      const isSelected = currentSkills.includes(skillId);
      
      if (isSelected) {
        // Remove skill
        return { ...prev, selected_skills: currentSkills.filter(id => id !== skillId) };
      } else {
        // Add skill (max 4)
        if (currentSkills.length >= 4) {
          setError(t('maxSkillsReached'));
          return prev;
        }
        setError(null);
        return { ...prev, selected_skills: [...currentSkills, skillId] };
      }
    });
  };

  const handleGroupToggle = (groupId: number) => {
    setFormData(prev => {
      const currentGroups = prev.selected_groups;
      const isSelected = currentGroups.includes(groupId);
      
      if (isSelected) {
        // Remove group
        return { ...prev, selected_groups: currentGroups.filter(id => id !== groupId) };
      } else {
        // Add group
        return { ...prev, selected_groups: [...currentGroups, groupId] };
      }
    });
  };

  const handleSourceToggle = (skillId: number, sourceId: number) => {
    setSelectedSources(prev => {
      const currentSources = prev[skillId] || [];
      const isSelected = currentSources.includes(sourceId);
      
      if (isSelected) {
        // Remove source
        return {
          ...prev,
          [skillId]: currentSources.filter(id => id !== sourceId)
        };
      } else {
        // Add source
        return {
          ...prev,
          [skillId]: [...currentSources, sourceId]
        };
      }
    });
  };

  // Check if any sources are selected for enhanced generation
  const hasSelectedSources = Object.values(selectedSources).some(sources => sources.length > 0);

  const generateCase = async () => {
    if (formData.selected_skills.length === 0) {
      setError(t('pleaseSelectSkills'));
      return;
    }

    // Check if sources are selected for each skill
    const skillsWithoutSources = formData.selected_skills.filter(skillId => {
      const selectedSourcesForSkill = selectedSources[skillId] || [];
      return selectedSourcesForSkill.length === 0;
    });

    if (skillsWithoutSources.length > 0) {
      const skillNames = skillsWithoutSources.map(skillId => {
        const skill = skills.find(s => s.id === skillId);
        return skill?.name || 'Unknown Skill';
      });
      setError(`Please select at least one source for each skill: ${skillNames.join(', ')}`);
      return;
    }

    try {
      setGeneratingCase(true);
      setError(null);

      // Prepare skills data with their selected sources
      const skillsWithSources = formData.selected_skills.map(skillId => {
        const skill = skills.find(s => s.id === skillId);
        const domain = domains.find(d => d.id === skill?.domain_id);
        const selectedSourcesForSkill = selectedSources[skillId] || [];
        const sourcesData = selectedSourcesForSkill.map(sourceId => {
          const source = sourcesBySkill[skillId]?.find(s => s.id === sourceId);
          return {
            id: sourceId,
            title: source?.title || '',
            authors: source?.authors || '',
            publication_year: source?.publication_year || 0
          };
        });

        return {
          id: skillId,
          name: skill?.name || '',
          description: skill?.description || '',
          domainName: domain?.name || '',
          selectedSources: sourcesData
        };
      });

      const response = await fetch('/api/ai/generate-case-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentDescription: formData.description,
          difficultyLevel: formData.difficulty_level,
          educationalLevel: formData.educational_level,
          outputLanguage: formData.output_language,
          evaluationContext: formData.evaluation_context,
          selectedSkills: skillsWithSources
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('failedToGenerateCase'));
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, case_text: data.caseText }));
      setSuccess(t('caseGeneratedSuccessfully'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToGenerateCase'));
    } finally {
      setGeneratingCase(false);
    }
  };

  const generateCaseSolution = async () => {
    if (!formData.case_text) {
      setError('Please generate a case first');
      return;
    }

    try {
      setGeneratingSolution(true);
      setError(null);

      // Prepare skills data with their selected sources
      const skillsWithSources = formData.selected_skills.map(skillId => {
        const skill = skills.find(s => s.id === skillId);
        const domain = domains.find(d => d.id === skill?.domain_id);
        const selectedSourcesForSkill = selectedSources[skillId] || [];
        const sourcesData = selectedSourcesForSkill.map(sourceId => {
          const source = sourcesBySkill[skillId]?.find(s => s.id === sourceId);
          return {
            id: sourceId,
            title: source?.title || '',
            authors: source?.authors || '',
            publication_year: source?.publication_year || 0
          };
        });

        return {
          id: skillId,
          name: skill?.name || '',
          description: skill?.description || '',
          domainName: domain?.name || '',
          selectedSources: sourcesData
        };
      });

      const response = await fetch('/api/ai/generate-case-solution-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseText: formData.case_text,
          assessmentDescription: formData.description,
          difficultyLevel: formData.difficulty_level,
          educationalLevel: formData.educational_level,
          outputLanguage: formData.output_language,
          evaluationContext: formData.evaluation_context,
          selectedSkills: skillsWithSources
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate case solution');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, case_solution: data.caseSolution }));
      setSuccess('Case solution generated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate case solution');
    } finally {
      setGeneratingSolution(false);
    }
  };

  const handleSubmit = async (saveAsDraft: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const submitData = {
        ...formData,
        status: saveAsDraft ? 'Inactive' : 'Active',
        selected_sources: selectedSources
      };

      // Debug: Log the data being submitted
      console.log('Submitting assessment data:', {
        case_navigation_enabled: submitData.case_navigation_enabled,
        case_sections: submitData.case_sections,
        case_sections_metadata: submitData.case_sections_metadata,
        hasSections: !!submitData.case_sections,
        sectionsKeys: submitData.case_sections ? Object.keys(submitData.case_sections) : []
      });

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
        return formData.selected_skills.length > 0;
      case 2: // Assessment Details
        return formData.difficulty_level && formData.educational_level && 
               formData.evaluation_context && formData.questions_per_skill > 0;
      case 3: // Case Generation
        // Check if sources are selected for each skill
        const allSkillsHaveSources = formData.selected_skills.every(skillId => {
          const selectedSourcesForSkill = selectedSources[skillId] || [];
          return selectedSourcesForSkill.length > 0;
        });
        return formData.case_text && allSkillsHaveSources;
      case 4: // Case Solution
        return formData.case_solution;
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
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('selectSkillsDescription')}
            </Typography>
            
            {formData.selected_skills.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('selectedSkills')} ({formData.selected_skills.length}/4):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {formData.selected_skills.map(skillId => {
                    const skill = skills.find(s => s.id === skillId);
                    const domain = domains.find(d => d.id === skill?.domain_id);
                    return (
                      <Chip
                        key={skillId}
                        label={`${skill?.name} (${domain?.name})`}
                        onDelete={() => handleSkillToggle(skillId)}
                        color="primary"
                        variant="outlined"
                      />
                    );
                  })}
                </Box>
              </Box>
            )}

            <Grid container spacing={2}>
              {domains.map(domain => {
                const domainSkills = skills.filter(skill => skill.domain_id === domain.id);
                if (domainSkills.length === 0) return null;
                
                return (
                  <Grid size={12} key={domain.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary">
                          {domain.name}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {domainSkills.map(skill => (
                            <FormControlLabel
                              key={skill.id}
                              control={
                                <Switch
                                  checked={formData.selected_skills.includes(skill.id)}
                                  onChange={() => handleSkillToggle(skill.id)}
                                  disabled={!formData.selected_skills.includes(skill.id) && formData.selected_skills.length >= 4}
                                />
                              }
                              label={
                                <Box>
                                  <Typography variant="body1">
                                    {skill.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {skill.description}
                                  </Typography>
                                </Box>
                              }
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
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

            <Grid size={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.integrity_protection}
                    onChange={(e) => setFormData(prev => ({ ...prev, integrity_protection: e.target.checked }))}
                  />
                }
                label={t('integrityProtection')}
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 1 }}>
                {t('integrityProtectionDescription')}
              </Typography>
            </Grid>

            <Grid size={12}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('assignGroupsDescription')}
              </Typography>
              
              {formData.selected_groups.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('selectedGroups')} ({formData.selected_groups.length}):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {formData.selected_groups.map(groupId => {
                      const group = groups.find(g => g.id === groupId);
                      return (
                        <Chip
                          key={groupId}
                          label={`${group?.name} (${group?.member_count} ${t('members')})`}
                          onDelete={() => handleGroupToggle(groupId)}
                          color="secondary"
                          variant="outlined"
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}

              <Grid container spacing={2}>
                {groups.map(group => (
                  <Grid size={12} key={group.id}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.selected_groups.includes(group.id)}
                          onChange={() => handleGroupToggle(group.id)}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1">
                            {group.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {group.description} ({group.member_count} {t('members')})
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={generatingCase ? <CircularProgress size={20} /> : <AIIcon />}
                onClick={generateCase}
                disabled={generatingCase || formData.selected_skills.length === 0}
              >
                {generatingCase ? t('generatingCase') : t('generateCase')}
              </Button>
            </Box>

            {hasSelectedSources && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'success.50', border: 1, borderColor: 'success.200', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ color: 'success.600', mr: 1 }}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </Box>
                  <Typography variant="subtitle2" sx={{ color: 'success.800', fontWeight: 'medium' }}>
                    Source-Aware Generation Enabled
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'success.700' }}>
                  The AI will analyze the actual content of your selected sources to create more accurate and relevant cases.
                </Typography>
              </Box>
            )}

            {formData.selected_skills.length > 0 && (
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('skillsContextForCaseGeneration')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip label={formData.difficulty_level} color="primary" size="small" />
                    <Chip label={formData.educational_level} color="secondary" size="small" />
                    <Chip label={formData.output_language === 'es' ? 'Spanish' : 'English'} size="small" />
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>
                    {t('selectedSkills')} and Sources
                  </Typography>
                  
                  {formData.selected_skills.map(skillId => {
                    const skill = skills.find(s => s.id === skillId);
                    const domain = domains.find(d => d.id === skill?.domain_id);
                    const sourcesForSkill = sourcesBySkill[skillId] || [];
                    const selectedSourcesForSkill = selectedSources[skillId] || [];
                    
                    return (
                      <Box key={skillId} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <Typography variant="subtitle1" gutterBottom color="primary">
                          <strong>{skill?.name}</strong> ({domain?.name})
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {skill?.description}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Select sources for this skill:</strong>
                        </Typography>
                        
                        {sourcesForSkill.length === 0 ? (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            No sources available for this skill. Please add sources in the Sources management page.
                          </Typography>
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {sourcesForSkill.map(source => (
                              <FormControlLabel
                                key={source.id}
                                control={
                                  <Checkbox
                                    checked={selectedSourcesForSkill.includes(source.id)}
                                    onChange={() => handleSourceToggle(skillId, source.id)}
                                    size="small"
                                  />
                                }
                                label={
                                  <Box>
                                    <Typography variant="body2">
                                      {source.title}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {source.authors} ({source.publication_year})
                                    </Typography>
                                  </Box>
                                }
                              />
                            ))}
                          </Box>
                        )}
                        
                        {selectedSourcesForSkill.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="primary">
                              {selectedSourcesForSkill.length} source(s) selected
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            <TextField
              fullWidth
              label={t('caseText')}
              value={formData.case_text}
              onChange={(e) => setFormData(prev => ({ ...prev, case_text: e.target.value }))}
              inputProps={{ maxLength: 8192 }}
              helperText={`${formData.case_text.length}/8192 characters`}
              multiline
              rows={12}
              required
              placeholder="The AI will generate a realistic case scenario here..."
            />



            {/* Case Section Editor */}
            <Box sx={{ mt: 3 }}>
              <CaseSectionEditor
                caseText={formData.case_text}
                caseSections={formData.case_sections || undefined}
                caseNavigationEnabled={formData.case_navigation_enabled}
                onSectionsChange={(sections, metadata) => {
                  console.log('AssessmentForm: onSectionsChange called with:', { sections, metadata });
                  setFormData(prev => ({
                    ...prev,
                    case_sections: sections,
                    case_sections_metadata: metadata
                  }));
                }}
                onNavigationToggle={(enabled) => {
                  console.log('AssessmentForm: onNavigationToggle called with:', enabled);
                  setFormData(prev => ({
                    ...prev,
                    case_navigation_enabled: enabled
                  }));
                }}
                onGenerateQuestions={async () => {
                  if (!formData.case_sections?.context?.content || !formData.case_sections?.main_scenario?.content) {
                    throw new Error('Context and main scenario are required to generate questions');
                  }

                  const selectedSkillsData = formData.selected_skills.map(skillId => {
                    const skill = skills.find(s => s.id === skillId);
                    const domain = domains.find(d => d.id === skill?.domain_id);
                    return {
                      id: skillId,
                      name: skill?.name || '',
                      description: skill?.description || '',
                      domainName: domain?.name || ''
                    };
                  });

                  const response = await fetch('/api/ai/generate-questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      context: formData.case_sections!.context.content,
                      mainScenario: formData.case_sections!.main_scenario.content,
                      skills: selectedSkillsData,
                      difficultyLevel: formData.difficulty_level,
                      educationalLevel: formData.educational_level,
                      outputLanguage: formData.output_language
                    })
                  });

                  if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to generate questions');
                  }

                  const data = await response.json();
                  return data.questions;
                }}
                isGeneratingQuestions={false}
              />
            </Box>
          </Box>
        );

      case 4:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={generatingSolution ? <CircularProgress size={20} /> : <AIIcon />}
                onClick={generateCaseSolution}
                disabled={generatingSolution || !formData.case_text}
              >
                {generatingSolution ? 'Generating Solution...' : 'Generate Case Solution'}
              </Button>
            </Box>

            {hasSelectedSources && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'success.50', border: 1, borderColor: 'success.200', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ color: 'success.600', mr: 1 }}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </Box>
                  <Typography variant="subtitle2" sx={{ color: 'success.800', fontWeight: 'medium' }}>
                    Source-Aware Solution Generation Enabled
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'success.700' }}>
                  The AI will analyze the actual content of your selected sources to create more accurate and comprehensive solutions.
                </Typography>
              </Box>
            )}

            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Case Solution Generation
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  The AI will generate a comprehensive solution to the case, inspired by the selected sources. 
                  You can edit the generated solution before saving.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip label={formData.difficulty_level} color="primary" size="small" />
                  <Chip label={formData.educational_level} color="secondary" size="small" />
                  <Chip label={formData.output_language === 'es' ? 'Spanish' : 'English'} size="small" />
                </Box>
              </CardContent>
            </Card>

            <TextField
              fullWidth
              label="Case Solution"
              value={formData.case_solution}
              onChange={(e) => setFormData(prev => ({ ...prev, case_solution: e.target.value }))}
              inputProps={{ maxLength: 8192 }}
              helperText={`${formData.case_solution.length}/8192 characters`}
              multiline
              rows={15}
              required
              placeholder="The AI will generate a comprehensive solution to the case here..."
            />
          </Box>
        );

      case 5:
        return (
          <Box>
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
                
                <Typography variant="h6" gutterBottom>{t('selectedSkills')}</Typography>
                {formData.selected_skills.map(skillId => {
                  const skill = skills.find(s => s.id === skillId);
                  const domain = domains.find(d => d.id === skill?.domain_id);
                  return (
                    <Box key={skillId} sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {skill?.name} ({domain?.name})
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {skill?.description}
                      </Typography>
                    </Box>
                  );
                })}

                {formData.selected_groups.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>{t('selectedGroups')}</Typography>
                    {formData.selected_groups.map(groupId => {
                      const group = groups.find(g => g.id === groupId);
                      return (
                        <Box key={groupId} sx={{ mb: 1 }}>
                          <Typography variant="body2">
                            <strong>{group?.name}</strong> ({group?.member_count} {t('members')})
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                            {group?.description}
                          </Typography>
                        </Box>
                      );
                    })}
                  </>
                )}

                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>{t('caseText')}</Typography>
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
                
                <Typography variant="h6" gutterBottom>Case Solution</Typography>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'grey.50', 
                  borderRadius: 1,
                  maxHeight: 400,
                  overflow: 'auto'
                }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {formData.case_solution || 'No case solution generated yet.'}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>{t('assessmentDetails')}</Typography>
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
                  <Grid size={{ xs: 6, md: 6 }}>
                    <Typography variant="body2">
                      <strong>{t('integrityProtection')}:</strong> {formData.integrity_protection ? t('enabled') : t('disabled')}
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
          {t('back')}
        </Button>
      </Box>

      {/* Assessment Info Box */}
      {showAssessmentInfo && (
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
            onClick={() => setShowAssessmentInfo(false)}
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
            {t('whatIsAssessment')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('assessmentExplanation')}
          </Typography>
          
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'text.primary' }}>
            {t('assessmentNameImportant')}
          </Typography>
          
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'text.primary' }}>
            {t('evaluationContextImportant')}
          </Typography>
          
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'text.primary' }}>
            {t('fieldExplanations')}
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              • <strong>{t('assessmentName')}:</strong> {t('assessmentNameField')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>{t('description')}:</strong> {t('descriptionField')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>{t('showTeacherName')}:</strong> {t('showTeacherNameField')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>{t('selectSkills')}:</strong> {t('skillSelectionField')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>{t('difficultyLevel')}:</strong> {t('difficultyLevelField')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>{t('educationalLevel')}:</strong> {t('educationalLevelField')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>{t('outputLanguage')}:</strong> {t('outputLanguageField')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>{t('questionsPerSkill')}:</strong> {t('questionsPerSkillField')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>{t('evaluationContext')}:</strong> {t('evaluationContextField')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>{t('availableFrom')}:</strong> {t('availableFromField')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>{t('availableUntil')}:</strong> {t('availableUntilField')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>{t('disputePeriod')}:</strong> {t('disputePeriodField')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>{t('integrityProtection')}:</strong> {t('integrityProtectionField')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>{t('assignGroups')}:</strong> {t('groupAssignmentField')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>{t('generateCase')}:</strong> {t('caseGenerationField')}
            </Typography>
          </Box>
          <Button
            size="small"
            onClick={() => setShowAssessmentInfo(false)}
            sx={{ mt: 1 }}
          >
            {t('hideInfo')}
          </Button>
        </Box>
      )}

      {!showAssessmentInfo && (
        <Button
          size="small"
          startIcon={<HelpOutline />}
          onClick={() => setShowAssessmentInfo(true)}
          sx={{ mb: 3 }}
        >
          {t('showInfo')}
        </Button>
      )}

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{t(label)}</StepLabel>
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
          {t('back')}
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
                {t('saveAsDraft')}
              </Button>
              <Button
                variant="contained"
                onClick={() => handleSubmit(false)}
                disabled={loading}
                startIcon={<SaveIcon />}
              >
                {t('saveAndActivate')}
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              {t('next')}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
} 