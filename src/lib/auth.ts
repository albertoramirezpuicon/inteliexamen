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

export async function createUser(
  email: string,
  password: string,
  role: UserRole,
  institution_id: number,
  given_name: string,
  family_name: string,
  language_preference: string = 'es'
): Promise<User> {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.inteli_users.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        institution_id,
        given_name,
        family_name,
        language_preference,
      },
    });

    return {
      id: user.id,
      institution_id: user.institution_id,
      email: user.email,
      given_name: user.given_name,
      family_name: user.family_name,
      role: user.role,
      language_preference: user.language_preference,
    };
  } catch (error) {
    console.error('User creation error:', error);
    throw error;
  }
} 