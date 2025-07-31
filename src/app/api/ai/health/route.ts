import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function GET(request: NextRequest) {
  try {
    const healthCheck = {
      timestamp: new Date().toISOString(),
      status: 'checking',
      apiKeyConfigured: !!OPENAI_API_KEY,
      apiKeyLength: OPENAI_API_KEY ? OPENAI_API_KEY.length : 0,
      apiKeyPrefix: OPENAI_API_KEY ? OPENAI_API_KEY.substring(0, 7) + '...' : 'not set',
      errors: [] as string[]
    };

    // Check if API key is configured
    if (!OPENAI_API_KEY) {
      healthCheck.status = 'error';
      healthCheck.errors.push('OPENAI_API_KEY environment variable is not set');
      return NextResponse.json(healthCheck, { status: 503 });
    }

    // Test API connectivity with a simple request
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'user', content: 'Hello' }
          ],
          max_tokens: 10,
          temperature: 0
        })
      });

      if (response.ok) {
        healthCheck.status = 'healthy';
      } else {
        healthCheck.status = 'error';
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
        healthCheck.errors.push(`OpenAI API error: ${errorMessage}`);
      }
    } catch (networkError) {
      healthCheck.status = 'error';
      healthCheck.errors.push(`Network error: ${networkError instanceof Error ? networkError.message : 'Unknown network error'}`);
    }

    const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
    return NextResponse.json(healthCheck, { status: statusCode });

  } catch (error) {
    console.error('AI health check error:', error);
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      apiKeyConfigured: !!OPENAI_API_KEY,
      errors: ['Health check failed: ' + (error instanceof Error ? error.message : 'Unknown error')]
    }, { status: 500 });
  }
} 