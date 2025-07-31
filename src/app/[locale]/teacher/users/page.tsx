'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Chip, 
  TextField, 
  InputAdornment,
  TablePagination,
  TableSortLabel,
  Breadcrumbs,
  Link,
  Avatar,
  Alert,
  Button,
  IconButton
} from '@mui/material';
import { 
  Search as SearchIcon,
  People as PeopleIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Home as HomeIcon,
  HelpOutline
} from '@mui/icons-material';
import Navbar from '@/components/layout/Navbar';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

interface User {
  id: number;
  email: string;
  given_name: string;
  family_name: string;
  role: string;
  institution_id: number | null;
  institution_name: string | null;
}

interface Student {
  id: number;
  email: string;
  given_name: string;
  family_name: string;
  created_at: string;
}

type SortField = 'name' | 'email' | 'created_at';
type SortOrder = 'asc' | 'desc';

export default function TeacherUsersPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('teacher');

  
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(20);

  // Info box state
  const [showStudentInfo, setShowStudentInfo] = useState(true);

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

  const fetchStudents = useCallback(async () => {
    try {
      console.log('Fetching students for user:', user);
      console.log('User institution ID:', user?.institution_id);
      
      if (!user?.institution_id) {
        console.error('No institution ID found for user');
        setError('User institution not found');
        return;
      }

      setLoading(true);
      const response = await fetch('/api/teacher/users', {
        headers: {
          'x-institution-id': user.institution_id.toString()
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch students');
      }
      
      const data = await response.json();
      console.log('Students data:', data);
      setStudents(data.students);
    } catch (error) {
      setError('Failed to fetch students');
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const applyFiltersAndSorting = useCallback(() => {
    let filtered = [...students];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(student =>
        student.given_name.toLowerCase().includes(searchLower) ||
        student.family_name.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower)
      );
    }

    filtered.sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (sortField) {
        case 'name':
          aValue = `${a.given_name} ${a.family_name}`.toLowerCase();
          bValue = `${b.given_name} ${b.family_name}`.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'created_at':
          aValue = a.created_at;
          bValue = b.created_at;
          break;
        default:
          aValue = '';
          bValue = '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredStudents(filtered);
    setPage(0);
  }, [students, sortField, sortOrder, searchTerm]);

  // Fetch students after user data is loaded
  useEffect(() => {
    console.log('useEffect triggered - user state:', user);
    if (user) {
      console.log('User is available, calling fetchStudents');
      fetchStudents();
    } else {
      console.log('User is not available yet');
    }
  }, [user, fetchStudents]);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [applyFiltersAndSorting]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getUserDisplayName = () => {
    return user ? `${user.given_name} ${user.family_name}` : '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (!user) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography>Loading...</Typography>
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
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            {t('dashboard')}
          </Link>
          <Typography color="text.primary">{t('users.title')}</Typography>
        </Breadcrumbs>

        <Typography variant="h4" gutterBottom>
          {t('users.title')}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('users.description')}
        </Typography>

        {/* Students Info Box */}
        {showStudentInfo && (
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
              onClick={() => setShowStudentInfo(false)}
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
              {t('users.whatIsStudent')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('users.studentExplanation')}
            </Typography>
            <Button
              size="small"
              onClick={() => setShowStudentInfo(false)}
              sx={{ mt: 1 }}
            >
              {t('users.hideInfo')}
            </Button>
          </Box>
        )}

        {!showStudentInfo && (
          <Button
            size="small"
            startIcon={<HelpOutline />}
            onClick={() => setShowStudentInfo(true)}
            sx={{ mb: 3 }}
          >
            {t('users.showInfo')}
          </Button>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Chip
            icon={<PeopleIcon />}
            label={t('users.studentsCount', { count: filteredStudents.length })}
            color="primary"
            variant="outlined"
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder={t('users.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: 400 }}
            />
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('users.student')}</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'email'}
                      direction={sortField === 'email' ? sortOrder : 'asc'}
                      onClick={() => handleSort('email')}
                    >
                      {t('users.email')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'created_at'}
                      direction={sortField === 'created_at' ? sortOrder : 'asc'}
                      onClick={() => handleSort('created_at')}
                    >
                      {t('users.joined')}
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography>{t('users.loadingStudents')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography>{t('users.noStudentsFound')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {getInitials(student.given_name, student.family_name)}
                            </Avatar>
                            <Box>
                              <Typography variant="body1" fontWeight="medium">
                                {student.given_name} {student.family_name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {t('users.student')}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {student.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(student.created_at)}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 20, 50]}
            component="div"
            count={filteredStudents.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={() => {
              setPage(0);
            }}
          />
        </Paper>
      </Box>
    </Box>
  );
} 