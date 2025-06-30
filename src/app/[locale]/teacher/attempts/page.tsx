'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Breadcrumbs,
  Link,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Avatar,
  Card,
  CardContent
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Psychology as PsychologyIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  SmartToy as SmartToyIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useTranslations, useLocale } from 'next-intl';

interface Assessment {
  id: number;
  name: string;
  description: string;
}

interface Attempt {
  id: number;
  student_name: string;
  student_email: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  final_grade: number;
}

interface AssessmentResult {
  id: number;
  skill_name: string;
  skill_level_label: string;
  feedback: string;
  skill_level_id: number;
}

interface Dispute {
  id: number;
  result_id: number;
  status: 'Pending' | 'Under review' | 'Solved' | 'Rejected';
  student_argument: string;
  teacher_argument: string | null;
  created_at: string;
  update_at: string;
  student_name: string;
  student_email: string;
  skill_name: string;
  current_skill_level: string;
  current_feedback: string;
  skill_level_id: number;
}

interface ConversationMessage {
  id: number;
  message_type: 'student' | 'ai';
  message_text: string;
  created_at: string;
}

interface User {
  id: number;
  email: string;
  given_name: string;
  family_name: string;
  role: string;
  institution_id: number;
}

export default function TeacherAttemptsPage() {
  const router = useRouter();
  const locale = useLocale();
  
  const [user, setUser] = useState<User | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Results modal
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteAttemptId, setDeleteAttemptId] = useState<number | null>(null);
  const [deleteAttemptName, setDeleteAttemptName] = useState<string>('');
  const [deleting, setDeleting] = useState(false);

  // Dispute modal
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [teacherArgument, setTeacherArgument] = useState('');
  const [disputeStatus, setDisputeStatus] = useState<'Pending' | 'Under review' | 'Solved' | 'Rejected'>('Pending');
  const [newSkillLevelId, setNewSkillLevelId] = useState<number>(0);
  const [newFeedback, setNewFeedback] = useState('');
  const [skillLevels, setSkillLevels] = useState<{id: number, label: string}[]>([]);
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [loadingDisputes, setLoadingDisputes] = useState(false);

  // Load user info
  const loadUserInfo = useCallback(async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } else {
        router.push(`/${locale}/teacher/login`);
      }
    } catch {
      console.error('Error loading user info');
      router.push(`/${locale}/teacher/login`);
    }
  }, [locale, router]);

  // Load teacher's assessments
  const loadAssessments = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/teacher/assessments?teacher_id=${user.id}&institution_id=${user.institution_id}`);
      if (response.ok) {
        const data = await response.json();
        setAssessments(data.assessments || []);
      }
    } catch {
      console.error('Error loading assessments');
    }
  }, [user]);

  // Load attempts for selected assessment
  const loadAttempts = useCallback(async () => {
    if (!selectedAssessment || !user) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/teacher/attempts?assessment_id=${selectedAssessment}&teacher_id=${user.id}&institution_id=${user.institution_id}`,
        {
          headers: {
            'x-user-id': user.id.toString(),
            'x-institution-id': user.institution_id.toString(),
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setAttempts(data.attempts || []);
      } else {
        setError('Failed to load attempts');
      }
    } catch {
      setError('Failed to load attempts');
    } finally {
      setLoading(false);
    }
  }, [selectedAssessment, user]);

  useEffect(() => {
    loadUserInfo();
  }, [loadUserInfo]);

  useEffect(() => {
    if (user) {
      loadAssessments();
    }
  }, [user, loadAssessments]);

  useEffect(() => {
    if (selectedAssessment) {
      loadAttempts();
    } else {
      setAttempts([]);
    }
  }, [selectedAssessment, loadAttempts]);

  const handleAssessmentChange = (assessmentId: number) => {
    setSelectedAssessment(assessmentId);
  };

  const handleViewResults = async (attemptId: number) => {
    setSelectedAttemptId(attemptId);
    setResultsModalOpen(true);
    await loadResults(attemptId);
  };

  const handleViewDisputes = (attemptId: number) => {
    router.push(`/${locale}/teacher/attempts/${attemptId}/disputes`);
  };

  const handleViewDisputesModal = async (attemptId: number) => {
    setSelectedAttemptId(attemptId);
    setLoadingDisputes(true);
    try {
      // Load disputes for this attempt
      const disputesResponse = await fetch(`/api/teacher/attempts/${attemptId}/disputes`);
      if (disputesResponse.ok) {
        const disputesData = await disputesResponse.json();
        setDisputes(disputesData.disputes || []);
        
        // Load skill levels for the first dispute's skill
        if (disputesData.disputes && disputesData.disputes.length > 0) {
          const firstDispute = disputesData.disputes[0];
          const skillLevelsResponse = await fetch(`/api/teacher/skills/${firstDispute.skill_id}/levels`, {
            headers: {
              'x-institution-id': user.institution_id.toString(),
            },
          });
          if (skillLevelsResponse.ok) {
            const skillLevelsData = await skillLevelsResponse.json();
            setSkillLevels(skillLevelsData.skillLevels || []);
          }
        }
      }

      // Load conversation for this attempt
      const conversationResponse = await fetch(`/api/student/attempts/${attemptId}/conversation`);
      if (conversationResponse.ok) {
        const conversationData = await conversationResponse.json();
        setConversation(conversationData.conversation || []);
      }

      setDisputeModalOpen(true);
    } catch (error) {
      console.error('Error loading disputes:', error);
    } finally {
      setLoadingDisputes(false);
    }
  };

  const handleSelectDispute = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setTeacherArgument(dispute.teacher_argument || '');
    setDisputeStatus(dispute.status);
    setNewSkillLevelId(dispute.skill_level_id);
    setNewFeedback(dispute.current_feedback);
  };

  const handleSubmitDisputeResponse = async () => {
    if (!selectedDispute) return;

    setSubmittingDispute(true);
    try {
      // Update dispute
      const disputeResponse = await fetch(`/api/teacher/disputes/update/${selectedDispute.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacher_argument: teacherArgument,
          status: disputeStatus
        })
      });

      if (disputeResponse.ok) {
        // Update result if skill level or feedback changed
        if (newSkillLevelId !== selectedDispute.skill_level_id || newFeedback !== selectedDispute.current_feedback) {
          const resultResponse = await fetch(`/api/teacher/results/update/${selectedDispute.result_id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              skill_level_id: newSkillLevelId,
              feedback: newFeedback
            })
          });

          if (!resultResponse.ok) {
            console.error('Error updating result');
          }
        }

        // Refresh disputes
        const refreshResponse = await fetch(`/api/teacher/attempts/${selectedAttemptId}/disputes`);
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.disputes) {
            setDisputes(refreshData.disputes);
          }
        }

        setDisputeModalOpen(false);
        setSelectedDispute(null);
        setSelectedAttemptId(null);
        setTeacherArgument('');
        setDisputeStatus('Pending');
        setNewSkillLevelId(0);
        setNewFeedback('');
      }
    } catch (error) {
      console.error('Error submitting dispute response:', error);
    } finally {
      setSubmittingDispute(false);
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
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const handleDeleteAttempt = (attemptId: number, studentName: string) => {
    setDeleteAttemptId(attemptId);
    setDeleteAttemptName(studentName);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteAttemptId || !user) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/teacher/attempts/${deleteAttemptId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id.toString(),
          'x-institution-id': user.institution_id.toString(),
        },
      });

      if (response.ok) {
        // Refresh the attempts list
        await loadAttempts();
        setDeleteModalOpen(false);
        setDeleteAttemptId(null);
        setDeleteAttemptName('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete attempt');
      }
    } catch (err) {
      setError('Failed to delete attempt');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setDeleteAttemptId(null);
    setDeleteAttemptName('');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in progress':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleCloseDisputeModal = () => {
    setDisputeModalOpen(false);
    setSelectedDispute(null);
    setSelectedAttemptId(null);
    setTeacherArgument('');
    setDisputeStatus('Pending');
    setNewSkillLevelId(0);
    setNewFeedback('');
    setDisputes([]);
    setConversation([]);
    setSkillLevels([]);
  };

  if (!user) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="teacher" userName={`${user.given_name} ${user.family_name}`} />
      
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href={`/${locale}/teacher/dashboard`} color="inherit" underline="hover">
            Dashboard
          </Link>
          <Typography color="text.primary">Attempts</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" gutterBottom>
          Assessment Attempts
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Select an assessment to view student attempts and results.
        </Typography>

        {/* Assessment Selection */}
        <Box sx={{ mb: 4 }}>
          <FormControl fullWidth sx={{ maxWidth: 400 }}>
            <InputLabel>Select Assessment</InputLabel>
            <Select
              value={selectedAssessment || ''}
              onChange={(e) => handleAssessmentChange(e.target.value as number)}
              label="Select Assessment"
            >
              {assessments.map((assessment) => (
                <MenuItem key={assessment.id} value={assessment.id}>
                  {assessment.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Attempts Table */}
        {selectedAssessment && (
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Completion Date</TableCell>
                    <TableCell>Final Grade</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography>Loading attempts...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : attempts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography>No attempts found for this assessment.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    attempts.map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {attempt.student_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {attempt.student_email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={attempt.status} 
                            color={getStatusColor(attempt.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {attempt.completed_at ? formatDateTime(attempt.completed_at) : '-'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {attempt.final_grade}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Tooltip title="View Results">
                              <IconButton
                                size="small"
                                onClick={() => handleViewResults(attempt.id)}
                                color="primary"
                              >
                                <AssessmentIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View Disputes">
                              <IconButton
                                size="small"
                                onClick={() => handleViewDisputesModal(attempt.id)}
                                color="secondary"
                              >
                                <PsychologyIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Attempt">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteAttempt(attempt.id, attempt.student_name)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Results Modal */}
        <Dialog
          open={resultsModalOpen}
          onClose={() => setResultsModalOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Assessment Results</span>
              <IconButton onClick={() => setResultsModalOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {resultsLoading ? (
              <Typography>Loading results...</Typography>
            ) : results.length === 0 ? (
              <Typography>No results found for this attempt.</Typography>
            ) : (
              <List>
                {results.map((result, index) => (
                  <Box key={result.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">{result.skill_name}</Typography>
                            <Chip 
                              label={result.skill_level_label} 
                              color="primary" 
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {result.feedback}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < results.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResultsModalOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog
          open={deleteModalOpen}
          onClose={cancelDelete}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the attempt for <strong>{deleteAttemptName}</strong>?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This action cannot be undone. All results and data associated with this attempt will be permanently deleted.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelDelete} disabled={deleting}>
              Cancel
            </Button>
            <Button 
              onClick={confirmDelete} 
              color="error" 
              variant="contained"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dispute Modal */}
        <Dialog
          open={disputeModalOpen}
          onClose={handleCloseDisputeModal}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Dispute Management</span>
              <IconButton onClick={handleCloseDisputeModal}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {loadingDisputes ? (
              <Typography>Loading disputes...</Typography>
            ) : disputes.length === 0 ? (
              <Typography>No disputes found for this attempt.</Typography>
            ) : (
              <>
                {/* Dispute Selection */}
                <Typography variant="h6" gutterBottom>
                  Select Dispute to Review:
                </Typography>
                <Box sx={{ mb: 3 }}>
                  {disputes.map((dispute) => (
                    <Card 
                      key={dispute.id} 
                      sx={{ 
                        mb: 1, 
                        cursor: 'pointer',
                        border: selectedDispute?.id === dispute.id ? 2 : 1,
                        borderColor: selectedDispute?.id === dispute.id ? 'primary.main' : 'divider'
                      }}
                      onClick={() => handleSelectDispute(dispute)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6">{dispute.skill_name}</Typography>
                          <Chip 
                            label={dispute.status} 
                            color={
                              dispute.status === 'Pending' ? 'warning' : 
                              dispute.status === 'Under review' ? 'info' : 
                              dispute.status === 'Solved' ? 'success' : 'error'
                            } as 'warning' | 'info' | 'success' | 'error'
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Student: {dispute.student_name} ({dispute.student_email})
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Current Level: {dispute.current_skill_level}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Student&apos;s Argument:</strong> {dispute.student_argument}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>

                {/* Dispute Details */}
                {selectedDispute && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    
                    {/* Conversation History */}
                    {conversation.length > 0 && (
                      <Accordion sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="subtitle1">
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
                                    boxShadow: 1
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
                                      {message.message_type === 'student' ? 'Student' : 'AI'} • {formatConversationTime(message.created_at)}
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

                    {/* Teacher Response Form */}
                    <Typography variant="h6" gutterBottom>
                      Teacher Response
                    </Typography>
                    
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Your Response"
                      placeholder="Enter your response to the student's dispute..."
                      value={teacherArgument}
                      onChange={(e) => setTeacherArgument(e.target.value)}
                      sx={{ mb: 2 }}
                    />

                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Dispute Status</InputLabel>
                      <Select
                        value={disputeStatus}
                        onChange={(e) => setDisputeStatus(e.target.value as 'Pending' | 'Under review' | 'Solved' | 'Rejected')}
                        label="Dispute Status"
                      >
                        <MenuItem value="Pending">Pending</MenuItem>
                        <MenuItem value="Under review">Under review</MenuItem>
                        <MenuItem value="Solved">Solved</MenuItem>
                        <MenuItem value="Rejected">Rejected</MenuItem>
                      </Select>
                    </FormControl>

                    <Typography variant="h6" gutterBottom>
                      Update Assessment Results
                    </Typography>
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>New Skill Level</InputLabel>
                      <Select
                        value={newSkillLevelId}
                        onChange={(e) => setNewSkillLevelId(e.target.value as number)}
                        label="New Skill Level"
                      >
                        {skillLevels.map((level) => (
                          <MenuItem key={level.id} value={level.id}>
                            {level.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="New Feedback"
                      placeholder="Enter updated feedback..."
                      value={newFeedback}
                      onChange={(e) => setNewFeedback(e.target.value)}
                    />
                  </>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDisputeModal}>Close</Button>
            {selectedDispute && (
              <Button 
                onClick={handleSubmitDisputeResponse} 
                color="primary" 
                variant="contained"
                disabled={submittingDispute}
              >
                {submittingDispute ? 'Submitting...' : 'Submit Response'}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
} 