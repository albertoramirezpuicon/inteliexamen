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
      selectedSkills
    } = await request.json();

    if (!assessmentDescription || !difficultyLevel || !educationalLevel || !outputLanguage || 
        !evaluationContext || !selectedSkills || selectedSkills.length === 0) {
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
      selectedSkills
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
  selectedSkills: Array<{
    id: number;
    name: string;
    description: string;
    domainName: string;
    selectedSources: Array<{
      id: number;
      title: string;
      authors: string;
      publication_year: number;
    }>;
  }>;
}): Promise<string> {
  const {
    assessmentDescription,
    difficultyLevel,
    educationalLevel,
    outputLanguage,
    evaluationContext,
    selectedSkills
  } = params;

  const prompt = createCasePrompt({
    assessmentDescription,
    difficultyLevel,
    educationalLevel,
    outputLanguage,
    evaluationContext,
    selectedSkills
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
  selectedSkills: Array<{
    id: number;
    name: string;
    description: string;
    domainName: string;
    selectedSources: Array<{
      id: number;
      title: string;
      authors: string;
      publication_year: number;
    }>;
  }>;
}): string {
  const {
    assessmentDescription,
    difficultyLevel,
    educationalLevel,
    outputLanguage,
    evaluationContext,
    selectedSkills
  } = params;

  if (outputLanguage === 'es') {
    const skillsWithSourcesList = selectedSkills.map(skill => {
      const sourcesList = skill.selectedSources.map(source => 
        `  - "${source.title}" por ${source.authors} (${source.publication_year})`
      ).join('\n');
      
      return `• ${skill.name} (${skill.domainName}): ${skill.description}
  Fuentes seleccionadas:
${sourcesList}`;
    }).join('\n\n');

    return `Crea un caso de evaluación para medir el nivel de desarrollo de un estudiante en las habilidades seleccionadas.

OBJETIVO DEL CASO:
El caso debe evaluar el nivel de desarrollo de los estudiantes en las habilidades seleccionadas, considerando el nombre, descripción, nivel de dificultad, nivel educativo y contexto de evaluación de cada habilidad.

INFORMACIÓN DE LA EVALUACIÓN:
Descripción: ${assessmentDescription}
Nivel de Dificultad: ${difficultyLevel}
Nivel Educativo: ${educationalLevel}
Contexto de Evaluación: ${evaluationContext}

HABILIDADES A EVALUAR Y SUS FUENTES:
${skillsWithSourcesList}

INSTRUCCIONES PARA LA CREACIÓN DEL CASO:
- El contenido del caso debe estar inspirado en la lectura de las fuentes seleccionadas por el usuario
- Cada caso debe tener: contexto, escenario del caso y preguntas
- Máximo 4 preguntas por habilidad
- El contexto debe abundar en detalles ricos para que el usuario tenga mucha información para resolverlo
- El lenguaje usado debe ser amigable y familiar para el estudiante; evita términos técnicos complejos
- El idioma de salida es el seleccionado por el usuario (${outputLanguage === 'es' ? 'Español' : 'Inglés'})
- IMPORTANTE: NO menciones las fuentes, autores, lecturas o materiales académicos en el cuerpo del caso

ESTRUCTURA OBLIGATORIA DEL CASO:

<<CONTEXTO:>>
- Información de fondo detallada y rica en detalles
- Situación inicial con abundante información contextual
- Datos relevantes sobre el entorno, personajes, circunstancias
- Elementos culturales y contextuales basados en: ${evaluationContext}
- Debe proporcionar mucha información para que el estudiante tenga elementos suficientes para resolver el caso
- Aproximadamente 1500-2000 caracteres

<<ESCENARIO DEL CASO:>>
- La situación central que permite evaluar las habilidades seleccionadas
- Desarrollo detallado del caso con desafíos apropiados para el nivel de dificultad (${difficultyLevel})
- Debe ser realista y adaptado al nivel educativo (${educationalLevel})
- El contenido debe estar inspirado en las fuentes seleccionadas, pero presentado de manera natural y accesible
- NO menciones las fuentes, autores o lecturas en el texto
- Aproximadamente 3000-4000 caracteres

<<PREGUNTAS:>>
- Máximo 4 preguntas por habilidad (total máximo: ${selectedSkills.length * 4} preguntas)
- Las preguntas deben estar escritas directamente para el estudiante
- Deben requerir reflexión profunda sobre las diferentes habilidades
- Deben ser apropiadas para el nivel educativo (${educationalLevel}) y dificultad (${difficultyLevel})
- No deben ser preguntas de sí/no
- Deben cubrir todas las habilidades seleccionadas
- Aproximadamente 1500-2000 caracteres

FORMATO:
- Usa **negritas** para enfatizar elementos importantes
- Usa *cursivas* para conceptos clave (pero evita términos técnicos complejos)
- El texto debe fluir naturalmente como una lectura amigable para estudiantes
- Usa un lenguaje cercano y familiar, como si estuvieras hablando directamente con el estudiante
- Límite total: 8192 caracteres (distribuir apropiadamente entre las secciones)
- Prioriza la claridad y accesibilidad sobre la extensión

FORMATO OBLIGATORIO:
El caso DEBE usar EXACTAMENTE estos marcadores para separar las secciones:

<<CONTEXTO:>>
[Escribe aquí toda la información de contexto]

<<ESCENARIO DEL CASO:>>
[Escribe aquí el escenario del caso]

<<PREGUNTAS:>>
[Escribe aquí las preguntas]

IMPORTANTE: 
- Usa SOLO estos marcadores exactos: <<CONTEXTO:>>, <<ESCENARIO DEL CASO:>>, <<PREGUNTAS:>>
- Cada marcador debe estar en su propia línea
- El contenido de cada sección va después del marcador
- El caso debe integrar todas las habilidades seleccionadas de manera coherente
- El contenido debe estar inspirado en las fuentes proporcionadas, pero presentado de forma natural y accesible
- NO menciones las fuentes, autores o lecturas en el texto del caso`;
  } else {
    const skillsWithSourcesList = selectedSkills.map(skill => {
      const sourcesList = skill.selectedSources.map(source => 
        `  - "${source.title}" by ${source.authors} (${source.publication_year})`
      ).join('\n');
      
      return `• ${skill.name} (${skill.domainName}): ${skill.description}
  Selected sources:
${sourcesList}`;
    }).join('\n\n');

    return `Create an assessment case to measure the level of development of a student in the selected skills.

CASE OBJECTIVE:
The case should assess the level of development of students in the selected skills, considering the name, description, difficulty level, educational level and evaluation context of each skill.

ASSESSMENT INFORMATION:
Description: ${assessmentDescription}
Difficulty Level: ${difficultyLevel}
Educational Level: ${educationalLevel}
Evaluation Context: ${evaluationContext}

SKILLS TO EVALUATE AND THEIR SOURCES:
${skillsWithSourcesList}

INSTRUCTIONS FOR CASE CREATION:
- The case content should be inspired by reading the sources selected by the user
- Each case should have: context, case scenario and questions
- Maximum 4 questions per skill
- The context should abound in rich details so that the user has a lot of information to resolve it
- The language used should be friendly and familiar to the student; avoid complex technical terms
- The output language is the one selected by the user (${outputLanguage === 'es' ? 'Spanish' : 'English'})
- IMPORTANT: DO NOT mention sources, authors, readings or academic materials in the case body

MANDATORY CASE STRUCTURE:

<<CONTEXT:>>
- Detailed background information rich in details
- Initial situation with abundant contextual information
- Relevant data about the environment, characters, circumstances
- Cultural and contextual elements based on: ${evaluationContext}
- Must provide much information so that the student has sufficient elements to resolve the case
- Approximately 1500-2000 characters

<<CASE SCENARIO:>>
- The central situation that allows evaluation of the selected skills
- Detailed case development with appropriate challenges for the difficulty level (${difficultyLevel})
- Must be realistic and adapted to the educational level (${educationalLevel})
- The content should be inspired by the selected sources, but presented in a natural and accessible way
- DO NOT mention sources, authors or readings in the text
- Approximately 3000-4000 characters

<<QUESTIONS:>>
- Maximum 4 questions per skill (total maximum: ${selectedSkills.length * 4} questions)
- Questions should be written directly for the student
- Should require deep reflection on the different skills
- Should be appropriate for the educational level (${educationalLevel}) and difficulty (${difficultyLevel})
- Should not be yes/no questions
- Should cover all selected skills
- Approximately 1500-2000 characters

FORMAT:
- Use **bold** to emphasize important elements
- Use *italics* for key concepts (but avoid complex technical terms)
- The text should flow naturally as a friendly reading for students
- Use a close and familiar language, as if you were talking directly to the student
- Total limit: 8192 characters (distribute appropriately between sections)
- Prioritize clarity and accessibility over length

MANDATORY FORMAT:
The case MUST use EXACTLY these markers to separate sections:

<<CONTEXT:>>
[Write all context information here]

<<CASE SCENARIO:>>
[Write the case scenario here]

<<QUESTIONS:>>
[Write the questions here]

IMPORTANT: 
- Use ONLY these exact markers: <<CONTEXT:>>, <<CASE SCENARIO:>>, <<QUESTIONS:>>
- Each marker must be on its own line
- The content of each section goes after the marker
- The case must integrate all selected skills coherently
- The content should be inspired by the provided sources, but presented in a natural and accessible way
- DO NOT mention sources, authors or readings in the case text`;
  }
} 