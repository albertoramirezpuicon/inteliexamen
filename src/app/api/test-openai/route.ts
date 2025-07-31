import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const testResult = {
      timestamp: new Date().toISOString(),
      apiKeyConfigured: !!OPENAI_API_KEY,
      apiKeyLength: OPENAI_API_KEY ? OPENAI_API_KEY.length : 0,
      apiKeyPrefix: OPENAI_API_KEY ? OPENAI_API_KEY.substring(0, 7) + '...' : 'not set',
      tests: {
        chatCompletion: { success: false, error: null as string | null },
        embedding: { success: false, error: null as string | null }
      }
    };

    if (!OPENAI_API_KEY) {
      return NextResponse.json({
        ...testResult,
        error: 'OPENAI_API_KEY environment variable is not set'
      }, { status: 503 });
    }

    // Test 1: Chat Completion
    try {
      console.log('Testing OpenAI Chat Completion...');
      const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10,
          temperature: 0
        })
      });

      if (chatResponse.ok) {
        testResult.tests.chatCompletion.success = true;
        console.log('Chat completion test: SUCCESS');
      } else {
        const errorData = await chatResponse.json().catch(() => ({}));
        testResult.tests.chatCompletion.error = errorData.error?.message || `HTTP ${chatResponse.status}`;
        console.log('Chat completion test: FAILED -', testResult.tests.chatCompletion.error);
      }
    } catch (error) {
      testResult.tests.chatCompletion.error = error instanceof Error ? error.message : 'Unknown error';
      console.log('Chat completion test: ERROR -', testResult.tests.chatCompletion.error);
    }

    // Test 2: Embedding
    try {
      console.log('Testing OpenAI Embedding...');
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: 'Hello world'
        })
      });

      if (embeddingResponse.ok) {
        testResult.tests.embedding.success = true;
        console.log('Embedding test: SUCCESS');
      } else {
        const errorData = await embeddingResponse.json().catch(() => ({}));
        testResult.tests.embedding.error = errorData.error?.message || `HTTP ${embeddingResponse.status}`;
        console.log('Embedding test: FAILED -', testResult.tests.embedding.error);
      }
    } catch (error) {
      testResult.tests.embedding.error = error instanceof Error ? error.message : 'Unknown error';
      console.log('Embedding test: ERROR -', testResult.tests.embedding.error);
    }

    const allTestsPassed = testResult.tests.chatCompletion.success && testResult.tests.embedding.success;
    const statusCode = allTestsPassed ? 200 : 503;

    return NextResponse.json(testResult, { status: statusCode });

  } catch (error) {
    console.error('OpenAI test error:', error);
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      apiKeyConfigured: !!OPENAI_API_KEY,
      error: 'Test failed: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
} 