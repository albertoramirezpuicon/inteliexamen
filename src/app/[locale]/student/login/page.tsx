/**
 * STUDENT LOGIN PAGE
 * 
 * PURPOSE: Student authentication page with role-specific login form
 * 
 * CONNECTIONS:
 * - Redirects to /student/dashboard on successful login
 * - Uses shared LoginFormWrapper component with student role
 * - Accessible from main landing page student login button
 * 
 * KEY FEATURES:
 * - Student-specific login form
 * - Role-based authentication validation
 * - Integration with shared authentication components
 * - Consistent student interface styling
 * 
 * NAVIGATION FLOW:
 * - Entry point for student authentication
 * - Successful login redirects to student dashboard
 * - Failed login shows error messages
 * 
 * SECURITY:
 * - Student role validation
 * - Secure authentication handling
 * - Session management for student users
 */

import LoginFormWrapper from '@/components/auth/LoginFormWrapper';

export default function StudentLogin() {
  return <LoginFormWrapper userType="student" />;
} 