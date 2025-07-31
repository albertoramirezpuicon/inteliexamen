/**
 * STUDENT ASSESSMENT ATTEMPT PAGE - AI CONVERSATION INTERFACE
 * 
 * PURPOSE: Take an assessment with AI-powered conversation interface and real-time evaluation
 * 
 * CONNECTIONS:
 * - Accessible from /student/assessments/[id] via Start Assessment button
 * - Redirects to /student/assessments/[id]/results upon completion
 * - Creates or continues assessment attempts via API
 * - Manages conversation history and evaluation feedback
 * 
 * KEY FEATURES:
 * - AI conversation interface for assessment participation
 * - Real-time evaluation feedback with three-tier system:
 *   * Incomplete: Identifies missing aspects and asks for more information
 *   * Improvable: Acknowledges complete responses but suggests improvements
 *   * Final: Provides final evaluation with skill level assignments
 * - Skill-level assessment and evaluation
 * - Turn-based conversation limits with automatic final evaluation
 * - Conversation history and progress tracking
 * - Assessment case text and requirements display
 * 
 * NAVIGATION FLOW:
 * - Student starts assessment from assessment details page
 * - AI presents case and begins conversation
 * - Student responds and receives real-time feedback
 * - Conversation continues until final evaluation or turn limit
 * - Automatic redirect to results page upon completion
 * 
 * ASSESSMENT PROCESS:
 * - Loads assessment details and case text
 * - Creates or retrieves existing attempt record
 * - Manages conversation state and turn limits
 * - Provides progressive evaluation feedback
 * - Tracks skill-level assessments
 * - Handles assessment completion and results generation
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  CircularProgress, 
  Alert,
  Card,
  CardContent,
  Divider,
  Chip,
  Avatar,
  IconButton,
  Breadcrumbs,
  Link,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import { 
  Send as SendIcon, 
  ArrowBack as ArrowBackIcon,
  Block as BlockIcon,
  Home as HomeIcon,
  Assessment as AssessmentIcon,
  Help as HelpIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import Navbar from '@/components/layout/Navbar';
import CaseNavigationMenu from '@/components/student/CaseNavigationMenu';
import CaseSectionViewer from '@/components/student/CaseSectionViewer';

interface Assessment {
  id: number;
  name: string;
  description: string;
  case_text: string;
  case_sections?: CaseSections;
  case_navigation_enabled?: number;
  case_sections_metadata?: CaseSectionsMetadata;
  questions_per_skill: number;
  output_language: string;
  show_teacher_name: number;
  integrity_protection: number;
  teacher_given_name?: string;
  teacher_family_name?: string;
  skills: Skill[];
}

interface CaseSections {
  context: CaseSection;
  main_scenario: CaseSection;
  questions: CaseSection;
}

interface CaseSection {
  title: string;
  content: string;
  order: number;
}

interface CaseSectionsMetadata {
  section_order: string[];
  section_titles: Record<string, string>;
  last_updated: string;
}

interface Skill {
  id: number;
  name: string;
  description: string;
  levels: SkillLevel[];
  sources?: Source[];
}

interface Source {
  id: number;
  title: string;
  authors?: string;
  publication_year?: number;
  pdf_s3_key?: string;
  pdf_processing_status?: string;
  pdf_file_size?: number;
  is_custom?: boolean;
  created_at?: string;
}

interface SkillLevel {
  id: number;
  order: number;
  label: string;
  description: string;
}

interface ConversationMessage {
  id: number;
  message_type: 'student' | 'ai';
  message_text: string;
  message_subtype?: 'regular' | 'clarification_question' | 'clarification_response';
  created_at: string;
}

interface Attempt {
  id: number;
  assessment_id: number;
  user_id: number;
  status: 'In_progress' | 'Completed';
  created_at: string;
  completed_at?: string;
}

interface AssessmentResult {
  skill_id: number;
  skill_name: string;
  skill_level_id: number;
  skill_level_label: string;
  skill_level_description: string;
  skill_level_order: number;
  feedback: string;
}

export default function AssessmentAttemptPage() {
  const t = useTranslations('StudentAssessmentAttempt');
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;
  const locale = params.locale as string;
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [studentReply, setStudentReply] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentEvaluationType, setCurrentEvaluationType] = useState<'incomplete' | 'improvable' | 'final' | null>(null);
  const [activeSection, setActiveSection] = useState<string>('context');
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const [skillLevelsExpanded, setSkillLevelsExpanded] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isInitializingRef = useRef(false);

  const loadAssessmentAndStartAttempt = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isInitializingRef.current) {
      console.log('loadAssessmentAndStartAttempt: Already initializing, skipping...');
      return;
    }
    
    console.log('loadAssessmentAndStartAttempt: Starting initialization...');
    try {
      isInitializingRef.current = true;
      setIsLoading(true);
      setError(null);

      // Get user data from localStorage
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Load assessment details
      const assessmentResponse = await fetch(`/api/student/assessments/${assessmentId}?userId=${userId}`);
      if (!assessmentResponse.ok) {
        throw new Error('Failed to load assessment');
      }
      const assessmentData = await assessmentResponse.json();
      setAssessment(assessmentData.assessment);

      // Create or get existing attempt
      const attemptResponse = await fetch(`/api/student/assessments/${assessmentId}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: parseInt(userId) })
      });
      
      if (!attemptResponse.ok) {
        throw new Error('Failed to create attempt');
      }
      
      const attemptData = await attemptResponse.json();
      setAttempt(attemptData.attempt);

      // Load existing conversation if attempt exists
      if (attemptData.attempt.id) {
        await loadConversation(attemptData.attempt.id);
      }

      // Check if attempt is already completed
      if (attemptData.attempt.status === 'Completed') {
        setIsCompleted(true);
        await loadResults(attemptData.attempt.id);
      }

    } catch (err) {
      console.error('Error loading assessment:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assessment');
    } finally {
      console.log('loadAssessmentAndStartAttempt: Initialization completed');
      setIsLoading(false);
      isInitializingRef.current = false;
    }
  }, [assessmentId]);

  useEffect(() => {
    if (assessmentId && !isInitialized && !isInitializingRef.current) {
      setIsInitialized(true);
      loadAssessmentAndStartAttempt();
    }
  }, [assessmentId, isInitialized, loadAssessmentAndStartAttempt]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversation = async (attemptId: number) => {
    try {
      const response = await fetch(`/api/student/attempts/${attemptId}/conversation`);
      if (response.ok) {
        const data = await response.json();
        setConversation(data.conversation);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const loadResults = async (attemptId: number) => {
    try {
      const response = await fetch(`/api/student/attempts/${attemptId}/results`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
      }
    } catch (error) {
      console.error('Error loading results:', error);
    }
  };

  const handleSendReply = async () => {
    if (!studentReply.trim() || !attempt || isSending) return;
    
    // Validate required data
    if (!attempt.id || !assessmentId) {
      console.error('Missing required data:', { attemptId: attempt?.id, assessmentId });
      setError('Missing required data. Please refresh the page and try again.');
      return;
    }

    try {
      setIsSending(true);
      setError(null);

      console.log('Sending message:', { 
        attemptId: attempt.id, 
        message: studentReply.trim(), 
        assessmentId: parseInt(assessmentId) 
      });

      const response = await fetch(`/api/student/attempts/${attempt.id}/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: studentReply.trim(),
          assessmentId: parseInt(assessmentId)
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to send message`);
      }

      const data = await response.json();
      
      // Add student message to conversation
      const newStudentMessage: ConversationMessage = {
        id: Date.now(),
        message_type: 'student',
        message_text: studentReply.trim(),
        created_at: new Date().toISOString()
      };
      
      setConversation(prev => [...prev, newStudentMessage]);
      setStudentReply('');

      // Add AI response to conversation
      if (data.message) {
        const newAIMessage: ConversationMessage = {
          id: Date.now() + 1,
          message_type: 'ai',
          message_text: data.message,
          created_at: new Date().toISOString()
        };
        
        setConversation(prev => [...prev, newAIMessage]);

        // Set evaluation type
        setCurrentEvaluationType(data.evaluationType);
        // Note: All feedback is now included in the main message, so we don't need separate state
        // The UI will parse and display the complete message appropriately

        // Check if assessment is completed
        if (data.attemptCompleted) {
          setIsCompleted(true);
          setAttempt(prev => prev ? { ...prev, status: 'Completed' } : null);
          if (data.skillResults) {
            setResults(data.skillResults);
          }
        }
      }

    } catch (err) {
      console.error('Error sending reply:', err);
      console.error('Error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleSendReply();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Only prevent copy/paste if integrity protection is enabled
    if (assessment?.integrity_protection === 1) {
      // Prevent Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'a')) {
        e.preventDefault();
      }
      // Prevent right-click context menu
      if (e.key === 'ContextMenu') {
        e.preventDefault();
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    // Only prevent context menu if integrity protection is enabled
    if (assessment?.integrity_protection === 1) {
      e.preventDefault();
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Calculate remaining turns (only count student messages)
  const getRemainingTurns = () => {
    if (!assessment) return 0;
    const studentMessages = conversation.filter(msg => msg.message_type === 'student').length;
    const maxTurns = assessment.skills.length * assessment.questions_per_skill;
    return Math.max(0, maxTurns - studentMessages);
  };

  const getMaxTurns = () => {
    if (!assessment) return 0;
    return assessment.skills.length * assessment.questions_per_skill;
  };

  // Calculate color based on skill level performance (red to green gradient)
  const getAssessmentColor = (skillLevelOrder: number, maxLevels: number = 5) => {
    // Ensure skillLevelOrder is a valid number
    const levelOrder = Number(skillLevelOrder) || 1;
    const maxLevel = Number(maxLevels) || 5;
    
    // Calculate percentage (lower order = lower percentage = red, higher order = higher percentage = green)
    const percentage = levelOrder / maxLevel;
    
    console.log('Color calculation details:', {
      skillLevelOrder: levelOrder,
      maxLevels: maxLevel,
      percentage,
      skillLevelOrderType: typeof skillLevelOrder
    });
    
    // Create a smooth gradient from red to green
    if (percentage <= 0.2) return '#ffebee'; // Light red for lowest levels
    if (percentage <= 0.4) return '#ffcdd2'; // Red
    if (percentage <= 0.6) return '#ffb74d'; // Orange
    if (percentage <= 0.8) return '#81c784'; // Light green
    return '#4caf50'; // Green for highest levels
  };

  // Alternative color function based on skill level label
  const getAssessmentColorByLabel = (skillLevelLabel: string) => {
    const label = skillLevelLabel.toLowerCase();
    
    // Map common skill level labels to colors
    if (label.includes('starting') || label.includes('beginner') || label.includes('basic') || label.includes('inicial')) {
      return '#ffebee'; // Light red
    }
    if (label.includes('developing') || label.includes('intermediate') || label.includes('intermedio')) {
      return '#ffcdd2'; // Red
    }
    if (label.includes('proficient') || label.includes('avanzado') || label.includes('competent')) {
      return '#ffb74d'; // Orange
    }
    if (label.includes('advanced') || label.includes('expert') || label.includes('experto')) {
      return '#81c784'; // Light green
    }
    if (label.includes('master') || label.includes('excellent') || label.includes('excelente')) {
      return '#4caf50'; // Green
    }
    
    // Default fallback
    return '#ffebee'; // Light red for unknown levels
  };

  // Get darker border color based on skill level label
  const getAssessmentBorderColor = (skillLevelLabel: string) => {
    const label = skillLevelLabel.toLowerCase();
    
    // Map common skill level labels to darker border colors
    if (label.includes('starting') || label.includes('beginner') || label.includes('basic') || label.includes('inicial')) {
      return '#f44336'; // Darker red
    }
    if (label.includes('developing') || label.includes('intermediate') || label.includes('intermedio')) {
      return '#d32f2f'; // Dark red
    }
    if (label.includes('proficient') || label.includes('avanzado') || label.includes('competent')) {
      return '#f57c00'; // Dark orange
    }
    if (label.includes('advanced') || label.includes('expert') || label.includes('experto')) {
      return '#388e3c'; // Dark green
    }
    if (label.includes('master') || label.includes('excellent') || label.includes('excelente')) {
      return '#2e7d32'; // Darker green
    }
    
    // Default fallback
    return '#f44336'; // Darker red for unknown levels
  };

  // Get appropriate icon based on skill level
  const getAssessmentIcon = (skillLevelLabel: string) => {
    const label = skillLevelLabel.toLowerCase();
    
    if (label.includes('starting') || label.includes('beginner') || label.includes('basic') || label.includes('inicial')) {
      return '🌱'; // Seedling for starting level
    }
    if (label.includes('developing') || label.includes('intermediate') || label.includes('intermedio')) {
      return '🌿'; // Herb for developing level
    }
    if (label.includes('proficient') || label.includes('avanzado') || label.includes('competent')) {
      return '🌳'; // Tree for proficient level
    }
    if (label.includes('advanced') || label.includes('expert') || label.includes('experto')) {
      return '🏆'; // Trophy for advanced level
    }
    if (label.includes('master') || label.includes('excellent') || label.includes('excelente')) {
      return '👑'; // Crown for master level
    }
    
    // Default fallback
    return '🌱'; // Seedling for unknown levels
  };

  // Get the maximum skill level order for color calculation
  const getMaxSkillLevelOrder = () => {
    if (!assessment?.skills) return 5;
    return Math.max(...assessment.skills.flatMap(skill => skill.levels.map(level => level.order)));
  };

  // Translate skill level label based on current locale
  const translateSkillLevelLabel = (label: string) => {
    const labelLower = label.toLowerCase().trim();
    
    // Simple direct mapping approach
    const translations: { [key: string]: string } = {
      // English to Spanish
      'novice': 'Novato',
      'beginner': 'Principiante', 
      'intermediate': 'Intermedio',
      'advanced': 'Avanzado',
      'expert': 'Experto',
      'foundational': 'Fundamental',
      'introductory': 'Introductorio',
      'elementary': 'Elemental',
      'basic': 'Básico',
      'developing': 'En Desarrollo',
      'competent': 'Competente',
      'proficient': 'Competente',
      'skilled': 'Hábil',
      'master': 'Maestro',
      'outstanding': 'Destacado',
      'in progress': 'En Progreso',
      'expected': 'Esperado',
      'excellent': 'Excelente',
      // Spanish to Spanish (in case already in Spanish)
      'novato': 'Novato',
      'principiante': 'Principiante',
      'intermedio': 'Intermedio',
      'avanzado': 'Avanzado',
      'experto': 'Experto',
      'fundamental': 'Fundamental',
      'introductorio': 'Introductorio',
      'elemental': 'Elemental',
      'básico': 'Básico',
      'en desarrollo': 'En Desarrollo',
      'competente': 'Competente',
      'hábil': 'Hábil',
      'maestro': 'Maestro',
      'destacado': 'Destacado',
      'en progreso': 'En Progreso',
      'esperado': 'Esperado',
      'excelente': 'Excelente'
    };
    
    // Check for exact match
    if (translations[labelLower]) {
      return translations[labelLower];
    }
    
    // Check for partial matches
    if (labelLower.includes('novice') || labelLower.includes('starting') || labelLower.includes('basic') || 
        labelLower.includes('foundational') || labelLower.includes('introductory') || labelLower.includes('elementary')) {
      return 'Novato';
    }
    if (labelLower.includes('beginner') || labelLower.includes('inicial') || labelLower.includes('básico') || 
        labelLower.includes('principiante') || labelLower.includes('inicio') || labelLower.includes('base')) {
      return 'Principiante';
    }
    if (labelLower.includes('intermediate') || labelLower.includes('intermedio') || labelLower.includes('developing') || 
        labelLower.includes('medio') || labelLower.includes('moderado') || labelLower.includes('competent') || 
        labelLower.includes('competente')) {
      return 'Intermedio';
    }
    if (labelLower.includes('advanced') || labelLower.includes('avanzado') || labelLower.includes('proficient') || 
        labelLower.includes('superior') || labelLower.includes('alto') || labelLower.includes('elevado') ||
        labelLower.includes('skilled') || labelLower.includes('habilidoso')) {
      return 'Avanzado';
    }
    if (labelLower.includes('expert') || labelLower.includes('experto') || labelLower.includes('master') || 
        labelLower.includes('maestro') || labelLower.includes('superior') || labelLower.includes('excelente') ||
        labelLower.includes('outstanding') || labelLower.includes('destacado') || labelLower.includes('excellent')) {
      return 'Experto';
    }
    
    // Additional partial matches for the new terms
    if (labelLower.includes('in progress') || labelLower.includes('en progreso') || labelLower.includes('progress')) {
      return 'En Progreso';
    }
    if (labelLower.includes('expected') || labelLower.includes('esperado') || labelLower.includes('expect')) {
      return 'Esperado';
    }
    
    // Debug: log untranslated labels with more details
    console.log('Untranslated skill level label:', {
      original: label,
      lowercase: labelLower,
      length: label.length
    });
    
    // If no translation found, return original label
    return label;
  };

  // Determine if a skill level is the target standard (typically middle level)
  const isTargetStandard = (level: SkillLevel, allLevels: SkillLevel[]) => {
    if (allLevels.length === 0) return false;
    
    // Sort levels by order
    const sortedLevels = [...allLevels].sort((a, b) => a.order - b.order);
    
    // Target standard is typically the middle level
    const middleIndex = Math.floor(sortedLevels.length / 2);
    return level.order === sortedLevels[middleIndex].order;
  };

  // Handle opening PDF modal
  const handleOpenPdfModal = async (source: Source) => {
    setSelectedSource(source);
    setPdfModalOpen(true);
    setPdfLoading(true);
    setPdfUrl(null);
    
    if (source.pdf_s3_key && source.pdf_processing_status === 'completed') {
      const url = await getPdfUrl(source.pdf_s3_key);
      setPdfUrl(url);
    }
    setPdfLoading(false);
  };

  // Handle closing PDF modal
  const handleClosePdfModal = () => {
    setPdfModalOpen(false);
    setSelectedSource(null);
    setPdfUrl(null);
    setPdfLoading(false);
  };

  // Get PDF URL for display
  const getPdfUrl = async (pdfS3Key: string) => {
    try {
      const response = await fetch(`/api/teacher/sources/download?key=${encodeURIComponent(pdfS3Key)}`);
      if (response.ok) {
        const data = await response.json();
        return data.url;
      }
      throw new Error('Failed to get PDF URL');
    } catch (error) {
      console.error('Error getting PDF URL:', error);
      return null;
    }
  };

    // Function to render AI message with cognitive recommendations
  const renderCompleteMessage = (messageText: string) => {
    // For the new simplified structure, just render the message as paragraphs
    const paragraphs = messageText.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => (
      <Typography 
        key={index} 
        variant="body2" 
        color="text.secondary" 
        sx={{ mb: 2, whiteSpace: 'pre-wrap' }}
      >
        {paragraph.trim()}
      </Typography>
    ));
  };

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
        <Navbar userType="student" />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error && !assessment) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
        <Navbar userType="student" />
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => router.push('/student/dashboard')}
            startIcon={<ArrowBackIcon />}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="student" />
      
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link
            color="inherit"
            href="/student/dashboard"
            sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
            {t('dashboard')}
          </Link>
          <Link
            color="inherit"
            href="/student/dashboard"
            sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
          >
            <AssessmentIcon sx={{ mr: 0.5 }} fontSize="small" />
            {t('assessments')}
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            {assessment?.name}
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => router.push('/student/dashboard')}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" gutterBottom>
              {assessment?.name}
              {assessment?.show_teacher_name === 1 && assessment?.teacher_given_name && assessment?.teacher_family_name && (
                <span style={{ fontWeight: 'normal', color: 'text.secondary', fontSize: '0.7em' }}>
                  {' '}({assessment.teacher_given_name} {assessment.teacher_family_name})
                </span>
              )}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {assessment?.description}
            </Typography>
            
            {/* Skills Information */}
            {assessment && assessment.skills && assessment.skills.length > 0 && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {t('skillsBeingEvaluated')}:
                </Typography>
                {assessment.skills.map((skill, index) => (
                  <Box key={skill.id} sx={{ mb: index < assessment.skills.length - 1 ? 2 : 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.primary', mb: 0.5 }}>
                      {skill.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 1 }}>
                      {skill.description}
                    </Typography>
                    
                    {/* Skill Levels */}
                    {skill.levels && skill.levels.length > 0 && (
                      <Box sx={{ ml: 1 }}>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            cursor: 'pointer',
                            mb: skillLevelsExpanded ? 0.5 : 0
                          }}
                          onClick={() => setSkillLevelsExpanded(!skillLevelsExpanded)}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                            {t('skillLevels')}:
                          </Typography>
                          {skillLevelsExpanded ? <ExpandLessIcon fontSize="small" color="action" /> : <ExpandMoreIcon fontSize="small" color="action" />}
                        </Box>
                        {skillLevelsExpanded && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {skill.levels
                              .sort((a, b) => a.order - b.order)
                              .map((level) => {
                                const isTarget = isTargetStandard(level, skill.levels);
                                return (
                                <Box 
                                  key={level.id} 
                                  sx={{ 
                                    p: 0.5,
                                    borderRadius: 0.5,
                                    backgroundColor: isTarget ? '#e3f2fd' : '#f8fbff', // Light blue for target, lighter blue for others
                                    border: 1,
                                    borderColor: isTarget ? '#2196f3' : '#e3f2fd' // Blue border for target, light blue for others
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <Box 
                                      sx={{ 
                                        width: 8, 
                                        height: 8, 
                                        borderRadius: '50%', 
                                        backgroundColor: isTarget ? '#2196f3' : '#90caf9', // Blue for target, lighter blue for others
                                        flexShrink: 0
                                      }} 
                                    />
                                    <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                                      {translateSkillLevelLabel(level.label)}
                                    </Typography>
                                  </Box>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block', ml: 2 }}>
                                    {level.description}
                                  </Typography>
                                </Box>
                              )})}
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            )}



            {/* Academic Sources Panel */}
            {assessment && assessment.skills && assessment.skills.length > 0 && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'primary.50', borderRadius: 1, border: 1, borderColor: 'primary.200' }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    cursor: 'pointer',
                    mb: sourcesExpanded ? 1 : 0
                  }}
                  onClick={() => setSourcesExpanded(!sourcesExpanded)}
                >
                  <InfoIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle2" color="primary.dark" sx={{ fontWeight: 'bold', flex: 1 }}>
                    {t('academicSourcesForReference')}
                  </Typography>
                  {sourcesExpanded ? <ExpandLessIcon color="primary" /> : <ExpandMoreIcon color="primary" />}
                </Box>
                {sourcesExpanded && (
                  <>
                    <Typography variant="body2" color="primary.dark" sx={{ mb: 2, fontSize: '0.875rem' }}>
                      {t('academicSourcesDescription')}
                    </Typography>
                    
                    <Box sx={{ mb: 2, p: 1.5, backgroundColor: 'primary.100', borderRadius: 1 }}>
                      <Typography variant="caption" color="primary.dark" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                        💡 {t('howToUseSourcesEffectively')}:
                      </Typography>
                      <Typography variant="caption" color="primary.dark" sx={{ display: 'block', mb: 0.5 }}>
                        • {t('reviewSourcesBeforeStarting')}
                      </Typography>
                      <Typography variant="caption" color="primary.dark" sx={{ display: 'block', mb: 0.5 }}>
                        • {t('aiMayReferenceSources')}
                      </Typography>
                      <Typography variant="caption" color="primary.dark" sx={{ display: 'block' }}>
                        • {t('useTheoreticalFrameworks')}
                      </Typography>
                    </Box>
                    
                    {assessment.skills.map((skill, skillIndex) => {
                      // Check if this skill has sources (we'll need to fetch them)
                      const skillSources = skill.sources || [];
                      
                      return (
                        <Box key={skill.id} sx={{ mb: skillIndex < assessment.skills.length - 1 ? 2 : 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.dark', mb: 1 }}>
                            {skill.name}:
                          </Typography>
                          
                          {skillSources.length > 0 ? (
                            skillSources.map((source, sourceIndex) => (
                              <Box 
                                key={source.id || sourceIndex} 
                                sx={{ 
                                  ml: 2, 
                                  mb: 1
                                }}
                              >
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontWeight: 'medium', 
                                    color: 'primary.main', 
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    '&:hover': {
                                      color: 'primary.dark'
                                    }
                                  }}
                                  onClick={() => handleOpenPdfModal(source)}
                                >
                                  {source.title}
                                </Typography>
                                {(source.authors || source.publication_year) && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                    {source.authors}
                                    {source.authors && source.publication_year && ', '}
                                    {source.publication_year}
                                  </Typography>
                                )}
                              </Box>
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 2, fontStyle: 'italic' }}>
                              {t('noSpecificSourcesAvailable')}
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </>
                )}
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 200px)' }}>
          {/* Case Text Panel */}
          <Paper sx={{ width: '40%', p: 3, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              {t('caseScenario')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            

            
            {/* Case Navigation Links - Always show if sections exist */}
            {assessment?.case_sections && (
              <Box sx={{ mb: 2, p: 2, backgroundColor: 'primary.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="primary.dark" sx={{ mb: 1, fontWeight: 'bold' }}>
                  {t('jumpToSection')}:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {Object.entries(assessment.case_sections)
                    .sort(([, a], [, b]) => a.order - b.order)
                    .map(([sectionId, section]) => (
                    <Button
                      key={sectionId}
                      variant={activeSection === sectionId ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => {
                        setActiveSection(sectionId);
                        scrollToSection(sectionId);
                      }}
                      sx={{
                        textTransform: 'none',
                        fontWeight: activeSection === sectionId ? 'bold' : 'normal'
                      }}
                    >
                      {section.title}
                    </Button>
                  ))}
                </Box>
              </Box>
            )}

            {/* Case Text Display */}
            {assessment?.case_sections ? (
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                {Object.entries(assessment.case_sections)
                  .sort(([, a], [, b]) => a.order - b.order)
                  .map(([sectionId, section]) => (
                  <Box
                    key={sectionId}
                    id={`section-${sectionId}`}
                    sx={{
                      mb: 3,
                      p: 2,
                      backgroundColor: 'grey.50',
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'divider',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                        color: activeSection === sectionId ? 'primary.dark' : 'text.primary',
                        fontWeight: 'bold'
                      }}
                    >
                      {section.title}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography
                      variant="body1"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6,
                        userSelect: assessment?.integrity_protection === 1 ? 'none' : 'text',
                        position: 'relative'
                      }}
                    >
                      {section.content}
                      {assessment?.integrity_protection === 1 && (
                        <IconButton 
                          size="small" 
                          sx={{ 
                            position: 'absolute', 
                            top: 0, 
                            right: 0,
                            color: 'grey.500'
                          }}
                          disabled
                        >
                          <BlockIcon />
                        </IconButton>
                      )}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box 
                sx={{ 
                  flex: 1,
                  p: 2, 
                  backgroundColor: 'grey.50', 
                  borderRadius: 1,
                  userSelect: assessment?.integrity_protection === 1 ? 'none' : 'text',
                  position: 'relative',
                  overflow: 'auto'
                }}
              >
                {assessment?.integrity_protection === 1 && (
                  <IconButton 
                    size="small" 
                    sx={{ 
                      position: 'absolute', 
                      top: 8, 
                      right: 8,
                      color: 'grey.500'
                    }}
                    disabled
                  >
                    <BlockIcon />
                  </IconButton>
                )}
                <Typography 
                  variant="body1" 
                  sx={{ 
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6,
                    pr: assessment?.integrity_protection === 1 ? 4 : 0
                  }}
                >
                  {assessment?.case_text}
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Chat Panel */}
          <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Chat Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">
                    {t('aiAssessmentConversation')}
                  </Typography>
                  {attempt && (
                    <Typography variant="body2" color="text.secondary">
                      {t('attemptStarted')}: {new Date(attempt.created_at).toLocaleString()}
                    </Typography>
                  )}
                </Box>
                {assessment && !isCompleted && (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip
                      label={`${getRemainingTurns()}/${getMaxTurns()} ${t('turns')}`}
                      color={getRemainingTurns() === 0 ? 'error' : getRemainingTurns() <= 2 ? 'warning' : 'primary'}
                      size="small"
                      variant="filled"
                    />
                    <Tooltip title={t('clarificationTooltip')}>
                      <Chip
                        icon={<HelpIcon />}
                        label={t('freeClarifications')}
                        color="success"
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem', cursor: 'help' }}
                      />
                    </Tooltip>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Messages */}
            <Box sx={{ flex: 1, p: 2, overflow: 'auto', backgroundColor: 'grey.50' }}>
              {conversation.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    {locale === 'es' 
                      ? `Responde a la pregunta del caso escribiendo tu respuesta a continuación para comenzar la interacción con el agente de IA. Tienes hasta ${getMaxTurns()} turnos para mejorar tu rendimiento.`
                      : `Reply to the case question by typing your reply below to start the interaction with the AI agent. You have up to ${getMaxTurns()} turns to improve your performance.`
                    }
                  </Typography>
                </Box>
              ) : (
                conversation.map((message) => (
                  <Box 
                    key={message.id} 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: message.message_type === 'student' ? 'flex-end' : 'flex-start',
                      mb: 2
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '70%',
                        backgroundColor: message.message_type === 'student' ? 'primary.main' : 'white',
                        color: message.message_type === 'student' ? 'white' : 'text.primary',
                        borderRadius: 2,
                        p: 2,
                        boxShadow: 1,
                        position: 'relative'
                      }}
                    >
                      {message.message_type === 'ai' && (
                        <Avatar 
                          sx={{ 
                            width: 24, 
                            height: 24, 
                            position: 'absolute', 
                            top: -12, 
                            left: -12,
                            backgroundColor: message.message_subtype === 'clarification_question' ? 'warning.main' : 'secondary.main'
                          }}
                        >
                          {message.message_subtype === 'clarification_question' ? <QuestionAnswerIcon /> : 'AI'}
                        </Avatar>
                      )}
                      {/* Clarification Indicator */}
                      {message.message_subtype === 'clarification_question' && (
                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <InfoIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                          <Typography variant="caption" color="warning.main" sx={{ fontWeight: 'bold' }}>
                            Clarification Question (Free Turn)
                          </Typography>
                        </Box>
                      )}
                      
                      {message.message_type === 'ai' ? (
                        <Box>
                          {renderCompleteMessage(message.message_text)}
                        </Box>
                      ) : (
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {message.message_text}
                        </Typography>
                      )}
                      
                      {/* Clarification Response Indicator */}
                      {message.message_subtype === 'clarification_response' && (
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <InfoIcon sx={{ fontSize: 16, color: 'info.main' }} />
                          <Typography variant="caption" color="info.main" sx={{ fontWeight: 'bold' }}>
                            Clarification Response (Free Turn)
                          </Typography>
                        </Box>
                      )}
                      

                      
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block', 
                          mt: 1,
                          opacity: 0.7
                        }}
                      >
                        {formatTime(message.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Error Message */}
            {error && (
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Alert 
                  severity="error" 
                  action={
                    <Button color="inherit" size="small" onClick={handleRetry}>
                      Send Again
                    </Button>
                  }
                >
                  {error}
                </Alert>
              </Box>
            )}

            {/* Completed Results */}
            {isCompleted && results.length > 0 && (
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', backgroundColor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom color="text.primary">
                  Assessment Completed! {getAssessmentIcon(results[0]?.skillLevelLabel || '')}
                </Typography>
                {results.map((result, index) => {
                  // Debug logging
                  console.log('Result:', {
                    skillName: result.skillName,
                    skillLevelOrder: result.skill_level_order,
                    skillLevelLabel: result.skillLevelLabel
                  });
                  
                  // Use a fixed maximum of 5 levels for consistent color calculation
                  const maxLevelOrder = 5;
                  let backgroundColor = getAssessmentColor(result.skill_level_order, maxLevelOrder);
                  
                  // Fallback to label-based color if the order-based calculation seems wrong
                  if (result.skill_level_order > 3) { // If order is high but it's a "Starting" level
                    backgroundColor = getAssessmentColorByLabel(result.skillLevelLabel);
                  }
                  
                  // Get darker border color
                  const borderColor = getAssessmentBorderColor(result.skillLevelLabel);
                  
                  console.log('Color calculation:', {
                    skillLevelOrder: result.skill_level_order,
                    skillLevelLabel: result.skillLevelLabel,
                    maxLevelOrder,
                    percentage: result.skill_level_order / maxLevelOrder,
                    backgroundColor,
                    borderColor,
                    orderBasedColor: getAssessmentColor(result.skill_level_order, maxLevelOrder),
                    labelBasedColor: getAssessmentColorByLabel(result.skillLevelLabel)
                  });
                  
                  return (
                    <Card key={index} sx={{ 
                      mb: 2, 
                      backgroundColor,
                      border: `2px solid ${borderColor}`,
                      borderRadius: 2
                    }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {result.skillName}
                        </Typography>
                        <Chip 
                          label={result.skillLevelLabel} 
                          color="primary" 
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 'medium' }}>
                          {result.skillLevelDescription}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {result.feedback}
                        </Typography>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            )}

            {/* Input Area */}
            {!isCompleted && (
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                {getRemainingTurns() === 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {t('maxTurnsReached')}
                  </Alert>
                )}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    ref={textareaRef}
                    fullWidth
                    multiline
                    rows={3}
                    placeholder={getRemainingTurns() === 0 ? t('noMoreTurnsAvailable') : t('typeYourResponseHere')}
                    value={studentReply}
                    onChange={(e) => setStudentReply(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onKeyDown={handleKeyDown}
                    onContextMenu={handleContextMenu}
                    disabled={isSending || getRemainingTurns() === 0}
                    onCopy={assessment?.integrity_protection === 1 ? (e) => e.preventDefault() : undefined}
                    onPaste={assessment?.integrity_protection === 1 ? (e) => e.preventDefault() : undefined}
                    onCut={assessment?.integrity_protection === 1 ? (e) => e.preventDefault() : undefined}
                    sx={{
                      '& .MuiInputBase-root': {
                        userSelect: assessment?.integrity_protection === 1 ? 'none' : 'text'
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSendReply}
                    disabled={!studentReply.trim() || isSending || getRemainingTurns() === 0}
                    sx={{ minWidth: 56, height: 56 }}
                  >
                    {isSending ? <CircularProgress size={24} /> : <SendIcon />}
                  </Button>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {getRemainingTurns() === 0 
                    ? t('maxTurnsReachedWaiting')
                    : assessment?.integrity_protection === 1
                      ? t('enterToSendIntegrityDisabled')
                      : t('enterToSend')
                  }
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* PDF Viewer Modal */}
      <Dialog
        open={pdfModalOpen}
        onClose={handleClosePdfModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {selectedSource?.title}
          </Typography>
          <IconButton onClick={handleClosePdfModal}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '100%' }}>
          {pdfLoading ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              p: 3
            }}>
              <CircularProgress size={48} />
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                Cargando PDF...
              </Typography>
            </Box>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              title={selectedSource?.title || 'PDF Viewer'}
            />
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              p: 3
            }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                PDF no disponible
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                El PDF para esta fuente no está disponible o aún está siendo procesado.
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}