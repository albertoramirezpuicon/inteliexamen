'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Link
} from '@mui/material';
import { 
  Send as SendIcon, 
  ArrowBack as ArrowBackIcon,
  ContentCopy as ContentCopyIcon,
  Block as BlockIcon,
  Home as HomeIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import Navbar from '@/components/layout/Navbar';

interface Assessment {
  id: number;
  name: string;
  description: string;
  case_text: string;
  questions_per_skill: number;
  output_language: string;
  skills: Skill[];
}

interface Skill {
  id: number;
  name: string;
  description: string;
  levels: SkillLevel[];
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

interface AIEvaluationResponse {
  canDetermineLevel: boolean;
  feedback: string;
  skillResults?: {
    skillId: number;
    skillLevelId: number;
    feedback: string;
  }[];
  message?: string;
}

export default function AssessmentAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [studentReply, setStudentReply] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (assessmentId && !isInitialized) {
      setIsInitialized(true);
      loadAssessmentAndStartAttempt();
    }
  }, [assessmentId, isInitialized]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAssessmentAndStartAttempt = async () => {
    try {
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
      setIsLoading(false);
    }
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

    try {
      setIsSending(true);
      setError(null);

      const response = await fetch(`/api/student/attempts/${attempt.id}/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: studentReply.trim(),
          assessmentId: parseInt(assessmentId)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
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
      if (data.aiResponse) {
        const newAIMessage: ConversationMessage = {
          id: Date.now() + 1,
          message_type: 'ai',
          message_text: data.aiResponse.message,
          created_at: new Date().toISOString()
        };
        
        setConversation(prev => [...prev, newAIMessage]);

        // Check if assessment is completed
        if (data.aiResponse.canDetermineLevel) {
          setIsCompleted(true);
          setAttempt(prev => prev ? { ...prev, status: 'Completed' } : null);
          if (data.results) {
            setResults(data.results);
          }
        }
      }

    } catch (err) {
      console.error('Error sending reply:', err);
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
    // Prevent Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A
    if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'a')) {
      e.preventDefault();
    }
    // Prevent right-click context menu
    if (e.key === 'ContextMenu') {
      e.preventDefault();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
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
            Dashboard
          </Link>
          <Link
            color="inherit"
            href="/student/dashboard"
            sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
          >
            <AssessmentIcon sx={{ mr: 0.5 }} fontSize="small" />
            Assessments
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
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {assessment?.description}
            </Typography>
          </Box>
          
          {/* Conversation Turns Counter */}
          {assessment && !isCompleted && (
            <Box sx={{ textAlign: 'center', minWidth: 120 }}>
              <Chip
                label={`${getRemainingTurns()} turns left`}
                color={getRemainingTurns() === 0 ? 'error' : 'primary'}
                variant="outlined"
                sx={{ fontWeight: 'bold' }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Max: {getMaxTurns()}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 200px)' }}>
          {/* Case Text Panel */}
          <Paper sx={{ width: '40%', p: 3, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Case Scenario
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box 
              sx={{ 
                p: 2, 
                backgroundColor: 'grey.50', 
                borderRadius: 1,
                userSelect: 'none',
                position: 'relative'
              }}
            >
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
              <Typography 
                variant="body1" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  pr: 4
                }}
              >
                {assessment?.case_text}
              </Typography>
            </Box>
            
            {assessment && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Skills to evaluate:</strong> {assessment.skills.map(s => s.name).join(', ')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Maximum turns:</strong> {assessment.skills.length * assessment.questions_per_skill}
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
                    AI Assessment Conversation
                  </Typography>
                  {attempt && (
                    <Typography variant="body2" color="text.secondary">
                      Attempt started: {new Date(attempt.created_at).toLocaleString()}
                    </Typography>
                  )}
                </Box>
                {assessment && !isCompleted && (
                  <Chip
                    label={`${getRemainingTurns()}/${getMaxTurns()} turns`}
                    color={getRemainingTurns() === 0 ? 'error' : getRemainingTurns() <= 2 ? 'warning' : 'primary'}
                    size="small"
                    variant="filled"
                  />
                )}
              </Box>
            </Box>

            {/* Messages */}
            <Box sx={{ flex: 1, p: 2, overflow: 'auto', backgroundColor: 'grey.50' }}>
              {conversation.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    Start by responding to the case scenario above. The AI will evaluate your response and provide feedback.
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
                            backgroundColor: 'secondary.main'
                          }}
                        >
                          AI
                        </Avatar>
                      )}
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.message_text}
                      </Typography>
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
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', backgroundColor: 'success.light' }}>
                <Typography variant="h6" gutterBottom color="success.dark">
                  Assessment Completed! 🎉
                </Typography>
                {results.map((result, index) => (
                  <Card key={index} sx={{ mb: 2, backgroundColor: 'white' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {result.skillName}
                      </Typography>
                      <Chip 
                        label={result.skillLevelLabel} 
                        color="success" 
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {result.feedback}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            {/* Input Area */}
            {!isCompleted && (
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                {getRemainingTurns() === 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    You have reached the maximum number of conversation turns. The AI will now evaluate your responses.
                  </Alert>
                )}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    ref={textareaRef}
                    fullWidth
                    multiline
                    rows={3}
                    placeholder={getRemainingTurns() === 0 ? "No more turns available" : "Type your response here..."}
                    value={studentReply}
                    onChange={(e) => setStudentReply(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onKeyDown={handleKeyDown}
                    onContextMenu={handleContextMenu}
                    disabled={isSending || getRemainingTurns() === 0}
                    onCopy={(e) => e.preventDefault()}
                    onPaste={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                    sx={{
                      '& .MuiInputBase-root': {
                        userSelect: 'none'
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
                    ? "Maximum turns reached. Waiting for AI evaluation..."
                    : "Press Enter to send, Shift+Enter for new line. Copy/paste is disabled for assessment integrity."
                  }
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
} 