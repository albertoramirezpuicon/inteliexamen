import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';

export async function POST(request: NextRequest) {
  try {
    const { 
      caseText,
      assessmentDescription, 
      difficultyLevel, 
      educationalLevel, 
      outputLanguage, 
      evaluationContext, 
      selectedSkills
    } = await request.json();

    if (!caseText || !assessmentDescription || !difficultyLevel || !educationalLevel || !outputLanguage || 
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

    const caseSolution = await generateCaseSolution({
      caseText,
      assessmentDescription,
      difficultyLevel,
      educationalLevel,
      outputLanguage,
      evaluationContext,
      selectedSkills
    });

    return NextResponse.json({ caseSolution });
  } catch (error) {
    console.error('Error generating case solution:', error);
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Failed to generate case solution';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('OpenAI API')) {
        errorMessage = 'AI service temporarily unavailable. Please try again.';
        statusCode = 503; // Service Unavailable
      } else if (error.message.includes('API key not configured')) {
        errorMessage = 'AI service configuration error. Please contact support.';
        statusCode = 500;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

async function generateCaseSolution(params: {
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
}): Promise<string> {
  const {
    caseText,
    assessmentDescription,
    difficultyLevel,
    educationalLevel,
    outputLanguage,
    evaluationContext,
    selectedSkills
  } = params;

  const prompt = createCaseSolutionPrompt({
    caseText,
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
            ? 'Eres un experto en análisis educativo especializado en crear soluciones comprehensivas y diversas para casos de evaluación, considerando múltiples enfoques y perspectivas.'
            : 'You are an expert educational analyst specialized in creating comprehensive and diverse solutions for assessment cases, considering multiple approaches and perspectives.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 6000,
      temperature: 0.7,
      n: 1,
    }),
  });

  if (!response.ok) {
    let errorMessage = `OpenAI API error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.error?.message) {
        errorMessage = `OpenAI API error: ${errorData.error.message}`;
      }
    } catch (parseError) {
      // If JSON parsing fails, use the text response
      const errorText = await response.text();
      errorMessage = `OpenAI API error: ${errorText}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function createCaseSolutionPrompt(params: {
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
}): string {
  const {
    caseText,
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

    return `Crea una solución comprehensiva y diversa para el caso de evaluación proporcionado.

OBJETIVO DE LA SOLUCIÓN:
La solución debe servir como referencia completa que incluya múltiples enfoques y perspectivas para resolver el caso, considerando que diferentes estudiantes pueden abordar el problema de manera distinta. Debe demostrar el dominio de las habilidades evaluadas y utilizar los conocimientos de las fuentes seleccionadas.

INFORMACIÓN DE LA EVALUACIÓN:
Descripción: ${assessmentDescription}
Nivel de Dificultad: ${difficultyLevel}
Nivel Educativo: ${educationalLevel}
Contexto de Evaluación: ${evaluationContext}

HABILIDADES EVALUADAS Y SUS FUENTES:
${skillsWithSourcesList}

CASO A RESOLVER:
${caseText}

INSTRUCCIONES PARA LA SOLUCIÓN:
- La solución debe ser comprehensiva y cubrir todos los aspectos del caso desde múltiples perspectivas
- Debe demostrar dominio de todas las habilidades evaluadas
- El contenido debe estar inspirado en las fuentes seleccionadas
- Debe ser apropiada para el nivel educativo (${educationalLevel}) y dificultad (${difficultyLevel})
- El lenguaje debe ser claro y accesible
- NO menciones las fuentes, autores o lecturas en el texto de la solución
- El idioma de salida es el seleccionado por el usuario (Español)
- INCLUYE MÚLTIPLES ENFOQUES Y PERSPECTIVAS para abordar el problema

ESTRUCTURA DE LA SOLUCIÓN:

**1. ANÁLISIS COMPREHENSIVO DEL PROBLEMA:**
- Identificación de los elementos clave del caso desde diferentes perspectivas
- Análisis de las variables principales y sus interrelaciones
- Consideración de diferentes interpretaciones posibles del problema

**2. MÚLTIPLES ENFOQUES DE SOLUCIÓN DETALLADOS:**

**ENFOQUE PRINCIPAL/CONVENCIONAL:**
- Explica detalladamente la solución más directa y comúnmente aceptada
- Describe paso a paso cómo se aplicaría este enfoque
- Fundamenta por qué es considerado el enfoque "estándar"
- Incluye ejemplos específicos de aplicación
- Menciona las ventajas principales de este enfoque

**ENFOQUE ALTERNATIVO 1:**
- Describe completamente una perspectiva diferente o innovadora
- Explica en detalle cómo difiere del enfoque convencional
- Fundamenta las razones teóricas o prácticas para este enfoque
- Incluye ejemplos específicos de cuándo sería más apropiado
- Analiza las ventajas y desventajas específicas de este enfoque

**ENFOQUE ALTERNATIVO 2:**
- Desarrolla completamente otra forma de abordar el problema
- Explica las diferencias fundamentales con los otros enfoques
- Fundamenta la base teórica o metodológica de este enfoque
- Incluye ejemplos concretos de aplicación
- Analiza las circunstancias donde este enfoque sería óptimo

**3. APLICACIÓN DETALLADA DE CONCEPTOS DESDE DIFERENTES PERSPECTIVAS:**

**APLICACIÓN DESDE LA PERSPECTIVA TEÓRICA:**
- Explica detalladamente cómo se aplican los conceptos teóricos
- Describe las teorías específicas que se pueden utilizar
- Fundamenta la elección de marcos teóricos particulares
- Incluye ejemplos de cómo las teorías se manifiestan en la práctica

**APLICACIÓN DESDE LA PERSPECTIVA PRÁCTICA:**
- Describe cómo se traducen los conceptos en acciones concretas
- Explica los pasos específicos para implementar cada enfoque
- Incluye ejemplos de casos similares donde se han aplicado
- Analiza los resultados esperados de cada aplicación práctica

**APLICACIÓN DESDE LA PERSPECTIVA METODOLÓGICA:**
- Explica las diferentes metodologías que se pueden emplear
- Describe los procesos específicos de cada metodología
- Fundamenta la elección de métodos particulares
- Incluye ejemplos de aplicación metodológica

**INTEGRACIÓN DE MÚLTIPLES PERSPECTIVAS:**
- Explica cómo se complementan las diferentes perspectivas
- Describe la sinergia entre enfoques teóricos, prácticos y metodológicos
- Fundamenta por qué la integración es más efectiva
- Incluye ejemplos de integración exitosa

**4. ANÁLISIS COMPARATIVO DETALLADO DE ENFOQUES:**

**COMPARACIÓN SISTEMÁTICA DE ENFOQUES:**
- Analiza punto por punto las ventajas y desventajas de cada enfoque
- Compara la efectividad de cada enfoque en diferentes escenarios
- Evalúa la complejidad de implementación de cada enfoque
- Analiza los recursos necesarios para cada enfoque

**FACTORES DE SELECCIÓN DE ENFOQUES:**
- Explica detalladamente qué factores determinan la elección de un enfoque
- Describe las circunstancias específicas donde cada enfoque es óptimo
- Analiza las limitaciones de tiempo, recursos y contexto
- Incluye criterios de decisión para diferentes situaciones

**ANÁLISIS DE CONTEXTOS Y SITUACIONES:**
- Describe cómo cada enfoque se adapta a diferentes contextos
- Explica las modificaciones necesarias para diferentes situaciones
- Analiza la flexibilidad y adaptabilidad de cada enfoque
- Incluye ejemplos de aplicación en contextos específicos

**EVALUACIÓN DE ROBUSTEZ Y CONFIABILIDAD:**
- Analiza la consistencia de resultados de cada enfoque
- Evalúa la capacidad de cada enfoque para manejar incertidumbres
- Describe los riesgos asociados con cada enfoque
- Incluye análisis de casos límite y situaciones extremas

**5. CRITERIOS DETALLADOS DE EVALUACIÓN PARA DIFERENTES RESPUESTAS:**

**ELEMENTOS ESENCIALES QUE DEBE CONTENER CUALQUIER RESPUESTA VÁLIDA:**
- Lista detallada de conceptos clave que deben estar presentes
- Explicación de por qué cada elemento es fundamental
- Ejemplos de cómo se pueden manifestar estos elementos
- Indicadores de comprensión básica vs. avanzada

**NIVELES DE PROFUNDIDAD Y SOFISTICACIÓN ACEPTABLES:**
- Describe detalladamente el nivel básico de comprensión aceptable
- Explica qué constituye un nivel intermedio de análisis
- Define qué caracteriza un nivel avanzado o experto
- Incluye ejemplos específicos de cada nivel

**CRITERIOS PARA EVALUAR ORIGINALIDAD Y CREATIVIDAD:**
- Explica qué constituye una respuesta original
- Describe cómo evaluar la creatividad en el enfoque
- Incluye criterios para valorar la innovación en la solución
- Analiza cómo reconocer el pensamiento divergente

**INDICADORES DE COMPRENSIÓN PROFUNDA VS. SUPERFICIAL:**
- Lista detallada de señales de comprensión profunda
- Describe indicadores de comprensión superficial
- Explica cómo distinguir entre memorización y comprensión real
- Incluye ejemplos de respuestas que demuestran cada nivel

**RÚBRICA DE EVALUACIÓN DETALLADA:**
- Criterios específicos para cada habilidad evaluada
- Escalas de evaluación con descripciones detalladas
- Puntos de referencia para diferentes niveles de desempeño
- Guías para la asignación de puntajes

**6. CONSIDERACIONES ADICIONALES Y LIMITACIONES DETALLADAS:**

**LIMITACIONES ESPECÍFICAS DE CADA ENFOQUE:**
- Analiza detalladamente las limitaciones del enfoque convencional
- Describe las restricciones específicas del enfoque alternativo 1
- Explica las limitaciones del enfoque alternativo 2
- Incluye ejemplos de situaciones donde cada enfoque fallaría

**CONSIDERACIONES ÉTICAS DETALLADAS:**
- Explica las implicaciones éticas de cada enfoque
- Describe los dilemas éticos que pueden surgir
- Analiza el impacto en diferentes grupos de interés
- Incluye consideraciones de justicia y equidad
- Fundamenta las decisiones éticas con principios claros

**CONSIDERACIONES PRÁCTICAS Y OPERATIVAS:**
- Analiza la viabilidad práctica de cada enfoque
- Describe los recursos necesarios para implementación
- Explica las barreras operativas que pueden surgir
- Incluye consideraciones de tiempo y costo
- Analiza la escalabilidad de cada enfoque

**CONSIDERACIONES CONTEXTUALES ESPECÍFICAS:**
- Describe cómo el contexto cultural afecta cada enfoque
- Explica las adaptaciones necesarias para diferentes entornos
- Analiza la influencia del contexto institucional
- Incluye consideraciones de políticas y regulaciones
- Fundamenta las decisiones contextuales

**POSIBLES EXTENSIONES Y APLICACIONES FUTURAS:**
- Describe cómo cada enfoque puede evolucionar
- Explica posibles mejoras y refinamientos
- Analiza aplicaciones en otros contextos o problemas
- Incluye consideraciones de investigación futura
- Fundamenta las proyecciones con evidencia

FORMATO:
- Usa **negritas** para enfatizar elementos importantes
- Usa *cursivas* para conceptos clave (pero evita términos técnicos complejos)
- El texto debe fluir naturalmente y ser fácil de entender
- Límite total: 10000 caracteres (distribuir apropiadamente entre las secciones)
- Prioriza la claridad y accesibilidad sobre la extensión
- La solución debe ser completa y diversa

IMPORTANTE: 
- La solución debe servir como referencia comprehensiva para evaluar diferentes tipos de respuestas estudiantiles
- Debe demostrar dominio de todas las habilidades evaluadas desde múltiples perspectivas
- El contenido debe estar inspirado en las fuentes proporcionadas, pero presentado de forma natural y accesible
- NO menciones las fuentes, autores o lecturas en el texto de la solución
- INCLUYE MÚLTIPLES ENFOQUES para que sirva como base de comparación para diferentes respuestas estudiantiles`;
  } else {
    const skillsWithSourcesList = selectedSkills.map(skill => {
      const sourcesList = skill.selectedSources.map(source => 
        `  - "${source.title}" by ${source.authors} (${source.publication_year})`
      ).join('\n');
      
      return `• ${skill.name} (${skill.domainName}): ${skill.description}
  Selected sources:
${sourcesList}`;
    }).join('\n\n');

    return `Create a comprehensive and diverse solution for the provided assessment case.

SOLUTION OBJECTIVE:
The solution should serve as a complete reference that includes multiple approaches and perspectives for solving the case, considering that different students may approach the problem in distinct ways. It should demonstrate mastery of the evaluated skills and utilize knowledge from the selected sources.

ASSESSMENT INFORMATION:
Description: ${assessmentDescription}
Difficulty Level: ${difficultyLevel}
Educational Level: ${educationalLevel}
Evaluation Context: ${evaluationContext}

EVALUATED SKILLS AND THEIR SOURCES:
${skillsWithSourcesList}

CASE TO SOLVE:
${caseText}

INSTRUCTIONS FOR THE SOLUTION:
- The solution should be comprehensive and cover all aspects of the case from multiple perspectives
- Should demonstrate mastery of all evaluated skills
- The content should be inspired by the selected sources
- Should be appropriate for the educational level (${educationalLevel}) and difficulty (${difficultyLevel})
- The language should be clear and accessible
- DO NOT mention sources, authors or readings in the solution text
- The output language is the one selected by the user (English)
- INCLUDE MULTIPLE APPROACHES AND PERSPECTIVES to address the problem

SOLUTION STRUCTURE:

**1. COMPREHENSIVE PROBLEM ANALYSIS:**
- Identification of key elements of the case from different perspectives
- Analysis of main variables and their interrelationships
- Consideration of different possible interpretations of the problem

**2. DETAILED MULTIPLE SOLUTION APPROACHES:**

**MAIN/CONVENTIONAL APPROACH:**
- Explain in detail the most direct and commonly accepted solution
- Describe step by step how this approach would be applied
- Justify why it is considered the "standard" approach
- Include specific examples of application
- Mention the main advantages of this approach

**ALTERNATIVE APPROACH 1:**
- Completely describe a different or innovative perspective
- Explain in detail how it differs from the conventional approach
- Justify the theoretical or practical reasons for this approach
- Include specific examples of when it would be more appropriate
- Analyze the specific advantages and disadvantages of this approach

**ALTERNATIVE APPROACH 2:**
- Fully develop another way to approach the problem
- Explain the fundamental differences with other approaches
- Justify the theoretical or methodological basis of this approach
- Include concrete examples of application
- Analyze the circumstances where this approach would be optimal

**3. DETAILED CONCEPT APPLICATION FROM DIFFERENT PERSPECTIVES:**

**APPLICATION FROM THEORETICAL PERSPECTIVE:**
- Explain in detail how theoretical concepts are applied
- Describe the specific theories that can be utilized
- Justify the choice of particular theoretical frameworks
- Include examples of how theories manifest in practice

**APPLICATION FROM PRACTICAL PERSPECTIVE:**
- Describe how concepts translate into concrete actions
- Explain the specific steps to implement each approach
- Include examples of similar cases where they have been applied
- Analyze the expected results of each practical application

**APPLICATION FROM METHODOLOGICAL PERSPECTIVE:**
- Explain the different methodologies that can be employed
- Describe the specific processes of each methodology
- Justify the choice of particular methods
- Include examples of methodological application

**INTEGRATION OF MULTIPLE PERSPECTIVES:**
- Explain how different perspectives complement each other
- Describe the synergy between theoretical, practical, and methodological approaches
- Justify why integration is more effective
- Include examples of successful integration

**4. DETAILED COMPARATIVE ANALYSIS OF APPROACHES:**

**SYSTEMATIC COMPARISON OF APPROACHES:**
- Analyze point by point the advantages and disadvantages of each approach
- Compare the effectiveness of each approach in different scenarios
- Evaluate the complexity of implementation of each approach
- Analyze the resources needed for each approach

**FACTORS FOR APPROACH SELECTION:**
- Explain in detail what factors determine the choice of an approach
- Describe the specific circumstances where each approach is optimal
- Analyze time, resource, and context limitations
- Include decision criteria for different situations

**ANALYSIS OF CONTEXTS AND SITUATIONS:**
- Describe how each approach adapts to different contexts
- Explain the necessary modifications for different situations
- Analyze the flexibility and adaptability of each approach
- Include examples of application in specific contexts

**EVALUATION OF ROBUSTNESS AND RELIABILITY:**
- Analyze the consistency of results of each approach
- Evaluate each approach's capacity to handle uncertainties
- Describe the risks associated with each approach
- Include analysis of edge cases and extreme situations

**5. DETAILED EVALUATION CRITERIA FOR DIFFERENT RESPONSES:**

**ESSENTIAL ELEMENTS THAT ANY VALID RESPONSE SHOULD CONTAIN:**
- Detailed list of key concepts that must be present
- Explanation of why each element is fundamental
- Examples of how these elements can be manifested
- Indicators of basic vs. advanced understanding

**ACCEPTABLE LEVELS OF DEPTH AND SOPHISTICATION:**
- Describe in detail the acceptable basic level of understanding
- Explain what constitutes an intermediate level of analysis
- Define what characterizes an advanced or expert level
- Include specific examples of each level

**CRITERIA FOR EVALUATING ORIGINALITY AND CREATIVITY:**
- Explain what constitutes an original response
- Describe how to evaluate creativity in the approach
- Include criteria for valuing innovation in the solution
- Analyze how to recognize divergent thinking

**INDICATORS OF DEEP VS. SUPERFICIAL UNDERSTANDING:**
- Detailed list of signs of deep understanding
- Describe indicators of superficial understanding
- Explain how to distinguish between memorization and real understanding
- Include examples of responses that demonstrate each level

**DETAILED EVALUATION RUBRIC:**
- Specific criteria for each evaluated skill
- Evaluation scales with detailed descriptions
- Reference points for different performance levels
- Guidelines for score assignment

**6. DETAILED ADDITIONAL CONSIDERATIONS AND LIMITATIONS:**

**SPECIFIC LIMITATIONS OF EACH APPROACH:**
- Analyze in detail the limitations of the conventional approach
- Describe the specific restrictions of alternative approach 1
- Explain the limitations of alternative approach 2
- Include examples of situations where each approach would fail

**DETAILED ETHICAL CONSIDERATIONS:**
- Explain the ethical implications of each approach
- Describe the ethical dilemmas that may arise
- Analyze the impact on different stakeholder groups
- Include considerations of justice and equity
- Justify ethical decisions with clear principles

**PRACTICAL AND OPERATIONAL CONSIDERATIONS:**
- Analyze the practical feasibility of each approach
- Describe the resources needed for implementation
- Explain the operational barriers that may arise
- Include time and cost considerations
- Analyze the scalability of each approach

**SPECIFIC CONTEXTUAL CONSIDERATIONS:**
- Describe how cultural context affects each approach
- Explain the necessary adaptations for different environments
- Analyze the influence of institutional context
- Include policy and regulatory considerations
- Justify contextual decisions

**POSSIBLE EXTENSIONS AND FUTURE APPLICATIONS:**
- Describe how each approach can evolve
- Explain possible improvements and refinements
- Analyze applications in other contexts or problems
- Include considerations for future research
- Justify projections with evidence

FORMAT:
- Use **bold** to emphasize important elements
- Use *italics* for key concepts (but avoid complex technical terms)
- The text should flow naturally and be easy to understand
- Total limit: 10000 characters (distribute appropriately between sections)
- Prioritize clarity and accessibility over length
- The solution should be complete and diverse

IMPORTANT: 
- The solution should serve as a comprehensive reference for evaluating different types of student responses
- Should demonstrate mastery of all evaluated skills from multiple perspectives
- The content should be inspired by the provided sources, but presented in a natural and accessible way
- DO NOT mention sources, authors or readings in the solution text
- INCLUDE MULTIPLE APPROACHES to serve as a basis for comparison for different student responses`;
  }
} 