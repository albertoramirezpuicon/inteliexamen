import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';

export async function POST(request: NextRequest) {
  try {
    const { 
      assessmentDescription, 
      difficultyLevel, 
      educationalLevel, 
      outputLanguage, 
      evaluationContext, 
      domainName, 
      skillName, 
      skillDescription 
    } = await request.json();

    if (!assessmentDescription || !difficultyLevel || !educationalLevel || !outputLanguage || 
        !evaluationContext || !domainName || !skillName || !skillDescription) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const caseText = await generateCase({
      assessmentDescription,
      difficultyLevel,
      educationalLevel,
      outputLanguage,
      evaluationContext,
      domainName,
      skillName,
      skillDescription
    });

    return NextResponse.json({ caseText });
  } catch (error) {
    console.error('Error generating case:', error);
    return NextResponse.json(
      { error: 'Failed to generate case' },
      { status: 500 }
    );
  }
}

async function generateCase(params: {
  assessmentDescription: string;
  difficultyLevel: string;
  educationalLevel: string;
  outputLanguage: string;
  evaluationContext: string;
  domainName: string;
  skillName: string;
  skillDescription: string;
}): Promise<string> {
  const {
    assessmentDescription,
    difficultyLevel,
    educationalLevel,
    outputLanguage,
    evaluationContext,
    domainName,
    skillName,
    skillDescription
  } = params;

  const prompt = createCasePrompt({
    assessmentDescription,
    difficultyLevel,
    educationalLevel,
    outputLanguage,
    evaluationContext,
    domainName,
    skillName,
    skillDescription
  });

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { 
          role: 'system', 
          content: outputLanguage === 'es' 
            ? 'Eres un experto en diseño educativo especializado en crear casos de evaluación realistas y desafiantes.'
            : 'You are an expert educational designer specialized in creating realistic and challenging assessment cases.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 3000,
      temperature: 0.7,
      n: 1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function createCasePrompt(params: {
  assessmentDescription: string;
  difficultyLevel: string;
  educationalLevel: string;
  outputLanguage: string;
  evaluationContext: string;
  domainName: string;
  skillName: string;
  skillDescription: string;
}): string {
  const {
    assessmentDescription,
    difficultyLevel,
    educationalLevel,
    outputLanguage,
    evaluationContext,
    domainName,
    skillName,
    skillDescription
  } = params;

  if (outputLanguage === 'es') {
    return `Crea un caso de evaluación escrito DIRECTAMENTE para estudiantes que van a leerlo durante su evaluación.

CONTEXTO DE LA EVALUACIÓN:
${assessmentDescription}

NIVEL DE DIFICULTAD: ${difficultyLevel}
NIVEL EDUCATIVO: ${educationalLevel}
CONTEXTO EDUCATIVO: ${evaluationContext}

HABILIDAD A EVALUAR: ${skillName}
DESCRIPCIÓN DE LA HABILIDAD: ${skillDescription}

INSTRUCCIONES IMPORTANTES:
- El texto debe estar escrito DIRECTAMENTE para estudiantes, no para profesores
- Usa un lenguaje apropiado para el nivel educativo (${educationalLevel})
- Adapta la complejidad al nivel de dificultad (${difficultyLevel})
- NO incluyas notas para el profesor, metadescripciones o mensajes explicativos
- El texto debe ser completamente legible por estudiantes
- Incluye elementos culturales y contextuales basados en: ${evaluationContext}

ESTRUCTURA DEL CASO:
1. **Escenario principal**: Una situación realista que los estudiantes puedan comprender
2. **Desarrollo del caso**: Detalles relevantes que presenten desafíos apropiados
3. **Preguntas de reflexión**: Al final, incluye 3-5 preguntas que:
   - Estén escritas directamente para el estudiante
   - Requieran reflexión profunda sobre la habilidad
   - Sean apropiadas para el nivel educativo y dificultad
   - No sean preguntas de sí/no

FORMATO:
- Usa **negritas** para enfatizar elementos importantes
- Usa *cursivas* para términos técnicos o conceptos clave
- Puedes usar emojis apropiados para hacer el caso más atractivo
- Máximo 8192 caracteres
- El texto debe fluir naturalmente como una lectura para estudiantes

IMPORTANTE: El caso debe ser específico para la habilidad "${skillName}" y no genérico.`;
  } else {
    return `Create an assessment case written DIRECTLY for students who will read it during their assessment.

EVALUATION CONTEXT:
${assessmentDescription}

DIFFICULTY LEVEL: ${difficultyLevel}
EDUCATIONAL LEVEL: ${educationalLevel}
EDUCATIONAL CONTEXT: ${evaluationContext}

SKILL TO EVALUATE: ${skillName}
SKILL DESCRIPTION: ${skillDescription}

IMPORTANT INSTRUCTIONS:
- The text must be written DIRECTLY for students, not for teachers
- Use language appropriate for the educational level (${educationalLevel})
- Adapt complexity to the difficulty level (${difficultyLevel})
- DO NOT include notes for teachers, meta-descriptions, or explanatory messages
- The text must be completely readable by students
- Include cultural and contextual elements based on: ${evaluationContext}

CASE STRUCTURE:
1. **Main scenario**: A realistic situation that students can understand
2. **Case development**: Relevant details that present appropriate challenges
3. **Reflection questions**: At the end, include 3-5 questions that:
   - Are written directly for the student
   - Require deep reflection on the skill
   - Are appropriate for the educational level and difficulty
   - Are not yes/no questions

FORMAT:
- Use **bold** to emphasize important elements
- Use *italics* for technical terms or key concepts
- You can use appropriate emojis to make the case more attractive
- Maximum 8192 characters
- The text should flow naturally as a reading for students

IMPORTANT: The case must be specific to the skill "${skillName}" and not generic.`;
  }
} 