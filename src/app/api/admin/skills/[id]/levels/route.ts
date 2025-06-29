import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Get skill levels for a specific skill
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get the skill with institution info
    const [skill] = await query(
      `SELECT s.id, s.name, s.description, s.institution_id, i.name as institution_name
       FROM inteli_skills s
       LEFT JOIN inteli_institutions i ON s.institution_id = i.id
       WHERE s.id = ?`,
      [id]
    );
    
    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    // Get institution's level settings (template)
    const levelSettings = await query(
      `SELECT id, \`order\`, label, description
       FROM inteli_skills_levels_settings
       WHERE institution_id = ?
       ORDER BY \`order\``,
      [skill.institution_id]
    );

    // Get existing skill levels
    const skillLevels = await query(
      `SELECT id, \`order\`, label, description
       FROM inteli_skills_levels
       WHERE skill_id = ?
       ORDER BY \`order\``,
      [id]
    );

    return NextResponse.json({
      skill,
      levelSettings,
      skillLevels
    });
  } catch (error) {
    console.error('Error fetching skill levels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skill levels' },
      { status: 500 }
    );
  }
}

// POST - Create/Update skill levels for a skill
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { levels } = await request.json();

    if (!levels || !Array.isArray(levels)) {
      return NextResponse.json(
        { error: 'Levels array is required' },
        { status: 400 }
      );
    }

    // Get the skill with institution info
    const [skill] = await query(
      `SELECT s.id, s.name, s.description, s.institution_id, i.name as institution_name
       FROM inteli_skills s
       LEFT JOIN inteli_institutions i ON s.institution_id = i.id
       WHERE s.id = ?`,
      [id]
    );
    
    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    // Get institution's level settings (template)
    const levelSettings = await query(
      `SELECT id, \`order\`, label, description
       FROM inteli_skills_levels_settings
       WHERE institution_id = ?
       ORDER BY \`order\``,
      [skill.institution_id]
    );

    // Validate that levels match institution template
    if (levels.length !== levelSettings.length) {
      return NextResponse.json(
        { error: `Skill must have exactly ${levelSettings.length} levels as defined by the institution` },
        { status: 400 }
      );
    }

    // Validate each level matches the template
    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      const template = levelSettings[i];
      
      if (level.order !== template.order || level.label !== template.label) {
        return NextResponse.json(
          { error: `Level ${i + 1} must match institution template (order: ${template.order}, label: ${template.label})` },
          { status: 400 }
        );
      }
      
      if (!level.description || level.description.trim() === '') {
        return NextResponse.json(
          { error: `Description is required for level: ${template.label}` },
          { status: 400 }
        );
      }
    }

    // Delete existing skill levels
    await query('DELETE FROM inteli_skills_levels WHERE skill_id = ?', [id]);

    // Insert new skill levels
    for (const level of levels) {
      await query(
        `INSERT INTO inteli_skills_levels (skill_id, \`order\`, label, description)
         VALUES (?, ?, ?, ?)`,
        [id, level.order, level.label, level.description.trim()]
      );
    }

    // Get updated skill levels
    const updatedLevels = await query(
      `SELECT id, \`order\`, label, description
       FROM inteli_skills_levels
       WHERE skill_id = ?
       ORDER BY \`order\``,
      [id]
    );

    return NextResponse.json({
      message: 'Skill levels updated successfully',
      skillLevels: updatedLevels
    });
  } catch (error) {
    console.error('Error updating skill levels:', error);
    return NextResponse.json(
      { error: 'Failed to update skill levels' },
      { status: 500 }
    );
  }
} 