/**
 * ADMIN LOGIN PAGE
 * 
 * PURPOSE: Admin authentication page with role-specific login form
 * 
 * CONNECTIONS:
 * - Redirects to /admin/dashboard on successful login
 * - Uses shared LoginFormWrapper component with admin role
 * - Accessible from main landing page admin login button
 * 
 * KEY FEATURES:
 * - Admin-specific login form
 * - Role-based authentication validation
 * - Integration with shared authentication components
 * - Consistent admin interface styling
 * 
 * NAVIGATION FLOW:
 * - Entry point for admin authentication
 * - Successful login redirects to admin dashboard
 * - Failed login shows error messages
 * 
 * SECURITY:
 * - Admin role validation
 * - Secure authentication handling
 * - Session management for admin users
 */

import LoginFormWrapper from '@/components/auth/LoginFormWrapper';

export default function AdminLogin() {
  return <LoginFormWrapper userType="admin" />;
} 