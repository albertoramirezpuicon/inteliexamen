import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Get all skills with institution and domain info
export async function GET() {
  try {
    const skills = await query(
      `SELECT 
        s.id, 
        s.institution_id, 
        s.domain_id, 
        s.name, 
        s.description, 
        i.name as institution_name, 
        d.name as domain_name
      FROM inteli_skills s
      LEFT JOIN inteli_institutions i ON s.institution_id = i.id
      LEFT JOIN inteli_domains d ON s.domain_id = d.id
      ORDER BY i.name, d.name, s.name`
    );
    return NextResponse.json({ skills });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

// POST - Create new skill
export async function POST(request: Request) {
  try {
    const { institution_id, domain_id, name, description } = await request.json();
    if (!institution_id || !domain_id || !name || !description) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      );
    }
    // Check if institution and domain exist
    const [inst] = await query('SELECT id FROM inteli_institutions WHERE id = ?', [institution_id]);
    if (!inst) {
      return NextResponse.json({ error: 'Institution does not exist.' }, { status: 400 });
    }
    const [dom] = await query('SELECT id FROM inteli_domains WHERE id = ?', [domain_id]);
    if (!dom) {
      return NextResponse.json({ error: 'Domain does not exist.' }, { status: 400 });
    }
    // Check for duplicate name in the same domain
    const existing = await query('SELECT id FROM inteli_skills WHERE name = ? AND domain_id = ?', [name.trim(), domain_id]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'A skill with this name already exists in this domain.' }, { status: 409 });
    }
    // Insert
    const result = await query(
      `INSERT INTO inteli_skills (institution_id, domain_id, name, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [institution_id, domain_id, name.trim(), description.trim()]
    );
    // Return the created skill with info
    const [skill] = await query(
      `SELECT 
        s.id, 
        s.institution_id, 
        s.domain_id, 
        s.name, 
        s.description, 
        i.name as institution_name, 
        d.name as domain_name
      FROM inteli_skills s
      LEFT JOIN inteli_institutions i ON s.institution_id = i.id
      LEFT JOIN inteli_domains d ON s.domain_id = d.id
      WHERE s.id = ?`,
      [result.insertId]
    );
    return NextResponse.json({ skill, message: 'Skill created successfully' });
  } catch (error) {
    console.error('Error creating skill:', error);
    return NextResponse.json(
      { error: 'Failed to create skill' },
      { status: 500 }
    );
  }
} 