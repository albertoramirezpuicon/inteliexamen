import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Get institutions for dropdown
export async function GET() {
  try {
    const institutions = await query(
      `SELECT 
        id, 
        name
      FROM inteli_institutions 
      ORDER BY name`
    );

    return NextResponse.json({ institutions });
  } catch (error) {
    console.error('Error fetching institutions list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch institutions' },
      { status: 500 }
    );
  }
} 