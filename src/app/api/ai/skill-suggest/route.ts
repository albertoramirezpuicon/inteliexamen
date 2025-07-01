import { NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o'; // o4-mini is not a public model, use gpt-4o for now

export async function POST(req: Request) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured.' }, { status: 500 });
    }
    const body = await req.json();
    const { type, context, level, language, idea } = body;
    if (!type || !context || !level || !language || !idea) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    if (!['name', 'description'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type.' }, { status: 400 });
    }
    // Compose the system and user prompt
    let systemPrompt = '';
    let userPrompt = '';
    if (type === 'name') {
      systemPrompt = `You are an expert educational designer. Suggest up to 4 concise, clear, and context-appropriate skill names for a curriculum. Each name should be suitable for the given instructional level and educational context, and in the requested language. Return only the list of names, separated by newlines.`;
      userPrompt = `Rough idea: ${idea}\nInstructional level: ${level}\nEducational context: ${context}\nOutput language: ${language}`;
    } else {
      systemPrompt = `You are an expert educational designer. Suggest up to 4 clear, context-appropriate skill descriptions for a curriculum. Each description should explain what having the skill implies and how it is visible in a person, considering the educational context and level. Return only the list of descriptions, separated by newlines.`;
      userPrompt = `General idea: ${idea}\nInstructional level: ${level}\nEducational context: ${context}\nOutput language: ${language}`;
    }
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 512,
        temperature: 0.7,
        n: 1,
      }),
    });
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: 'OpenAI error: ' + error }, { status: 500 });
    }
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    // Split into up to 4 suggestions
    const suggestions = text
      .split('\n')
      .map((s: string) => s.trim())
      .filter(Boolean)
      .slice(0, 4);
    return NextResponse.json({ suggestions });
  } catch (error) {
    return NextResponse.json({ error: 'Server error: ' + (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
} 