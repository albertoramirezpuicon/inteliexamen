'use client';

import { useState, useEffect } from 'react';
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
  Avatar
} from '@mui/material';
import { 
  Search as SearchIcon,
  People as PeopleIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import Navbar from '@/components/layout/Navbar';
import { useRouter } from 'next/navigation';

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

  const router = useRouter();

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
          // If no user data in localStorage, redirect to login
          router.push('/teacher/login');
          return;
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // If there's an error parsing user data, redirect to login
        router.push('/teacher/login');
      }
    };

    const initializeData = async () => {
      await fetchUserData();
    };

    initializeData();
  }, [router]);

  // Fetch students after user data is loaded
  useEffect(() => {
    console.log('useEffect triggered - user state:', user);
    if (user) {
      console.log('User is available, calling fetchStudents');
      fetchStudents();
    } else {
      console.log('User is not available yet');
    }
  }, [user]);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [students, sortField, sortOrder, searchTerm]);

  const fetchStudents = async () => {
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
  };

  const applyFiltersAndSorting = () => {
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
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return `${user.given_name} ${user.family_name}`.trim() || user.email;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const paginatedStudents = filteredStudents.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
        <Navbar userType="teacher" userName={getUserDisplayName()} />
        <Box sx={{ p: 3 }}>
          <Typography>Loading students...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
        <Navbar userType="teacher" userName={getUserDisplayName()} />
        <Box sx={{ p: 3 }}>
          <Typography color="error">{error}</Typography>
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
          <Typography color="text.primary">Students</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" gutterBottom>
          Students
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          View all students in your institution
        </Typography>

        {/* Search */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            label="Search students"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {/* Results count */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Showing {paginatedStudents.length} of {filteredStudents.length} students
        </Typography>

        {/* Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell 
                  onClick={() => handleSort('email')}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                >
                  <TableSortLabel
                    active={sortField === 'email'}
                    direction={sortField === 'email' ? sortOrder : 'asc'}
                    sx={{ cursor: 'pointer' }}
                  >
                    Email
                  </TableSortLabel>
                </TableCell>
                <TableCell 
                  onClick={() => handleSort('created_at')}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                >
                  <TableSortLabel
                    active={sortField === 'created_at'}
                    direction={sortField === 'created_at' ? sortOrder : 'asc'}
                    sx={{ cursor: 'pointer' }}
                  >
                    Created Date
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedStudents.map((student) => (
                <TableRow key={student.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {student.given_name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {student.given_name} {student.family_name}
                        </Typography>
                        <Chip 
                          label="Student" 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
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
                      <Typography variant="body2">
                        {formatDate(student.created_at)}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={filteredStudents.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[20]}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
          }
        />
      </Box>
    </Box>
  );
} 