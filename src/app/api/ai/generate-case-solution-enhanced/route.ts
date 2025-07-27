import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateQueryEmbedding, findSimilarChunks, EmbeddingChunk } from '@/lib/embeddings';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = 'gpt-4o';

interface EnhancedCaseSolutionRequest {
  caseText: string;
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
}

export async function POST(request: NextRequest) {
  try {
    const requestData: EnhancedCaseSolutionRequest = await request.json();

    if (!requestData.caseText || !requestData.assessmentDescription || !requestData.difficultyLevel || 
        !requestData.educationalLevel || !requestData.outputLanguage || 
        !requestData.evaluationContext || !requestData.selectedSkills || 
        requestData.selectedSkills.length === 0) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const caseSolution = await generateEnhancedCaseSolution(requestData);
    return NextResponse.json({ caseSolution });
  } catch (error) {
    console.error('Error generating enhanced case solution:', error);
    return NextResponse.json(
      { error: 'Failed to generate enhanced case solution' },
      { status: 500 }
    );
  }
}

async function generateEnhancedCaseSolution(params: EnhancedCaseSolutionRequest): Promise<string> {
  const {
    caseText,
    assessmentDescription,
    difficultyLevel,
    educationalLevel,
    outputLanguage,
    evaluationContext,
    selectedSkills
  } = params;

  // Step 1: Extract relevant content from all selected sources
  const sourceContent = await extractRelevantSourceContent(selectedSkills, caseText);

  // Step 2: Create enhanced prompt with actual source content
  const prompt = createEnhancedCaseSolutionPrompt({
    caseText,
    assessmentDescription,
    difficultyLevel,
    educationalLevel,
    outputLanguage,
    evaluationContext,
    selectedSkills,
    sourceContent
  });

  // Step 3: Generate solution using OpenAI
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { 
        role: 'system', 
        content: outputLanguage === 'es' 
          ? 'Eres un experto en las habilidades que se están evaluando y un experto en contenido pedagógico, especializado en crear soluciones comprehensivas para casos de evaluación que sirvan como referencia completa para evaluar la competencia estudiantil en todos los niveles de logro (Principiante a Experto).'
          : 'You are an expert in the skills being assessed and an expert in pedagogical content, specialized in creating comprehensive solutions for assessment cases that serve as a complete reference for assessing student proficiency across all achievement levels (Beginner to Expert).'
      },
      { role: 'user', content: prompt }
    ],
    max_tokens: 8000,
    temperature: 0.7,
  });

  return response.choices?.[0]?.message?.content || '';
}

