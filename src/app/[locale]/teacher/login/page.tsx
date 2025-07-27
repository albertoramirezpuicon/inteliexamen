/**
 * TEACHER LOGIN PAGE
 * 
 * PURPOSE: Teacher authentication page with role-specific login form
 * 
 * CONNECTIONS:
 * - Redirects to /teacher/dashboard on successful login
 * - Uses shared LoginFormWrapper component with teacher role
 * - Accessible from main landing page teacher login button
 * 
 * KEY FEATURES:
 * - Teacher-specific login form
 * - Role-based authentication validation
 * - Integration with shared authentication components
 * - Consistent teacher interface styling
 * 
 * NAVIGATION FLOW:
 * - Entry point for teacher authentication
 * - Successful login redirects to teacher dashboard
 * - Failed login shows error messages
 * 
 * SECURITY:
 * - Teacher role validation
 * - Secure authentication handling
 * - Session management for teacher users
 */

import LoginFormWrapper from '@/components/auth/LoginFormWrapper';

export default function TeacherLogin() {
  return <LoginFormWrapper userType="teacher" />;
} 