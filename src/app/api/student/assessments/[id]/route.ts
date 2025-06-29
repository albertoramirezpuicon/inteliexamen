import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const { id: assessmentId } = await params;

    if (!userId || !assessmentId) {
      return NextResponse.json(
        { error: 'User ID and Assessment ID are required' },
        { status: 400 }
      );
    }

    // Verify user has access to this assessment through their groups
    const accessQuery = `
      SELECT DISTINCT a.id
      FROM inteli_assessments a
      INNER JOIN inteli_assessments_groups ag ON a.id = ag.assessment_id
      INNER JOIN inteli_users_groups ug ON ag.group_id = ug.group_id
      WHERE a.id = ? AND ug.user_id = ? AND a.status = 'Active'
      AND NOW() BETWEEN a.available_from AND a.available_until
    `;

    const accessResult = await query(accessQuery, [assessmentId, userId]);
    
    if (!accessResult || accessResult.length === 0) {
      return NextResponse.json(
        { error: 'Assessment not found or access denied' },
        { status: 404 }
      );
    }

    // Get assessment details with skills and levels
    const assessmentQuery = `
      SELECT 
        a.id,
        a.name,
        a.description,
        a.case_text,
        a.questions_per_skill,
        a.output_language,
        a.difficulty_level,
        a.educational_level,
        a.evaluation_context,
        a.available_from,
        a.available_until,
        a.dispute_period,
        a.created_at,
        a.updated_at,
        u.given_name as teacher_given_name,
        u.family_name as teacher_family_name,
        g.name as group_name
      FROM inteli_assessments a
      LEFT JOIN inteli_users u ON a.teacher_id = u.id
      LEFT JOIN inteli_assessments_groups ag ON a.id = ag.assessment_id
      LEFT JOIN inteli_groups g ON ag.group_id = g.id
      WHERE a.id = ?
      LIMIT 1
    `;

    const assessmentResult = await query(assessmentQuery, [assessmentId]);
    console.log('Assessment query result:', assessmentResult);
    
    if (!assessmentResult || assessmentResult.length === 0) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    const assessment = assessmentResult[0];
    console.log('Selected assessment:', assessment);

    // Get skills associated with this assessment
    const skillsQuery = `
      SELECT 
        s.id,
        s.name,
        s.description
      FROM inteli_skills s
      INNER JOIN inteli_assessments_skills as2 ON s.id = as2.skill_id
      WHERE as2.assessment_id = ?
      ORDER BY s.name
    `;

    const skillsResult = await query(skillsQuery, [assessmentId]);

    // Get skill levels for each skill
    const skillsWithLevels = await Promise.all(
      skillsResult.map(async (skill: any) => {
        const levelsQuery = `
          SELECT 
            id,
            \`order\`,
            label,
            description
          FROM inteli_skills_levels
          WHERE skill_id = ?
          ORDER BY \`order\`
        `;
        
        const levelsResult = await query(levelsQuery, [skill.id]);
        
        return {
          ...skill,
          levels: levelsResult || []
        };
      })
    );

    const assessmentWithSkills = {
      ...assessment,
      skills: skillsWithLevels
    };

    return NextResponse.json({
      assessment: assessmentWithSkills
    });

  } catch (error) {
    console.error('Error loading assessment:', error);
    return NextResponse.json(
      { error: 'Failed to load assessment' },
      { status: 500 }
    );
  }
} 