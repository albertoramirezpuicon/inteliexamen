import { NextRequest, NextResponse } from 'next/server';
import { query, updateQuery } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId, language } = await request.json();

    if (!userId || !language) {
      return NextResponse.json(
        { error: 'User ID and language are required' },
        { status: 400 }
      );
    }

    // Validate language
    if (!['en', 'es'].includes(language)) {
      return NextResponse.json(
        { error: 'Invalid language. Must be "en" or "es"' },
        { status: 400 }
      );
    }

    // Update user's language preference
    const result = await updateQuery(
      'UPDATE inteli_users SET language_preference = ?, updated_at = NOW() WHERE id = ?',
      [language, userId]
    );

    // Check if the update was successful
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Language preference updated successfully',
        language 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating language preference:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 