import { NextRequest } from 'next/server';
import { query } from '@/lib/db';

export interface AuthenticatedUser {
  id: number;
  email: string;
  given_name: string;
  family_name: string;
  role: string;
  institution_id: number;
  institution_name: string;
}

export async function validateTeacherAccess(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const teacherId = request.headers.get('x-user-id');
    const institutionId = request.headers.get('x-institution-id');

    if (!teacherId || !institutionId) {
      return null;
    }

    // Validate user exists and has teacher role
    const [user] = await query(
      `SELECT 
        u.id,
        u.email,
        u.given_name,
        u.family_name,
        u.role,
        u.institution_id,
        i.name as institution_name
       FROM inteli_users u
       LEFT JOIN inteli_institutions i ON u.institution_id = i.id
       WHERE u.id = ? AND u.institution_id = ? AND (u.role = 'teacher' OR u.role = 'clerk')`,
      [parseInt(teacherId), parseInt(institutionId)]
    ) as AuthenticatedUser[];

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error validating teacher access:', error);
    return null;
  }
}

export async function validateAdminAccess(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const adminId = request.headers.get('x-user-id');
    const institutionId = request.headers.get('x-institution-id');

    if (!adminId || !institutionId) {
      return null;
    }

    // Validate user exists and has admin role
    const [user] = await query(
      `SELECT 
        u.id,
        u.email,
        u.given_name,
        u.family_name,
        u.role,
        u.institution_id,
        i.name as institution_name
       FROM inteli_users u
       LEFT JOIN inteli_institutions i ON u.institution_id = i.id
       WHERE u.id = ? AND u.institution_id = ? AND (u.role = 'admin' OR u.role = 'clerk')`,
      [parseInt(adminId), parseInt(institutionId)]
    ) as AuthenticatedUser[];

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error validating admin access:', error);
    return null;
  }
}

export async function validateStudentAccess(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const studentId = request.headers.get('x-user-id');
    const institutionId = request.headers.get('x-institution-id');

    if (!studentId || !institutionId) {
      return null;
    }

    // Validate user exists and has student role
    const [user] = await query(
      `SELECT 
        u.id,
        u.email,
        u.given_name,
        u.family_name,
        u.role,
        u.institution_id,
        i.name as institution_name
       FROM inteli_users u
       LEFT JOIN inteli_institutions i ON u.institution_id = i.id
       WHERE u.id = ? AND u.institution_id = ? AND u.role = 'student'`,
      [parseInt(studentId), parseInt(institutionId)]
    ) as AuthenticatedUser[];

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error validating student access:', error);
    return null;
  }
}
