import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateQueryEmbedding, findSimilarChunks, EmbeddingChunk } from '@/lib/embeddings';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = 'gpt-4o';

interface EnhancedCaseRequest {
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
    const requestData: EnhancedCaseRequest = await request.json();

    if (!requestData.assessmentDescription || !requestData.difficultyLevel || 
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

    const caseText = await generateEnhancedCase(requestData);
    return NextResponse.json({ caseText });
  } catch (error) {
    console.error('Error generating enhanced case:', error);
    return NextResponse.json(
      { error: 'Failed to generate enhanced case' },
      { status: 500 }
    );
  }
}

async function generateEnhancedCase(params: EnhancedCaseRequest): Promise<string> {
  const {
    assessmentDescription,
    difficultyLevel,
    educationalLevel,
    outputLanguage,
    evaluationContext,
    selectedSkills
  } = params;

  // Step 1: Extract relevant content from all selected sources
  const sourceContent = await extractRelevantSourceContent(selectedSkills, assessmentDescription);

  // Step 2: Create enhanced prompt with actual source content
  const prompt = createEnhancedCasePrompt({
    assessmentDescription,
    difficultyLevel,
    educationalLevel,
    outputLanguage,
    evaluationContext,
    selectedSkills,
    sourceContent
  });

  // Step 3: Generate case using OpenAI
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { 
        role: 'system', 
        content: outputLanguage === 'es' 
          ? 'Eres un creador de contenido educativo especializado en evaluación formativa, experto en diseñar casos de evaluación realistas y desafiantes basados en fuentes académicas específicas. Tu enfoque se centra en crear experiencias de aprendizaje que permitan a los estudiantes desarrollar y demostrar sus habilidades de manera progresiva.'
          : 'You are an educational content creator specialized in formative assessment, expert in designing realistic and challenging assessment cases based on specific academic sources. Your focus is on creating learning experiences that allow students to develop and demonstrate their skills progressively.'
      },
      { role: 'user', content: prompt }
    ],
    max_tokens: 4000,
    temperature: 0.7,
  });

  return response.choices?.[0]?.message?.content || '';
}

