import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';

export async function POST(request: NextRequest) {
  try {
    const { domainName, domainDescription, language = 'es' } = await request.json();

    if (!domainName || !domainDescription) {
      return NextResponse.json(
        { error: 'Domain name and description are required' },
        { status: 400 }
      );
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const suggestions = await generateSkillSuggestions(domainName, domainDescription, language);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating domain skill suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

async function generateSkillSuggestions(domainName: string, domainDescription: string, language: string): Promise<Array<{ name: string; description: string }>> {
  const prompt = createSkillSuggestionsPrompt(domainName, domainDescription, language);
  const response = await callOpenAI(prompt, language);
  
  return parseSkillSuggestions(response);
}

function createSkillSuggestionsPrompt(domainName: string, domainDescription: string, language: string): string {
  if (language === 'es') {
    return `Eres un experto en diseño educativo especializado en identificar habilidades relevantes para dominios académicos. Tu tarea es sugerir 10 habilidades específicas que serían apropiadas para el dominio dado.

DOMINIO: "${domainName}"
DESCRIPCIÓN DEL DOMINIO: "${domainDescription}"

INSTRUCCIONES:
1. Genera exactamente 10 habilidades relevantes para este dominio
2. Cada habilidad debe incluir un nombre claro y una descripción específica
3. Las habilidades deben ser específicas y medibles
4. Considera diferentes niveles de complejidad
5. Evita habilidades demasiado genéricas o vagas
6. Las habilidades deben ser relevantes para el contexto educativo

FORMATO DE RESPUESTA:
Responde con exactamente 10 habilidades en el siguiente formato:
NOMBRE: [nombre de la habilidad]
DESCRIPCIÓN: [descripción específica de la habilidad]
---
NOMBRE: [nombre de la habilidad]
DESCRIPCIÓN: [descripción específica de la habilidad]
---
... (continuar para las 10 habilidades)`;
  } else {
    return `You are an expert educational designer specialized in identifying relevant skills for academic domains. Your task is to suggest 10 specific skills that would be appropriate for the given domain.

DOMAIN: "${domainName}"
DOMAIN DESCRIPTION: "${domainDescription}"

INSTRUCTIONS:
1. Generate exactly 10 relevant skills for this domain
2. Each skill must include a clear name and specific description
3. Skills should be specific and measurable
4. Consider different levels of complexity
5. Avoid skills that are too generic or vague
6. Skills should be relevant for the educational context

RESPONSE FORMAT:
Respond with exactly 10 skills in the following format:
NAME: [skill name]
DESCRIPTION: [specific skill description]
---
NAME: [skill name]
DESCRIPTION: [specific skill description]
---
... (continue for all 10 skills)`;
  }
}

async function callOpenAI(prompt: string, language: string): Promise<string> {
  const systemPrompt = language === 'es' 
    ? 'Eres un experto en diseño educativo. Genera sugerencias precisas y contextuales para habilidades de dominio académico.'
    : 'You are an expert educational designer. Generate precise and contextual suggestions for academic domain skills.';

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

function parseSkillSuggestions(response: string): Array<{ name: string; description: string }> {
  const suggestions: Array<{ name: string; description: string }> = [];
  
  // Split by the separator
  const parts = response.split('---');
  
  for (const part of parts) {
    const trimmedPart = part.trim();
    if (!trimmedPart) continue;
    
    // Extract name and description
    const nameMatch = trimmedPart.match(/NOMBRE:\s*(.+?)(?:\n|$)/i) || trimmedPart.match(/NAME:\s*(.+?)(?:\n|$)/i);
    const descriptionMatch = trimmedPart.match(/DESCRIPCIÓN:\s*(.+?)(?:\n|$)/i) || trimmedPart.match(/DESCRIPTION:\s*(.+?)(?:\n|$)/i);
    
    if (nameMatch && descriptionMatch) {
      suggestions.push({
        name: nameMatch[1].trim(),
        description: descriptionMatch[1].trim()
      });
    }
  }
  
  return suggestions.slice(0, 10); // Ensure we don't exceed 10 suggestions
} 