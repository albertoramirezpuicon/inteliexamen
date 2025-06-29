import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';

export async function POST(request: NextRequest) {
  try {
    const { skillName, skillDescription, levelSettings, language = 'es' } = await request.json();

    if (!skillName || !skillDescription || !levelSettings || !Array.isArray(levelSettings)) {
      return NextResponse.json(
        { error: 'Skill name, description, and level settings are required' },
        { status: 400 }
      );
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Generate all levels at once with full context
    const suggestions = await generateAllLevelsAtOnce(skillName, skillDescription, levelSettings, language);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating skill level suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

async function generateAllLevelsAtOnce(skillName: string, skillDescription: string, levelSettings: any[], language: string): Promise<string[]> {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const prompt = createComprehensivePrompt(skillName, skillDescription, levelSettings, language);
      const response = await callOpenAI(prompt, language);
      
      // Parse the response and validate
      const suggestions = parseAndValidateResponse(response, levelSettings.length);
      
      if (suggestions.length === levelSettings.length) {
        return suggestions;
      }
      
      console.warn(`Attempt ${attempt}: Generated ${suggestions.length} levels, expected ${levelSettings.length}. Retrying...`);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to generate correct number of levels after ${maxRetries} attempts`);
      }
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
  
  throw new Error('Failed to generate suggestions after all retries');
}

function createComprehensivePrompt(skillName: string, skillDescription: string, levelSettings: any[], language: string): string {
  const levelInfo = levelSettings.map((level, index) => 
    `NIVEL ${level.order} - "${level.label}": ${level.description}`
  ).join('\n');

  if (language === 'es') {
    return `Eres un experto en diseño educativo especializado en crear descripciones de niveles de dominio de habilidades. Tu tarea es generar descripciones específicas de comportamiento estudiantil para TODOS los niveles de una habilidad, considerando la progresión completa.

HABILIDAD: "${skillName}"
DESCRIPCIÓN DE LA HABILIDAD: "${skillDescription}"
Esta es la descripción general de la habilidad, la cual se descompone en diversos niveles de dominio (o nivel de logro o de desarrollo).

NIVELES A DESCRIBIR:
${levelInfo}

INSTRUCCIONES CRÍTICAS:
1. Genera EXACTAMENTE ${levelSettings.length} descripciones, una para cada nivel
2. Cada nivel debe construir EXPLÍCITAMENTE sobre el anterior y preparar para el siguiente
3. Usa referencias explícitas entre niveles (ej: "Avanzando desde el nivel anterior...", "Preparándose para el siguiente nivel...")
4. EVITA repeticiones, superposiciones o brechas entre niveles
5. Mantén terminología consistente en todos los niveles
6. Cada descripción debe ser específica para esta habilidad, no genérica
7. Incluye: comportamientos específicos, evidencias de aprendizaje, limitaciones típicas, y tipo de apoyo necesario, para eso puedes consultar la literatura vigente y especializada de la habilidad ${skillName}

FORMATO DE RESPUESTA:
Responde con exactamente ${levelSettings.length} descripciones, separadas por "---NIVEL---". Cada descripción debe ser completa y contextual.

Ejemplo de estructura:
NIVEL 1: [descripción completa]
---NIVEL---
NIVEL 2: [descripción que referencia al nivel 1 y prepara para el nivel 3]
---NIVEL---
NIVEL 3: [descripción que referencia al nivel 2 y prepara para el nivel 4]
...`;
  } else {
    return `You are an expert educational designer specialized in creating skill mastery level descriptions. Your task is to generate specific student behavior descriptions for ALL levels of a skill, considering the complete progression.

SKILL: "${skillName}"
SKILL DESCRIPTION: "${skillDescription}"

LEVELS TO DESCRIBE:
${levelInfo}

CRITICAL INSTRUCTIONS:
1. Generate EXACTLY ${levelSettings.length} descriptions, one for each level
2. Each level must EXPLICITLY build upon the previous and prepare for the next
3. Use explicit references between levels (e.g., "Building on the previous level...", "Preparing for the next level...")
4. AVOID repetitions, overlaps, or gaps between levels
5. Maintain consistent terminology across all levels
6. Each description must be specific to this skill, not generic
7. Include: specific behaviors, evidence of learning, typical limitations, and type of support needed, for that you can consult the literature of the skill ${skillName}

RESPONSE FORMAT:
Respond with exactly ${levelSettings.length} descriptions, separated by "---LEVEL---". Each description must be complete and contextual.

Example structure:
LEVEL 1: [complete description]
---LEVEL---
LEVEL 2: [description that references level 1 and prepares for level 3]
---LEVEL---
LEVEL 3: [description that references level 2 and prepares for level 4]
...`;
  }
}

async function callOpenAI(prompt: string, language: string): Promise<string> {
  const systemPrompt = language === 'es' 
    ? 'Eres un experto en diseño educativo. Genera descripciones precisas y contextuales para niveles de dominio de habilidades.'
    : 'You are an expert educational designer. Generate precise and contextual descriptions for skill mastery levels.';

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
        { role: 'user', content: prompt },
      ],
      max_tokens: 2000,
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

function parseAndValidateResponse(response: string, expectedLevels: number): string[] {
  // Split by the level separator
  const parts = response.split(/---NIVEL---|---LEVEL---/);
  
  // Clean and filter the parts
  const suggestions = parts
    .map(part => part.trim())
    .filter(part => part.length > 0)
    .map(part => {
      // Remove level headers if present
      return part.replace(/^NIVEL \d+:|^LEVEL \d+:/, '').trim();
    })
    .filter(part => part.length > 0);

  return suggestions;
} 