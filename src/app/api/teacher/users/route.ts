import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Get students from teacher's institution
export async function GET(request: NextRequest) {
  try {
    // Get teacher's institution ID from the request
    // The frontend should send this in the request body or we can get it from headers
    const teacherInstitutionId = request.headers.get('x-institution-id');

    if (!teacherInstitutionId) {
      return NextResponse.json(
        { error: 'Teacher institution ID not provided' },
        { status: 400 }
      );
    }

    console.log('Teacher users - Institution ID:', teacherInstitutionId);

    // Get students from teacher's institution
    const studentsResult = await query(
      `SELECT 
        id,
        email,
        given_name,
        family_name,
        created_at
       FROM inteli_users
       WHERE institution_id = ? AND role = 'student'
       ORDER BY given_name, family_name`,
      [teacherInstitutionId]
    ) as any[];

    console.log('Found students:', studentsResult.length);

    return NextResponse.json({
      students: studentsResult
    });
  } catch (error) {
    console.error('Error fetching teacher users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
} 