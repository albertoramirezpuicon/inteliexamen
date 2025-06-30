export type UserRole = 'admin' | 'student' | 'teacher' | 'clerk';

export interface User {
  id: number;
  institution_id: number;
  email: string;
  given_name: string;
  family_name: string;
  role: UserRole;
  language_preference: string;
}

export function hasAccessToArea(userRole: UserRole, targetArea: 'admin' | 'student' | 'teacher'): boolean {
  // Clerk can access both admin and teacher areas
  if (userRole === 'clerk') {
    return targetArea === 'admin' || targetArea === 'teacher';
  }

  // Other roles can only access their own area
  return userRole === targetArea;
}

// Note: createUser function should be implemented in a server-side API route
// This file should only contain client-safe code (types, utilities, etc.) 