async function extractRelevantSourceContent(
  selectedSkills: EnhancedCaseSolutionRequest['selectedSkills'],
  caseText: string
): Promise<Array<{ skillId: number; skillName: string; sourceContent: string[] }>> {
  const skillContent: Array<{ skillId: number; skillName: string; sourceContent: string[] }> = [];

  for (const skill of selectedSkills) {
    const sourceContent: string[] = [];

    // Get all sources for this skill
    const sources = await query(
      `SELECT 
        s.id,
        s.title,
        s.authors,
        s.pdf_content_embeddings,
        s.pdf_processing_status
      FROM inteli_sources s
      INNER JOIN inteli_skills_sources ss ON s.id = ss.source_id
      WHERE ss.skill_id = ? AND s.pdf_processing_status = 'completed'
      ORDER BY s.created_at DESC`,
      [skill.id]
    );

    if (sources.length > 0) {
      // Generate embedding for the case text to find relevant content
      const queryEmbedding = await generateQueryEmbedding(caseText);
      
      // Collect relevant chunks from all sources for this skill
      const relevantChunks: Array<EmbeddingChunk & { sourceTitle: string; sourceAuthor?: string }> = [];
      
      for (const source of sources) {
        if (source.pdf_content_embeddings) {
          try {
            // Debug: Log the type and first few characters of the embeddings
            console.log(`Source ${source.id} embeddings type:`, typeof source.pdf_content_embeddings);
            console.log(`Source ${source.id} embeddings preview:`, source.pdf_content_embeddings.substring(0, 100));
            
            let chunks: EmbeddingChunk[];
            
            // Handle different possible formats
            if (typeof source.pdf_content_embeddings === 'string') {
              // Try to parse as JSON string
              chunks = JSON.parse(source.pdf_content_embeddings);
            } else if (Array.isArray(source.pdf_content_embeddings)) {
              // Already an array
              chunks = source.pdf_content_embeddings;
            } else {
              console.error('Unexpected embeddings format for source:', source.id, typeof source.pdf_content_embeddings);
              continue;
            }
            
            // Validate chunks structure
            if (!Array.isArray(chunks)) {
              console.error('Parsed chunks is not an array for source:', source.id);
              continue;
            }
            
            // Find most similar chunks from this source
            const similarChunks = findSimilarChunks(queryEmbedding, chunks, 5);
            
            similarChunks.forEach(chunk => {
              relevantChunks.push({
                ...chunk,
                sourceTitle: source.title,
                sourceAuthor: source.authors,
              });
            });
          } catch (parseError) {
            console.error('Error parsing embeddings for source:', source.id, parseError);
            console.error('Embeddings content:', source.pdf_content_embeddings);
          }
        }
      }

      // Sort by relevance and take top chunks
      relevantChunks.sort((a, b) => {
        const similarityA = cosineSimilarity(queryEmbedding, a.embedding);
        const similarityB = cosineSimilarity(queryEmbedding, b.embedding);
        return similarityB - similarityA;
      });

      // Take top 10 most relevant chunks for this skill
      const topChunks = relevantChunks.slice(0, 10);
      
      // Format the content for the prompt
      const formattedContent = topChunks.map((chunk, index) => {
        return `[Fuente ${index + 1}: ${chunk.sourceTitle}${chunk.sourceAuthor ? ` por ${chunk.sourceAuthor}` : ''}]
${chunk.content}

---`;
      });

      sourceContent.push(...formattedContent);
    }

    skillContent.push({
      skillId: skill.id,
      skillName: skill.name,
      sourceContent
    });
  }

  return skillContent;
}

