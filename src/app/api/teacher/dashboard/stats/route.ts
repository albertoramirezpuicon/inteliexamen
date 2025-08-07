import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { validateTeacherAccess } from '@/lib/serverAuth';

interface CountResult {
  total: number;
}

interface RecentAttempt {
  id: number;
  student_name: string;
  assessment_name: string;
  status: string;
  created_at: string;
}

// GET - Get dashboard statistics for teacher
export async function GET(request: NextRequest) {
  try {
    // Validate teacher access
    const user = await validateTeacherAccess(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const teacherId = user.id.toString();
    const teacherInstitutionId = user.institution_id.toString();

    console.log('Teacher dashboard stats - Teacher ID:', teacherId, 'Institution ID:', teacherInstitutionId);

    // Get total students in teacher's institution
    const studentsResult = await query(
      `SELECT COUNT(*) as total
       FROM inteli_users
       WHERE institution_id = ? AND role = 'student'`,
      [teacherInstitutionId]
    ) as CountResult[];

    // Get total groups in teacher's institution
    const groupsResult = await query(
      `SELECT COUNT(*) as total
       FROM inteli_groups
       WHERE institution_id = ?`,
      [teacherInstitutionId]
    ) as CountResult[];

    // Get total domains in teacher's institution
    const domainsResult = await query(
      `SELECT COUNT(*) as total
       FROM inteli_domains
       WHERE institution_id = ?`,
      [teacherInstitutionId]
    ) as CountResult[];

    // Get total skills in teacher's institution
    const skillsResult = await query(
      `SELECT COUNT(*) as total
       FROM inteli_skills s
       JOIN inteli_domains d ON s.domain_id = d.id
       WHERE d.institution_id = ?`,
      [teacherInstitutionId]
    ) as CountResult[];

    // Get total assessments where teacher is responsible
    const assessmentsResult = await query(
      `SELECT COUNT(*) as total
       FROM inteli_assessments
       WHERE teacher_id = ?`,
      [teacherId]
    ) as CountResult[];

    // Get total attempts for teacher's assessments
    const attemptsResult = await query(
      `SELECT COUNT(*) as total
       FROM inteli_assessments_attempts att
       JOIN inteli_assessments a ON att.assessment_id = a.id
       WHERE a.teacher_id = ?`,
      [teacherId]
    ) as CountResult[];

    // Get active assessments count
    const activeAssessmentsResult = await query(
      `SELECT COUNT(*) as total
       FROM inteli_assessments
       WHERE teacher_id = ? AND status = 'Active'`,
      [teacherId]
    ) as CountResult[];

    // Get completed assessments count
    const completedAssessmentsResult = await query(
      `SELECT COUNT(*) as total
       FROM inteli_assessments
       WHERE teacher_id = ? AND status = 'Inactive'`,
      [teacherId]
    ) as CountResult[];

    // Get recent attempts (last 5)
    const recentAttemptsResult = await query(
      `SELECT 
        att.id,
        CONCAT(u.given_name, ' ', u.family_name) as student_name,
        a.name as assessment_name,
        att.status,
        att.created_at
       FROM inteli_assessments_attempts att
       JOIN inteli_assessments a ON att.assessment_id = a.id
       JOIN inteli_users u ON att.user_id = u.id
       WHERE a.teacher_id = ?
       ORDER BY att.created_at DESC
       LIMIT 5`,
      [teacherId]
    ) as RecentAttempt[];

    const stats = {
      totalStudents: studentsResult[0]?.total || 0,
      totalGroups: groupsResult[0]?.total || 0,
      totalDomains: domainsResult[0]?.total || 0,
      totalSkills: skillsResult[0]?.total || 0,
      totalAssessments: assessmentsResult[0]?.total || 0,
      totalAttempts: attemptsResult[0]?.total || 0,
      activeAssessments: activeAssessmentsResult[0]?.total || 0,
      completedAssessments: completedAssessmentsResult[0]?.total || 0,
      recentAttempts: recentAttemptsResult || []
    };

    console.log('Dashboard stats:', stats);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching teacher dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
} 