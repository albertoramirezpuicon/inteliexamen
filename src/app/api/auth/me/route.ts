import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from session or token
    // For now, we'll use a simple approach - you may need to adjust based on your auth system
    const userId = request.headers.get('x-user-id') || 
                   request.cookies.get('user-id')?.value ||
                   '1'; // Fallback for development

    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get user data from database
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
      WHERE u.id = ?`,
      [userId]
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        given_name: user.given_name,
        family_name: user.family_name,
        role: user.role,
        institution_id: user.institution_id,
        institution_name: user.institution_name
      }
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
} 