function createEnhancedCaseSolutionPrompt(params: {
  caseText: string;
  assessmentDescription: string;
  difficultyLevel: string;
  educationalLevel: string;
  outputLanguage: string;
  evaluationContext: string;
  selectedSkills: EnhancedCaseSolutionRequest['selectedSkills'];
  sourceContent: Array<{ skillId: number; skillName: string; sourceContent: string[] }>;
}): string {
  const {
    caseText,
    assessmentDescription,
    difficultyLevel,
    educationalLevel,
    outputLanguage,
    evaluationContext,
    selectedSkills,
    sourceContent
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

    const sourceContentText = sourceContent.map(skillContent => {
      if (skillContent.sourceContent.length === 0) {
        return `**${skillContent.skillName}**: No hay contenido de fuentes disponible.`;
      }
      
      return `**${skillContent.skillName}**:
${skillContent.sourceContent.join('\n')}`;
    }).join('\n\n');

    return `Crea una solución comprehensiva para el caso de evaluación proporcionado que sirva como referencia completa para evaluar la competencia estudiantil en todos los niveles de logro (Principiante a Experto).

OBJETIVO DE LA SOLUCIÓN:
La solución debe servir como referencia comprehensiva para evaluar la competencia estudiantil en todos los niveles de logro (Principiante a Experto) y DEBE hacer referencia explícita a las fuentes teóricas proporcionadas y los detalles del caso. La solución debe demostrar dominio experto de las habilidades evaluadas y utilizar los conocimientos de las fuentes seleccionadas.

INFORMACIÓN DE LA EVALUACIÓN:
Descripción: ${assessmentDescription}
Nivel de Dificultad: ${difficultyLevel}
Nivel Educativo: ${educationalLevel}
Contexto de Evaluación: ${evaluationContext}

HABILIDADES EVALUADAS Y SUS FUENTES:
${skillsWithSourcesList}

CONTENIDO RELEVANTE DE LAS FUENTES SELECCIONADAS:
${sourceContentText}

CASO A RESOLVER:
${caseText}

REQUISITOS FUNDAMENTALES DE LA SOLUCIÓN:

**Elementos de la Solución:**
- Especifica el contenido y profundidad de la solución
- La solución debe ser altamente detallada y exhaustiva, reflejando un nivel de comprensión y aplicación "experto"
- Debe organizarse lógicamente y ser altamente detallada

**Identificación del Problema:**
- Articula claramente el problema central y los problemas subyacentes presentados en el caso
- Identifica todos los elementos clave y variables principales
- Considera diferentes interpretaciones posibles del problema

**Análisis Comprehensivo:**
- Proporciona un análisis detallado de la situación
- Hace conexiones explícitas con los conceptos teóricos de las fuentes
- Demuestra cómo estas teorías se aplican al caso
- Utiliza los marcos de referencia de inteli_assessments_skills

**Soluciones Alternativas:**
- Explora múltiples soluciones viables o cursos de acción
- Evalúa los pros y contras de cada alternativa
- Considera diferentes perspectivas y enfoques metodológicos

**Recomendación Justificada:**
- Propone la solución óptima con justificación robusta
- La justificación debe basarse en el análisis y fundamentos teóricos
- Debe alinearse con el nivel "Experto" de inteli_skills_levels

**Resultados/Consecuencias Anticipadas:**
- Discute los resultados potenciales positivos y negativos
- Analiza los riesgos e implicaciones de la solución recomendada
- Considera el impacto en diferentes grupos de interés

**Estructura y Detalle:**
- Organiza la solución lógicamente
- Asegura que sea altamente detallada y exhaustiva
- Refleja un nivel de comprensión y aplicación "experto"

ESTRUCTURA OBLIGATORIA DE LA SOLUCIÓN:

**1. IDENTIFICACIÓN DEL PROBLEMA:**
- Articulación clara del problema central y problemas subyacentes
- Identificación de todos los elementos clave del caso
- Análisis de las variables principales y sus interrelaciones
- Consideración de diferentes interpretaciones posibles del problema
- Identificación de posibles sesgos o limitaciones en el análisis

**2. ANÁLISIS COMPREHENSIVO:**
- Análisis detallado de la situación
- Conexiones explícitas con los conceptos teóricos de las fuentes
- Demostración de cómo las teorías se aplican al caso
- Utilización de los marcos de referencia de inteli_assessments_skills
- Análisis desde múltiples perspectivas (teórica, práctica, metodológica)

**3. SOLUCIONES ALTERNATIVAS:**
- Exploración de múltiples soluciones viables o cursos de acción
- Evaluación detallada de los pros y contras de cada alternativa
- Consideración de diferentes perspectivas y enfoques metodológicos
- Análisis de la viabilidad práctica de cada enfoque

**4. RECOMENDACIÓN JUSTIFICADA:**
- Propuesta de la solución óptima con justificación robusta
- Justificación basada en el análisis y fundamentos teóricos
- Alineación con el nivel "Experto" de inteli_skills_levels
- Fundamentación con evidencia de las fuentes proporcionadas

**5. RESULTADOS/CONSECUENCIAS ANTICIPADAS:**
- Discusión de resultados potenciales positivos y negativos
- Análisis de riesgos e implicaciones de la solución recomendada
- Consideración del impacto en diferentes grupos de interés
- Evaluación de la sostenibilidad y escalabilidad de la solución

**6. CRITERIOS DE EVALUACIÓN PARA DIFERENTES NIVELES DE LOGRO:**

**Nivel Principiante:**
- Elementos básicos que debe contener cualquier respuesta válida
- Indicadores de comprensión básica
- Criterios para evaluar respuestas de nivel inicial

**Nivel Intermedio:**
- Elementos que demuestran comprensión intermedia
- Indicadores de análisis más profundo
- Criterios para evaluar respuestas de nivel medio

**Nivel Avanzado:**
- Elementos que demuestran comprensión avanzada
- Indicadores de análisis sofisticado
- Criterios para evaluar respuestas de nivel alto

**Nivel Experto:**
- Elementos que demuestran dominio experto
- Indicadores de comprensión profunda y aplicación creativa
- Criterios para evaluar respuestas de nivel experto

**7. RÚBRICA DE EVALUACIÓN DETALLADA:**
- Criterios específicos para cada habilidad evaluada
- Escalas de evaluación con descripciones detalladas para cada nivel
- Puntos de referencia para diferentes niveles de desempeño
- Guías para la asignación de puntajes
- Indicadores de originalidad y creatividad

FORMATO:
- Usa **negritas** para enfatizar elementos importantes
- Usa *cursivas* para conceptos clave (pero evita términos técnicos complejos)
- El texto debe fluir naturalmente y ser fácil de entender
- Límite total: 12000 caracteres (distribuir apropiadamente entre las secciones)
- Prioriza la claridad y accesibilidad sobre la extensión
- La solución debe ser completa y servir como referencia comprehensiva

IMPORTANTE: 
- La solución debe servir como referencia comprehensiva para evaluar la competencia estudiantil en todos los niveles de logro (Principiante a Experto)
- DEBE hacer referencia explícita a las fuentes teóricas proporcionadas y los detalles del caso
- Debe demostrar dominio experto de todas las habilidades evaluadas
- El contenido debe estar basado en las fuentes proporcionadas, pero presentado de forma natural y accesible
- NO menciones las fuentes, autores o lecturas en el texto de la solución
- Integra conceptos de múltiples fuentes de manera coherente
- La solución debe ser altamente detallada y exhaustiva, reflejando un nivel de comprensión y aplicación "experto"`;
  } else {
    const skillsWithSourcesList = selectedSkills.map(skill => {
      const sourcesList = skill.selectedSources.map(source => 
        `  - "${source.title}" by ${source.authors} (${source.publication_year})`
      ).join('\n');
      
      return `• ${skill.name} (${skill.domainName}): ${skill.description}
  Selected sources:
${sourcesList}`;
    }).join('\n\n');

    const sourceContentText = sourceContent.map(skillContent => {
      if (skillContent.sourceContent.length === 0) {
        return `**${skillContent.skillName}**: No source content available.`;
      }
      
      return `**${skillContent.skillName}**:
${skillContent.sourceContent.join('\n')}`;
    }).join('\n\n');

    return `Create a comprehensive solution for the provided assessment case that serves as a complete reference for assessing student proficiency across all achievement levels (Beginner to Expert).

SOLUTION OBJECTIVE:
The solution should serve as a comprehensive reference for assessing student proficiency across all achievement levels (Beginner to Expert) and MUST explicitly reference the provided theoretical sources and case details. The solution should demonstrate expert mastery of the evaluated skills and utilize knowledge from the selected sources.

ASSESSMENT INFORMATION:
Description: ${assessmentDescription}
Difficulty Level: ${difficultyLevel}
Educational Level: ${educationalLevel}
Evaluation Context: ${evaluationContext}

EVALUATED SKILLS AND THEIR SOURCES:
${skillsWithSourcesList}

RELEVANT CONTENT FROM SELECTED SOURCES:
${sourceContentText}

CASE TO SOLVE:
${caseText}

FUNDAMENTAL SOLUTION REQUIREMENTS:

**Solution Elements:**
- Specify the content and depth of the solution
- The solution should be highly detailed and thorough, reflecting an "expert" level of understanding and application
- Should be organized logically and highly detailed

**Problem Identification:**
- Clearly articulate the core problem(s) and underlying issues presented in the case
- Identify all key elements and main variables
- Consider different possible interpretations of the problem

**Comprehensive Analysis:**
- Provide a detailed analysis of the situation
- Explicitly draw connections to theoretical concepts from sources
- Demonstrate how these theories apply to the case
- Utilize frameworks from inteli_assessments_skills

**Alternative Solutions:**
- Explore multiple viable solutions or courses of action
- Evaluate the pros and cons of each alternative
- Consider different perspectives and methodological approaches

**Justified Recommendation:**
- Propose the optimal solution with robust justification
- Justification should be based on analysis and theoretical foundations
- Should align with the "Expert" level of inteli_skills_levels

**Anticipated Outcomes/Consequences:**
- Discuss potential positive and negative outcomes
- Analyze risks and implications of the recommended solution
- Consider impact on different stakeholder groups

**Structure and Detail:**
- Organize the solution logically
- Ensure it is highly detailed and thorough
- Reflect an "expert" level of understanding and application

MANDATORY SOLUTION STRUCTURE:

**1. PROBLEM IDENTIFICATION:**
- Clear articulation of the core problem and underlying issues
- Identification of all key elements of the case
- Analysis of main variables and their interrelationships
- Consideration of different possible interpretations of the problem
- Identification of possible biases or limitations in the analysis

**2. COMPREHENSIVE ANALYSIS:**
- Detailed analysis of the situation
- Explicit connections to theoretical concepts from sources
- Demonstration of how theories apply to the case
- Utilization of frameworks from inteli_assessments_skills
- Analysis from multiple perspectives (theoretical, practical, methodological)

**3. ALTERNATIVE SOLUTIONS:**
- Exploration of multiple viable solutions or courses of action
- Detailed evaluation of pros and cons of each alternative
- Consideration of different perspectives and methodological approaches
- Analysis of practical feasibility of each approach

**4. JUSTIFIED RECOMMENDATION:**
- Proposal of optimal solution with robust justification
- Justification based on analysis and theoretical foundations
- Alignment with "Expert" level of inteli_skills_levels
- Grounding with evidence from provided sources

**5. ANTICIPATED OUTCOMES/CONSEQUENCES:**
- Discussion of potential positive and negative outcomes
- Analysis of risks and implications of recommended solution
- Consideration of impact on different stakeholder groups
- Evaluation of sustainability and scalability of solution

**6. EVALUATION CRITERIA FOR DIFFERENT ACHIEVEMENT LEVELS:**

**Beginner Level:**
- Essential elements that any valid response should contain
- Indicators of basic understanding
- Criteria for evaluating initial level responses

**Intermediate Level:**
- Elements that demonstrate intermediate understanding
- Indicators of deeper analysis
- Criteria for evaluating medium level responses

**Advanced Level:**
- Elements that demonstrate advanced understanding
- Indicators of sophisticated analysis
- Criteria for evaluating high level responses

**Expert Level:**
- Elements that demonstrate expert mastery
- Indicators of deep understanding and creative application
- Criteria for evaluating expert level responses

**7. DETAILED EVALUATION RUBRIC:**
- Specific criteria for each evaluated skill
- Evaluation scales with detailed descriptions for each level
- Reference points for different performance levels
- Guidelines for score assignment
- Indicators of originality and creativity

FORMAT:
- Use **bold** to emphasize important elements
- Use *italics* for key concepts (but avoid complex technical terms)
- The text should flow naturally and be easy to understand
- Total limit: 12000 characters (distribute appropriately between sections)
- Prioritize clarity and accessibility over length
- The solution should be complete and serve as a comprehensive reference

IMPORTANT: 
- The solution should serve as a comprehensive reference for assessing student proficiency across all achievement levels (Beginner to Expert)
- MUST explicitly reference the provided theoretical sources and case details
- Should demonstrate expert mastery of all evaluated skills
- The content should be based on the provided sources, but presented in a natural and accessible way
- DO NOT mention sources, authors or readings in the solution text
- Integrate concepts from multiple sources coherently
- The solution should be highly detailed and thorough, reflecting an "expert" level of understanding and application`;
  }
}

// Helper function to calculate cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
} 