import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';

export async function POST(request: NextRequest) {
  try {
    const { 
      context, 
      mainScenario, 
      skills, 
      difficultyLevel, 
      educationalLevel, 
      outputLanguage 
    } = await request.json();

    if (!context || !mainScenario || !skills || skills.length === 0) {
      return NextResponse.json(
        { error: 'Context, main scenario, and skills are required' },
        { status: 400 }
      );
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const questions = await generateQuestions({
      context,
      mainScenario,
      skills,
      difficultyLevel,
      educationalLevel,
      outputLanguage
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}

async function generateQuestions(params: {
  context: string;
  mainScenario: string;
  skills: Array<{
    id: number;
    name: string;
    description: string;
    domainName: string;
  }>;
  difficultyLevel: string;
  educationalLevel: string;
  outputLanguage: string;
}): Promise<string> {
  const { context, mainScenario, skills, difficultyLevel, educationalLevel, outputLanguage } = params;

  const prompt = createQuestionsPrompt({
    context,
    mainScenario,
    skills,
    difficultyLevel,
    educationalLevel,
    outputLanguage
  });

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational assessment designer. Your task is to generate thoughtful reflection questions based on a case scenario.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const generatedQuestions = data.choices[0]?.message?.content;

  if (!generatedQuestions) {
    throw new Error('No questions generated');
  }

  return generatedQuestions;
}

function createQuestionsPrompt(params: {
  context: string;
  mainScenario: string;
  skills: Array<{
    id: number;
    name: string;
    description: string;
    domainName: string;
  }>;
  difficultyLevel: string;
  educationalLevel: string;
  outputLanguage: string;
}): string {
  const { context, mainScenario, skills, difficultyLevel, educationalLevel, outputLanguage } = params;

  const skillsList = skills.map(skill => 
    `• ${skill.name} (${skill.domainName}): ${skill.description}`
  ).join('\n');

  return `Generate 5-8 thoughtful reflection questions based on the following case scenario.

CASE CONTEXT:
${context}

MAIN SCENARIO:
${mainScenario}

SKILLS TO EVALUATE (${skills.length} skills):
${skillsList}

DIFFICULTY LEVEL: ${difficultyLevel}
EDUCATIONAL LEVEL: ${educationalLevel}
OUTPUT LANGUAGE: ${outputLanguage}

INSTRUCTIONS:
- Generate questions that require deep reflection and critical thinking
- Questions should be appropriate for the educational level (${educationalLevel})
- Adapt complexity to the difficulty level (${difficultyLevel})
- Questions must be written directly for students
- Avoid yes/no questions - focus on open-ended reflection
- Ensure questions cover all the skills being evaluated
- Questions should encourage students to connect theory with practice
- Use language appropriate for the educational level
- Make questions engaging and thought-provoking

FORMAT:
- Number each question (1., 2., 3., etc.)
- Use clear, direct language
- Keep each question focused on one or two related skills
- Maximum 1000 characters total

IMPORTANT: The questions must be written in ${outputLanguage === 'es' ? 'Spanish' : 'English'} and should flow naturally as a cohesive set of reflection prompts.`;
} 