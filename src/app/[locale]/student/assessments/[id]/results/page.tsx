'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  Chip, 
  Button, 
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Avatar,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  SmartToy as SmartToyIcon
} from '@mui/icons-material';
import { Breadcrumbs, Link } from '@mui/material';
import Navbar from '@/components/layout/Navbar';

interface Assessment {
  id: number;
  name: string;
  description: string;
  case_text: string;
  difficulty_level: string;
  educational_level: string;
  dispute_period: number;
  available_until: string;
  teacher_given_name: string;
  teacher_family_name: string;
  group_name: string;
}

interface Attempt {
  id: number;
  assessmentId: number;
  userId: number;
  finalGrade: string;
  status: string;
  createdAt: string;
  completedAt: string;
}

interface Result {
  id: number;
  skillName: string;
  skillLevelLabel: string;
  feedback: string;
}

interface Dispute {
  id: number;
  status: 'Pending' | 'Solved';
  student_argument: string;
  teacher_argument?: string;
  created_at: string;
  update_at: string;
}

interface ConversationMessage {
  id: number;
  message_type: 'student' | 'ai';
  message_text: string;
  created_at: string;
}

export default function AssessmentResultsPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [disputeArgument, setDisputeArgument] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const loadAssessmentResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = localStorage.getItem('userId');
      console.log('Loading results for assessmentId:', assessmentId, 'userId:', userId);
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Load assessment details
      console.log('Fetching assessment data...');
      const assessmentResponse = await fetch(`/api/student/assessments/${assessmentId}?userId=${userId}`);
      console.log('Assessment response status:', assessmentResponse.status);
      
      if (!assessmentResponse.ok) {
        throw new Error('Failed to load assessment');
      }
      const assessmentData = await assessmentResponse.json();
      console.log('Assessment data:', assessmentData);
      setAssessment(assessmentData.assessment);

      // Load attempt and results
      console.log('Fetching results data...');
      const resultsResponse = await fetch(`/api/student/assessments/${assessmentId}/results?userId=${userId}`);
      console.log('Results response status:', resultsResponse.status);
      
      if (!resultsResponse.ok) {
        throw new Error('Failed to load results');
      }
      const resultsData = await resultsResponse.json();
      console.log('Results data:', resultsData);
      console.log('Attempt from API:', resultsData.attempt);
      console.log('Results from API:', resultsData.results);
      
      setAttempt(resultsData.attempt);
      setResults(resultsData.results);

      // Load conversation for this attempt
      if (resultsData.attempt && resultsData.attempt.id) {
        await loadConversation(resultsData.attempt.id);
      }

      // Load existing dispute if any
      if (resultsData.results && resultsData.results.length > 0) {
        await loadDispute(resultsData.results[0].id);
      }

    } catch (err) {
      console.error('Error loading assessment results:', err);
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    if (assessmentId) {
      loadAssessmentResults();
    }
  }, [assessmentId, loadAssessmentResults]);

  const loadDispute = async (resultId: number) => {
    if (!resultId) return;
    
    try {
      const response = await fetch(`/api/student/disputes/${resultId}`);
      if (response.ok) {
        const data = await response.json();
        setDispute(data.dispute);
      }
    } catch (error) {
      console.error('Error loading dispute:', error);
    }
  };

  const loadConversation = async (attemptId: number) => {
    try {
      const response = await fetch(`/api/student/attempts/${attemptId}/conversation`);
      if (response.ok) {
        const data = await response.json();
        setConversation(data.conversation || []);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const canCreateDispute = () => {
    if (!attempt || !assessment || dispute || !attempt.completedAt) return false;
    
    try {
      const completedAt = new Date(attempt.completedAt);
      
      // Check if the date is valid
      if (isNaN(completedAt.getTime())) {
        console.error('Invalid completedAt date:', attempt.completedAt);
        return false;
      }
      
      const disputeDeadline = new Date(completedAt.getTime() + assessment.dispute_period * 24 * 60 * 60 * 1000);
      
      // Check if the calculated date is valid
      if (isNaN(disputeDeadline.getTime())) {
        console.error('Invalid dispute deadline calculated');
        return false;
      }
      
      const now = new Date();
      return now <= disputeDeadline;
    } catch (error) {
      console.error('Error checking if can create dispute:', error);
      return false;
    }
  };

  const getDisputeDeadline = () => {
    if (!attempt || !assessment || !attempt.completedAt) return null;
    
    try {
      const completedAt = new Date(attempt.completedAt);
      
      // Check if the date is valid
      if (isNaN(completedAt.getTime())) {
        console.error('Invalid completedAt date:', attempt.completedAt);
        return null;
      }
      
      const disputeDeadline = new Date(completedAt.getTime() + assessment.dispute_period * 24 * 60 * 60 * 1000);
      
      // Check if the calculated date is valid
      if (isNaN(disputeDeadline.getTime())) {
        console.error('Invalid dispute deadline calculated');
        return null;
      }
      
      return disputeDeadline;
    } catch (error) {
      console.error('Error calculating dispute deadline:', error);
      return null;
    }
  };

  const formatDisputeDeadline = () => {
    const deadline = getDisputeDeadline();
    if (!deadline) return 'N/A';
    return formatDate(deadline.toISOString());
  };

  const handleCreateDispute = async () => {
    if (!disputeArgument.trim() || !results[0]) return;

    try {
      setSubmittingDispute(true);
      
      const response = await fetch('/api/student/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultId: results[0].id,
          studentArgument: disputeArgument.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create dispute');
      }

      const data = await response.json();
      setDispute(data.dispute);
      setDisputeDialogOpen(false);
      setDisputeArgument('');
      
    } catch (err) {
      console.error('Error creating dispute:', err);
      setError(err instanceof Error ? err.message : 'Failed to create dispute');
    } finally {
      setSubmittingDispute(false);
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) {
      return 'N/A';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateString);
        return 'Invalid Date';
      }
      return date.toLocaleString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const formatConversationTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getDisputeStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Solved': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
        <Navbar userType="student" />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Typography>Loading results...</Typography>
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
              Assessment Results
            </Typography>
            <Typography variant="h6" color="primary">
              {assessment?.name}
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Assessment Details */}
          <Paper sx={{ width: '40%', p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Assessment Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Description:</strong>
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {assessment?.description}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                <strong>Difficulty:</strong> {assessment?.difficulty_level}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Level:</strong> {assessment?.educational_level}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Group:</strong> {assessment?.group_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Teacher:</strong> {assessment?.teacher_given_name} {assessment?.teacher_family_name}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Attempt Information
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Started:</strong> {formatDate(attempt?.createdAt)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Completed:</strong> {formatDate(attempt?.completedAt)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Final Grade:</strong> {attempt?.finalGrade || 'N/A'}
              </Typography>
            </Box>

            {/* Dispute Information */}
            {dispute && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Dispute Information
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Chip 
                    label={dispute.status} 
                    color={getDisputeStatusColor(dispute.status) as 'success' | 'warning' | 'error' | 'default'}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    <strong>Created:</strong> {formatDate(dispute?.created_at)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Your Argument:</strong>
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1, fontStyle: 'italic' }}>
                    &quot;{dispute.student_argument}&quot;
                  </Typography>
                  {dispute.teacher_argument && (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Teacher Response:</strong>
                      </Typography>
                      <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                        &quot;{dispute.teacher_argument}&quot;
                      </Typography>
                    </>
                  )}
                </Box>
              </>
            )}

            {/* Dispute Period Information */}
            {attempt && assessment && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Dispute Period
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Dispute Period:</strong> {assessment.dispute_period} days
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Deadline:</strong> {formatDisputeDeadline()}
                  </Typography>
                  {canCreateDispute() && !dispute && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      You can still create a dispute until the deadline.
                    </Alert>
                  )}
                  {!canCreateDispute() && !dispute && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      Dispute period has expired.
                    </Alert>
                  )}
                </Box>
              </>
            )}
          </Paper>

          {/* Results */}
          <Paper sx={{ flex: 1, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your Results
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {results.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {results.map((result, index) => (
                  <Card key={index} sx={{ backgroundColor: 'grey.50' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6">
                          {result.skillName}
                        </Typography>
                        <Chip 
                          label={result.skillLevelLabel} 
                          color="success" 
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {result.feedback}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No results available
              </Typography>
            )}

            {/* Dispute Button */}
            {canCreateDispute() && !dispute && (
              <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<WarningIcon />}
                  onClick={() => setDisputeDialogOpen(true)}
                  fullWidth
                >
                  Dispute Results
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                  You have until {formatDisputeDeadline()} to dispute these results
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Dispute Dialog */}
      <Dialog 
        open={disputeDialogOpen} 
        onClose={() => setDisputeDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Dispute Assessment Results
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide a clear argument explaining why you believe the assessment results should be reviewed. 
            Be specific about which aspects you disagree with and provide any relevant context.
          </Typography>
          
          {/* Conversation History Accordion */}
          {conversation.length > 0 && (
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">
                  View Conversation History ({conversation.length} messages)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ maxHeight: 300, overflow: 'auto', backgroundColor: 'grey.50', p: 1, borderRadius: 1 }}>
                  {conversation.map((message) => (
                    <Box 
                      key={message.id} 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: message.message_type === 'student' ? 'flex-end' : 'flex-start',
                        mb: 1
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: '80%',
                          backgroundColor: message.message_type === 'student' ? 'primary.main' : 'white',
                          color: message.message_type === 'student' ? 'white' : 'text.primary',
                          borderRadius: 2,
                          p: 1.5,
                          boxShadow: 1,
                          position: 'relative'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Avatar 
                            sx={{ 
                              width: 20, 
                              height: 20, 
                              mr: 1,
                              backgroundColor: message.message_type === 'student' ? 'primary.dark' : 'secondary.main'
                            }}
                          >
                            {message.message_type === 'student' ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
                          </Avatar>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            {message.message_type === 'student' ? 'You' : 'AI'} • {formatConversationTime(message.created_at)}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                          {message.message_text}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
          
          <TextField
            fullWidth
            multiline
            rows={6}
            placeholder="Explain your reason for disputing the results..."
            value={disputeArgument}
            onChange={(e) => setDisputeArgument(e.target.value)}
            disabled={submittingDispute}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDisputeDialogOpen(false)}
            disabled={submittingDispute}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateDispute}
            variant="contained"
            color="warning"
            disabled={!disputeArgument.trim() || submittingDispute}
          >
            Submit Dispute
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 