async function extractRelevantSourceContent(
  selectedSkills: EnhancedCaseRequest['selectedSkills'],
  assessmentDescription: string
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
      // Generate embedding for the assessment description to find relevant content
      const queryEmbedding = await generateQueryEmbedding(assessmentDescription);
      
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

function createEnhancedCasePrompt(params: {
  assessmentDescription: string;
  difficultyLevel: string;
  educationalLevel: string;
  outputLanguage: string;
  evaluationContext: string;
  selectedSkills: EnhancedCaseRequest['selectedSkills'];
  sourceContent: Array<{ skillId: number; skillName: string; sourceContent: string[] }>;
}): string {
  const {
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
        `   - "${source.title}" por ${source.authors} (${source.publication_year})`
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

CONTENIDO RELEVANTE DE LAS FUENTES SELECCIONADAS:
${sourceContentText}

REQUISITOS FUNDAMENTALES DEL CASO:

**Autenticidad y Realismo:**
- Crea un escenario que refleje fielmente tareas, problemas o situaciones del mundo real relevantes al contexto educativo especificado
- Incorpora detalles, desafíos y dilemas que se sientan genuinos y auténticos
- El caso debe sentirse como una situación real que el estudiante podría encontrar en su campo de estudio de forma profesional

**Alineación de Habilidades:**
- El caso DEBE proporcionar oportunidades explícitas para que los estudiantes demuestren CADA una de las habilidades listadas
- La complejidad del problema debe alinearse con el nivel de logro más alto de cada habilidad
- Cada habilidad debe tener espacio claro para su demostración y evaluación

**Enfoque en Resolución de Problemas:**
- El núcleo del caso debe ser un problema o desafío que requiera que el estudiante aplique su conocimiento y razonamiento
- El estudiante debe proponer soluciones o tomar decisiones basadas en su análisis
- El problema debe ser lo suficientemente complejo para permitir múltiples enfoques y justificaciones

**Formato de Pregunta Única:**
- La sección "Tu Tarea" debe presentar UN SOLO problema o desafío general y mal estructurado; 
es decir, no debe ser una lista de preguntas específicas sino una sola tarea o un solo problema que se exprese de manera sencilla pero 
cuya resolución implique el uso de las habilidades seleccionadas.
- NO uses múltiples preguntas específicas
- El problema debe requerir que el estudiante analice el escenario, identifique y enmarque los desafíos principales, proponga soluciones y justifique su razonamiento
- Debe permitir refinamiento iterativo a través de la interacción con el agente de IA

**Formato de Pregunta Única - ENFOQUE EN PROBLEMAS MAL ESTRUCTURADOS:**
- La sección "Tu Tarea" debe presentar UN SOLO problema o desafío general y mal estructurado
- **CRÍTICO**: El problema debe ser lo suficientemente complejo y ambiguo para que el estudiante deba:
  * Identificar y definir los problemas centrales por sí mismo
  * Determinar qué información es relevante y qué no
  * Proponer múltiples enfoques posibles
  * Justificar sus decisiones y prioridades
  * Integrar múltiples perspectivas y consideraciones
- **PROHIBIDO ABSOLUTAMENTE**: NO uses preguntas que contengan listas de elementos específicos a considerar
- **PROHIBIDO ABSOLUTAMENTE**: NO uses frases como "considera cómo", "asegúrate de que", "identifica las", "propón actividades"
- **PROHIBIDO ABSOLUTAMENTE**: NO uses múltiples cláusulas conectadas con "mientras", "y", "que"
- **EJEMPLOS DE LO QUE NO HACER** (PROHIBIDO):
  * "Diseña una estrategia integral para desarrollar un modelo de curso virtual para el programa de MBA de LIMBIZ. Considera cómo identificar las necesidades formativas, seleccionar las herramientas tecnológicas adecuadas y evaluar el impacto educativo, integrando inteligencia artificial para personalizar la experiencia de aprendizaje mientras te aseguras de que cada actividad contribuye al logro de los resultados deseados."
  * "Identifica las herramientas más adecuadas, propón actividades innovadoras y garantiza que cada elemento esté alineado"
  * "Desarrolla un plan que considere A, B, C y D, asegurándote de que X, Y y Z"
- **EJEMPLOS DE LO QUE SÍ HACER** (CORRECTO):
  * "Desarrolla una estrategia integral para abordar este desafío educativo"
  * "Diseña una solución que transforme la experiencia de aprendizaje"
  * "Propón un enfoque innovador para resolver esta situación"
  * "Crea una estrategia que maximice el impacto educativo"
- **REGLA DE ORO**: Si tu pregunta menciona más de 2 elementos específicos o usa más de 2 cláusulas, está mal estructurada
- El problema debe ser realista, complejo y requerir pensamiento crítico y creativo
- Debe permitir múltiples respuestas válidas y enfoques diferentes
- Debe requerir que el estudiante demuestre comprensión profunda, no solo aplicación de conceptos

**Claridad y Concisión:**
- Presenta el escenario, el problema central y la tarea del estudiante de manera clara y sin ambigüedades
- Evita jerga o términos técnicos innecesarios a menos que sea integral al contexto
- El lenguaje debe ser accesible y familiar para el estudiante

**Integración de Contenido de Referencia:**
- Teje de manera fluida conceptos, terminología o restricciones realistas derivadas del Contenido de Referencia (${sourceContentText})
- Asegúrate de que el caso sea relevante para los materiales de aprendizaje proporcionados
- El contenido debe estar basado en las fuentes proporcionadas, pero presentado de manera natural y accesible

**Flujo Narrativo:**
- Estructura el caso como una narrativa coherente
- Establece la escena, introduce personajes/entidades clave (si aplica) y describe el desafío
- El texto debe fluir naturalmente como una lectura amigable para estudiantes

**Estructura de Salida para Navegación:**
- El texto del caso DEBE estar claramente dividido en las siguientes secciones para facilitar la navegación del estudiante: "Contexto", "Escenario Principal" y "Tu Tarea"

ESTRUCTURA OBLIGATORIA DEL CASO:

<<CONTEXTO:>>
- Información de fondo detallada y rica en detalles basada en las fuentes
- Situación inicial con abundante información contextual
- Datos relevantes sobre el entorno, personajes, circunstancias
- Elementos culturales y contextuales basados en: ${evaluationContext}
- Debe proporcionar mucha información para que el estudiante tenga elementos suficientes para resolver el caso
- Aproximadamente 1500-2000 caracteres

<<ESCENARIO PRINCIPAL:>>
- La situación central que permite evaluar las habilidades seleccionadas
- Desarrollo detallado del caso con desafíos apropiados para el nivel de dificultad (${difficultyLevel})
- Debe ser realista y adaptado al nivel educativo (${educationalLevel})
- El contenido debe estar basado en las fuentes proporcionadas, pero presentado de manera natural y accesible
- NO menciones las fuentes, autores o lecturas en el texto
- Aproximadamente 3000-4000 caracteres

<<TU TAREA:>>
- PRESENTA UN SOLO PROBLEMA O DESAFÍO GENERAL es decir, no debe ser una lista de preguntas específicas sino una sola tarea 
o un solo problema que se exprese de manera sencilla pero cuya resolución implique el uso de las habilidades seleccionadas.
- El problema debe ser lo suficientemente complejo para evaluar todas las habilidades seleccionadas
- Debe presentar una situación donde el estudiante deba primero identificar y definir los desafíos o dilemas centrales
- Debe permitir refinamiento iterativo a través de la interacción con el agente de IA
- Debe ser apropiado para el nivel educativo (${educationalLevel}) y dificultad (${difficultyLevel})
- NO uses múltiples preguntas específicas ni una lista de demandas explícitas; el estudiante debe demostrar su capacidad para enmarcar el problema.
- Entre 300 y 400 caracteres

<<TU TAREA:>>
- PRESENTA UN SOLO PROBLEMA O DESAFÍO GENERAL MAL ESTRUCTURADO
- **El problema debe ser complejo y ambiguo**, requiriendo que el estudiante:
  * Identifique y defina los problemas centrales por sí mismo
  * Determine qué información es relevante y qué no
  * Proponga múltiples enfoques posibles
  * Justifique sus decisiones y prioridades
  * Integre múltiples perspectivas y consideraciones
- **Ejemplos de problemas bien estructurados**:
  * "Desarrolla una estrategia integral para abordar este desafío"
  * "Diseña una solución que considere todos los aspectos relevantes"
  * "Propón un enfoque que maximice el impacto y optimice los recursos"
- **Ejemplos de problemas MAL estructurados (evitar)**:
  * "Identifica las herramientas más adecuadas"
  * "Propón actividades innovadoras"
  * "Garantiza que cada elemento esté alineado"
- El problema debe ser realista, complejo y requerir pensamiento crítico y creativo
- Debe permitir múltiples respuestas válidas y enfoques diferentes
- Debe requerir que el estudiante demuestre comprensión profunda, no solo aplicación de conceptos
- Entre 300 y 400 caracteres

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

<<ESCENARIO PRINCIPAL:>>
[Escribe aquí el escenario principal del caso]

<<TU TAREA:>>


IMPORTANTE: 
- Usa SOLO estos marcadores exactos: <<CONTEXTO:>>, <<ESCENARIO PRINCIPAL:>>, <<TU TAREA:>>
- Cada marcador debe estar en su propia línea
- El contenido de cada sección va después del marcador
- El caso debe integrar todas las habilidades seleccionadas de manera coherente
- El contenido debe estar basado en las fuentes proporcionadas, pero presentado de forma natural y accesible
- NO menciones las fuentes, autores o lecturas en el texto del caso
- La sección "Tu Tarea" debe contener UN SOLO problema general, NO múltiples preguntas específicas

**VALIDACIÓN FINAL ANTES DE GENERAR:**
- Lee tu pregunta "Tu Tarea" y verifica que:
  * NO contenga más de 2 elementos específicos
  * NO use más de 2 cláusulas conectadas
  * NO contenga frases como "considera cómo", "asegúrate de que", "identifica las"
  * NO sea una lista de tareas o elementos a abordar
  * SÍ sea un problema abierto que requiera que el estudiante defina qué es importante
- Si tu pregunta falla en cualquiera de estos puntos, reescríbela de manera más simple y abierta`;
  } else {
    const skillsWithSourcesList = selectedSkills.map(skill => {
      const sourcesList = skill.selectedSources.map(source => 
        `   - "${source.title}" by ${source.authors} (${source.publication_year})`
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

RELEVANT CONTENT FROM SELECTED SOURCES:
${sourceContentText}

FUNDAMENTAL CASE REQUIREMENTS:

**Authenticity & Realism:**
- Create a scenario that closely mirrors real-world tasks, problems, or situations relevant to the specified educational context
- Incorporate details, challenges, and dilemmas that feel genuine and authentic
- The case should feel like a real situation the student might encounter in their field of study

**Skill Alignment:**
- The case MUST explicitly provide opportunities for students to demonstrate EACH of the listed skills
- The complexity of the problem should align with the Overall Difficulty Level and Target Cognitive Level
- Each skill should have clear space for demonstration and evaluation

**Problem-Solving Focus:**
- The core of the case should be a problem or challenge that requires the student to apply their knowledge and reasoning
- The student should propose solutions or make decisions based on their analysis
- The problem should be complex enough to allow multiple approaches and justifications

**Question Format:**
- The "Your Task" section should present ONE overarching, ill-structured problem or challenge
- DO NOT use multiple specific questions
- The problem should require the student to analyze the scenario, identify and frame the core challenges, propose solutions, and justify their reasoning
- Should allow for iterative refinement through interaction with the AI agent

**Question Format - FOCUS ON ILL-STRUCTURED PROBLEMS:**
- The "Your Task" section should present ONE overarching, ill-structured problem or challenge
- **CRITICAL**: The problem should be complex and ambiguous enough that the student must:
  * Identify and define the central problems themselves
  * Determine what information is relevant and what is not
  * Propose multiple possible approaches
  * Justify their decisions and priorities
  * Integrate multiple perspectives and considerations
- **ABSOLUTELY FORBIDDEN**: DO NOT use questions that contain lists of specific elements to consider
- **ABSOLUTELY FORBIDDEN**: DO NOT use phrases like "consider how", "ensure that", "identify the", "propose activities"
- **ABSOLUTELY FORBIDDEN**: DO NOT use multiple clauses connected with "while", "and", "that"
- **EXAMPLES OF WHAT NOT TO DO** (FORBIDDEN):
  * "Design a comprehensive strategy to develop a virtual course model for LIMBIZ's MBA program. Consider how to identify training needs, select appropriate technological tools and evaluate educational impact, integrating artificial intelligence to personalize the learning experience while ensuring that each activity contributes to achieving the desired results."
  * "Identify the most appropriate tools, propose innovative activities and ensure that each element is aligned"
  * "Develop a plan that considers A, B, C and D, ensuring that X, Y and Z"
- **EXAMPLES OF WHAT TO DO** (CORRECT):
  * "Develop a comprehensive strategy to address this educational challenge"
  * "Design a solution that transforms the learning experience"
  * "Propose an innovative approach to resolve this situation"
  * "Create a strategy that maximizes educational impact"
- **GOLDEN RULE**: If your question mentions more than 2 specific elements or uses more than 2 clauses, it's poorly structured
- The problem should be realistic, complex, and require critical and creative thinking
- Should allow for multiple valid answers and different approaches
- Should require the student to demonstrate deep understanding, not just concept application

**Clarity & Conciseness:**
- Present the scenario, the core problem, and the student's task clearly and unambiguously
- Avoid unnecessary jargon unless it's integral to the context
- The language should be accessible and familiar to the student

**Integration of Reference Content:**
- Seamlessly weave in concepts, terminology, or realistic constraints derived from the Reference Content (PDFs)
- Ensure the case is relevant to the provided learning materials
- The content should be based on the provided sources, but presented in a natural and accessible way

**Narrative Flow:**
- Structure the case as a coherent narrative
- Set the scene, introduce characters/stakeholders (if applicable), and outline the challenge
- The text should flow naturally as a friendly reading for students

**Output Structure for Navigation:**
- The case text MUST be clearly divided into the following sections to facilitate student navigation: "Context", "Main Scenario", and "Your Task"

MANDATORY CASE STRUCTURE:

<<CONTEXT:>>
- Detailed background information rich in details based on the sources
- Initial situation with abundant contextual information
- Relevant data about the environment, characters, circumstances
- Cultural and contextual elements based on: ${evaluationContext}
- Must provide much information so that the student has sufficient elements to resolve the case
- Approximately 1500-2000 characters

<<MAIN SCENARIO:>>
- The central situation that allows evaluation of the selected skills
- Detailed case development with appropriate challenges for the difficulty level (${difficultyLevel})
- Must be realistic and adapted to the educational level (${educationalLevel})
- The content should be based on the provided sources, but presented in a natural and accessible way
- DO NOT mention sources, authors or readings in the text
- Approximately 3000-4000 characters

<<YOUR TASK:>>
- Present ONE overarching, ill-structured problem or challenge
- The problem should be complex enough to evaluate all selected skills
- Should present a situation where the student must first identify and frame the core challenges or dilemmas
- Should allow for iterative refinement through interaction with the AI agent
- Should be appropriate for the educational level (${educationalLevel}) and difficulty (${difficultyLevel})
- DO NOT use multiple specific questions or a list of explicit demands; the student should demonstrate their ability to frame the problem
- Between 300 and 400 characters

<<YOUR TASK:>>
- Present ONE overarching, ill-structured problem or challenge
- **The problem should be complex and ambiguous**, requiring the student to:
  * Identify and define the central problems themselves
  * Determine what information is relevant and what is not
  * Propose multiple possible approaches
  * Justify their decisions and priorities
  * Integrate multiple perspectives and considerations
- **Examples of well-structured problems**:
  * "Develop a comprehensive strategy to address this challenge"
  * "Design a solution that considers all relevant aspects"
  * "Propose an approach that maximizes impact and optimizes resources"
- **Examples of POORLY structured problems (avoid)**:
  * "Identify the most appropriate tools"
  * "Propose innovative activities"
  * "Ensure each element is aligned"
- The problem should be realistic, complex, and require critical and creative thinking
- Should allow for multiple valid answers and different approaches
- Should require the student to demonstrate deep understanding, not just concept application
- Between 300 and 400 characters

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


<<MAIN SCENARIO:>>


<<YOUR TASK:>>


IMPORTANT: 
- Use ONLY these exact markers: <<CONTEXT:>>, <<MAIN SCENARIO:>>, <<YOUR TASK:>>
- Each marker must be on its own line
- The content of each section goes after the marker
- The case must integrate all selected skills coherently
- The content should be based on the provided sources, but presented in a natural and accessible way
- DO NOT mention sources, authors or readings in the case text
- The "Your Task" section should contain ONE single general problem, NOT multiple specific questions

**FINAL VALIDATION BEFORE GENERATING:**
- Read your "Your Task" question and verify that:
  * It does NOT contain more than 2 specific elements
  * It does NOT use more than 2 connected clauses
  * It does NOT contain phrases like "consider how", "ensure that", "identify the"
  * It is NOT a list of tasks or elements to address
  * It IS an open problem that requires the student to define what is important
- If your question fails any of these points, rewrite it in a simpler and more open way`;
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