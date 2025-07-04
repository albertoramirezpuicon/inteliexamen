import { NextRequest, NextResponse } from 'next/server';
import { query, insertQuery } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attemptId } = await params;

    if (!attemptId) {
      return NextResponse.json(
        { error: 'Attempt ID is required' },
        { status: 400 }
      );
    }

    // Get conversation messages
    const conversationQuery = `
      SELECT 
        id,
        attempt_id,
        message_type,
        message_text,
        created_at
      FROM inteli_assessments_conversations
      WHERE attempt_id = ?
      ORDER BY created_at ASC
    `;

    const conversationResult = await query(conversationQuery, [attemptId]);

    return NextResponse.json({
      conversation: conversationResult || []
    });

  } catch (error) {
    console.error('Error loading conversation:', error);
    return NextResponse.json(
      { error: 'Failed to load conversation' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { message, assessmentId } = await request.json();
    const { id: attemptId } = await params;

    if (!message || !attemptId || !assessmentId) {
      return NextResponse.json(
        { error: 'Message, Attempt ID, and Assessment ID are required' },
        { status: 400 }
      );
    }

    // Verify attempt exists and is in progress
    const attemptQuery = `
      SELECT 
        id,
        assessment_id,
        user_id,
        status
      FROM inteli_assessments_attempts
      WHERE id = ?
    `;

    const attemptResult = await query(attemptQuery, [attemptId]);
    
    if (!attemptResult || attemptResult.length === 0) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    const attempt = attemptResult[0];

    if (attempt.status === 'Completed') {
      return NextResponse.json(
        { error: 'Assessment already completed' },
        { status: 400 }
      );
    }

    // Save student message
    const saveMessageQuery = `
      INSERT INTO inteli_assessments_conversations (
        attempt_id,
        message_type,
        message_text,
        created_at
      ) VALUES (?, 'student', ?, NOW())
    `;

    const saveResult = await insertQuery(saveMessageQuery, [attemptId, message]);

    if (!saveResult || !saveResult.insertId) {
      throw new Error('Failed to save message');
    }

    // Update attempt's updated_at field (every time there's a new reply)
    const updateAttemptQuery = `
      UPDATE inteli_assessments_attempts
      SET updated_at = NOW()
      WHERE id = ?
    `;

    await query(updateAttemptQuery, [attemptId]);

    // Get assessment details for AI evaluation
    const assessmentQuery = `
      SELECT 
        a.id,
        a.name,
        a.case_text,
        a.questions_per_skill,
        a.output_language,
        s.id as skill_id,
        s.name as skill_name,
        s.description as skill_description
      FROM inteli_assessments a
      INNER JOIN inteli_assessments_skills as2 ON a.id = as2.assessment_id
      INNER JOIN inteli_skills s ON as2.skill_id = s.id
      WHERE a.id = ?
    `;

    const assessmentResult = await query(assessmentQuery, [assessmentId]);

    if (!assessmentResult || assessmentResult.length === 0) {
      throw new Error('Assessment not found');
    }

    // Get conversation history for context
    const historyQuery = `
      SELECT 
        message_type,
        message_text
      FROM inteli_assessments_conversations
      WHERE attempt_id = ?
      ORDER BY created_at ASC
    `;

    const historyResult = await query(historyQuery, [attemptId]);

    // Get skill levels for each skill
    const skillsWithLevels = await Promise.all(
      assessmentResult.map(async (skill: { skill_id: number; skill_name: string; skill_description: string }) => {
        const levelsQuery = `
          SELECT 
            id,
            \`order\`,
            label,
            description
          FROM inteli_skills_levels
          WHERE skill_id = ?
          ORDER BY \`order\`
        `;
        
        const levelsResult = await query(levelsQuery, [skill.skill_id]);
        
        return {
          ...skill,
          levels: levelsResult || []
        };
      })
    );

    // Count conversation turns to check if this is the last turn
    const turnCount = historyResult.length / 2; // Each turn = student + AI message
    const maxTurns = assessmentResult.length * assessmentResult[0].questions_per_skill;
    const isLastTurn = turnCount >= maxTurns;

    // Call AI evaluation
    const aiResponse = await evaluateWithAI({
      studentReply: message,
      assessment: assessmentResult[0],
      skills: skillsWithLevels,
      conversationHistory: historyResult,
    });

    // Force final evaluation if it's the last turn and AI didn't evaluate as final
    if (isLastTurn && aiResponse.evaluationType !== 'final') {
      console.log('Last turn reached, forcing final evaluation');
      aiResponse.evaluationType = 'final';
      aiResponse.canDetermineLevel = true;
      aiResponse.message = assessmentResult[0].output_language === 'es'
        ? 'Has alcanzado el límite máximo de turnos. Procederé a evaluar tu respuesta final.'
        : 'You have reached the maximum number of turns. I will now evaluate your final response.';
    }

    // Save AI response
    if (aiResponse.message) {
      const saveAIQuery = `
        INSERT INTO inteli_assessments_conversations (
          attempt_id,
          message_type,
          message_text,
          created_at
        ) VALUES (?, 'ai', ?, NOW())
      `;

      await query(saveAIQuery, [attemptId, aiResponse.message]);
    }

    // If level can be determined, save results and complete attempt
    if (aiResponse.evaluationType === 'final' && aiResponse.canDetermineLevel && aiResponse.skillResults) {
      console.log('AI Response:', JSON.stringify(aiResponse, null, 2));
      console.log('Available skill levels:', skillsWithLevels.map(skill => ({
        skillId: skill.skill_id,
        skillName: skill.skill_name,
        levels: skill.levels.map((level: { id: number; label: string }) => ({ id: level.id, label: level.label }))
      })));
      
      // Validate skill level IDs before saving
      const validSkillLevels = new Map();
      
      for (const skill of skillsWithLevels) {
        for (const level of skill.levels) {
          validSkillLevels.set(level.id, { skillId: skill.skill_id, level });
        }
      }
      
      console.log('Valid skill level IDs:', Array.from(validSkillLevels.keys()));
      
      // Validate and save results for each skill
      for (const result of aiResponse.skillResults) {
        console.log(`Processing result for skill ${result.skillId}, level ${result.skillLevelId}`);
        
        // Check if the skill level ID is valid
        if (!validSkillLevels.has(result.skillLevelId)) {
          console.error(`Invalid skill level ID: ${result.skillLevelId} for skill: ${result.skillId}`);
          throw new Error(`Invalid skill level ID provided by AI: ${result.skillLevelId}`);
        }
        
        const validLevel = validSkillLevels.get(result.skillLevelId);
        
        // Double-check that the skill ID matches
        if (validLevel.skillId !== result.skillId) {
          console.error(`Skill ID mismatch: AI provided ${result.skillId}, but level ${result.skillLevelId} belongs to skill ${validLevel.skillId}`);
          throw new Error(`Skill ID mismatch in AI response`);
        }
        
        const saveResultQuery = `
          INSERT INTO inteli_assessments_results (
            attempt_id,
            skill_id,
            skill_level_id,
            feedback
          ) VALUES (?, ?, ?, ?)
        `;

        await query(saveResultQuery, [
          attemptId,
          result.skillId,
          result.skillLevelId,
          result.feedback
        ]);
      }

      // Mark attempt as completed
      const completeAttemptQuery = `
        UPDATE inteli_assessments_attempts
        SET status = 'Completed', completed_at = NOW(), updated_at = NOW()
        WHERE id = ?
      `;

      await query(completeAttemptQuery, [attemptId]);
    }

    return NextResponse.json({
      success: true,
      message: aiResponse.message,
      evaluationType: aiResponse.evaluationType,
      canDetermineLevel: aiResponse.canDetermineLevel,
      skillResults: aiResponse.skillResults || [],
      missingAspects: aiResponse.missingAspects || [],
      improvementSuggestions: aiResponse.improvementSuggestions || [],
      attemptCompleted: aiResponse.evaluationType === 'final'
    });

  } catch (error) {
    console.error('Error processing conversation:', error);
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Failed to process conversation';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('ECONNRESET') || error.message.includes('PROTOCOL_CONNECTION_LOST')) {
        errorMessage = 'Database connection error. Please try again.';
        statusCode = 503; // Service Unavailable
      } else if (error.message.includes('OpenAI API')) {
        errorMessage = 'AI service temporarily unavailable. Please try again.';
        statusCode = 503;
      } else if (error.message.includes('Failed to save message')) {
        errorMessage = 'Failed to save your message. Please try again.';
        statusCode = 500;
      } else if (error.message.includes('Assessment not found')) {
        errorMessage = 'Assessment not found.';
        statusCode = 404;
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

async function evaluateWithAI(params: {
  studentReply: string;
  assessment: {
    case_text: string;
    questions_per_skill: number;
    output_language: string;
  };
  skills: Array<{
    skill_id: number;
    skill_name: string;
    skill_description: string;
    levels: Array<{
      id: number;
      label: string;
      description: string;
    }>;
  }>;
  conversationHistory: Array<{
    message_type: string;
    message_text: string;
  }>;
}) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
  const MODEL = 'gpt-4o';

  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const { studentReply, assessment, skills, conversationHistory } = params;

  // Count conversation turns
  const turnCount = conversationHistory.length / 2; // Each turn = student + AI message
  const maxTurns = skills.length * assessment.questions_per_skill;

  const prompt = createEvaluationPrompt({
    studentReply,
    assessment,
    skills,
    conversationHistory,
    turnCount,
    maxTurns,
    outputLanguage: assessment.output_language
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
          content: assessment.output_language === 'es' 
            ? 'Eres un evaluador experto especializado en determinar el nivel de competencia de estudiantes en habilidades específicas.'
            : 'You are an expert evaluator specialized in determining student competency levels in specific skills.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 4000,
      temperature: 0.3,
      n: 1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const aiResponseText = data.choices?.[0]?.message?.content || '';

  // Parse JSON response
  try {
    let jsonText = aiResponseText.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Remove any leading/trailing whitespace and newlines
    jsonText = jsonText.trim();
    
    // Try to parse the cleaned JSON
    const parsedResponse = JSON.parse(jsonText);
    
    // Validate the response structure
    if (typeof parsedResponse !== 'object' || parsedResponse === null) {
      throw new Error('AI response is not a valid object');
    }
    
    if (typeof parsedResponse.evaluationType !== 'string') {
      throw new Error('AI response missing evaluationType field');
    }
    
    if (!['incomplete', 'improvable', 'final'].includes(parsedResponse.evaluationType)) {
      throw new Error('AI response evaluationType must be incomplete, improvable, or final');
    }
    
    if (typeof parsedResponse.message !== 'string') {
      throw new Error('AI response missing message field');
    }
    
    // Validate based on evaluation type
    if (parsedResponse.evaluationType === 'incomplete') {
      if (!Array.isArray(parsedResponse.missingAspects)) {
        throw new Error('AI response missing missingAspects array for incomplete evaluation');
      }
      parsedResponse.canDetermineLevel = false;
      parsedResponse.skillResults = [];
    } else if (parsedResponse.evaluationType === 'improvable') {
      if (!Array.isArray(parsedResponse.improvementSuggestions)) {
        throw new Error('AI response missing improvementSuggestions array for improvable evaluation');
      }
      parsedResponse.canDetermineLevel = false;
      parsedResponse.skillResults = [];
    } else if (parsedResponse.evaluationType === 'final') {
      if (typeof parsedResponse.canDetermineLevel !== 'boolean') {
        throw new Error('AI response missing canDetermineLevel field for final evaluation');
      }
      if (!parsedResponse.canDetermineLevel) {
        throw new Error('AI response canDetermineLevel must be true for final evaluation');
      }
      if (!Array.isArray(parsedResponse.skillResults)) {
        throw new Error('AI response missing skillResults array for final evaluation');
      }
    }
    
    return parsedResponse;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    console.error('Raw AI response:', aiResponseText);
    
    // Return a fallback response
    return {
      evaluationType: 'incomplete',
      canDetermineLevel: false,
      message: assessment.output_language === 'es' 
        ? 'Lo siento, hubo un error al procesar tu respuesta. Por favor, intenta de nuevo.'
        : 'Sorry, there was an error processing your response. Please try again.',
      missingAspects: [],
      improvementSuggestions: [],
      skillResults: []
    };
  }
}

function createEvaluationPrompt(params: {
  studentReply: string;
  assessment: {
    case_text: string;
    output_language: string;
  };
  skills: Array<{
    skill_id: number;
    skill_name: string;
    skill_description: string;
    levels: Array<{
      id: number;
      label: string;
      description: string;
    }>;
  }>;
  conversationHistory: Array<{
    message_type: string;
    message_text: string;
  }>;
  turnCount: number;
  maxTurns: number;
  outputLanguage: string;
}): string {
  const { studentReply, assessment, skills, conversationHistory, turnCount, maxTurns, outputLanguage } = params;

  const conversationText = conversationHistory
    .map(msg => `${msg.message_type === 'student' ? 'Student' : 'AI'}: ${msg.message_text}`)
    .join('\n');

  const skillsText = skills.map(skill => {
    const levelsText = skill.levels.map((level: { id: number; label: string; description: string }) => 
      `- Level ID ${level.id} (${level.label}): ${level.description}`
    ).join('\n');
    
    return `Skill ID ${skill.skill_id}: ${skill.skill_name}
Description: ${skill.skill_description}
Levels:
${levelsText}`;
  }).join('\n\n');

  if (outputLanguage === 'es') {
    return `Evalúa la respuesta del estudiante usando un sistema de tres niveles para determinar la mejor acción.

CONTEXTO DE LA EVALUACIÓN:
- Caso: ${assessment.case_text}
- Respuesta del estudiante: ${studentReply}
- Turno actual: ${turnCount} de ${maxTurns} máximo

HABILIDADES A EVALUAR:
${skillsText}

HISTORIAL DE CONVERSACIÓN:
${conversationText}

SISTEMA DE EVALUACIÓN DE TRES NIVELES:

1. INCOMPLETA: La respuesta no cubre todas las preguntas del caso o aspectos de las habilidades
   - Identifica qué preguntas o aspectos faltan
   - Pide al estudiante que aborde elementos específicos faltantes
   - NO muestres puntuación aún

2. COMPLETA PERO MEJORABLE: La respuesta cubre todos los aspectos pero no con calidad suficiente para el nivel más alto
   - Reconoce que la respuesta es completa
   - Proporciona sugerencias específicas de mejora
   - Anima a elaborar aspectos específicos de las habilidades
   - NO muestres puntuación aún

3. FINAL: Alta calidad O se alcanzó el límite de turnos
   - Determina los niveles de habilidad
   - Muestra resultados finales
   - Completa la evaluación

INSTRUCCIONES ESPECÍFICAS:
- Analiza si la respuesta aborda TODAS las preguntas del caso
- Verifica si cubre TODOS los aspectos mencionados en las descripciones de habilidades
- Considera la calidad y profundidad de la respuesta
- Si es el último turno disponible, evalúa como FINAL
- IMPORTANTE: Usa ÚNICAMENTE los IDs exactos proporcionados arriba para skillId y skillLevelId

IMPORTANTE: Responde ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones adicionales.

RESPONDE EN FORMATO JSON:
{
  "evaluationType": "incomplete" | "improvable" | "final",
  "message": "Mensaje para el estudiante",
  "canDetermineLevel": true/false,
  "skillResults": [
    {
      "skillId": número_exacto_del_skill,
      "skillLevelId": número_exacto_del_nivel,
      "feedback": "Feedback específico para esta habilidad"
    }
  ],
  "missingAspects": ["aspecto1", "aspecto2"],
  "improvementSuggestions": ["sugerencia1", "sugerencia2"]
}

REGLAS:
- evaluationType "incomplete": missingAspects requerido, skillResults vacío
- evaluationType "improvable": improvementSuggestions requerido, skillResults vacío
- evaluationType "final": skillResults requerido, canDetermineLevel = true
- canDetermineLevel solo true para "final"
- NO uses markdown, NO uses \`\`\`json, responde SOLO el JSON
- USA ÚNICAMENTE los IDs exactos proporcionados en la lista de habilidades`;
  } else {
    return `Evaluate the student's response using a three-tier system to determine the best action.

EVALUATION CONTEXT:
- Case: ${assessment.case_text}
- Student's response: ${studentReply}
- Current turn: ${turnCount} of ${maxTurns} maximum

SKILLS TO EVALUATE:
${skillsText}

CONVERSATION HISTORY:
${conversationText}

THREE-TIER EVALUATION SYSTEM:

1. INCOMPLETE: The response doesn't cover all case questions or skill aspects
   - Identify which questions or aspects are missing
   - Ask the student to address specific missing elements
   - DO NOT show score yet

2. IMPROVABLE: The response covers all aspects but not with sufficient quality for the highest level
   - Acknowledge that the response is complete
   - Provide specific improvement suggestions
   - Encourage elaboration on specific skill aspects
   - DO NOT show score yet

3. FINAL: High quality OR turn limit reached
   - Determine skill levels
   - Show final results
   - Complete evaluation

SPECIFIC INSTRUCTIONS:
- Analyze if the response addresses ALL case questions
- Verify if it covers ALL aspects mentioned in skill descriptions
- Consider the quality and depth of the response
- If it's the last available turn, evaluate as FINAL
- IMPORTANT: Use ONLY the exact IDs provided above for skillId and skillLevelId

IMPORTANT: Respond ONLY with valid JSON, no markdown, no additional explanations.

RESPOND IN JSON FORMAT:
{
  "evaluationType": "incomplete" | "improvable" | "final",
  "message": "Message for the student",
  "canDetermineLevel": true/false,
  "skillResults": [
    {
      "skillId": exact_skill_number,
      "skillLevelId": exact_level_number,
      "feedback": "Specific feedback for this skill"
    }
  ],
  "missingAspects": ["aspect1", "aspect2"],
  "improvementSuggestions": ["suggestion1", "suggestion2"]
}

RULES:
- evaluationType "incomplete": missingAspects required, skillResults empty
- evaluationType "improvable": improvementSuggestions required, skillResults empty
- evaluationType "final": skillResults required, canDetermineLevel = true
- canDetermineLevel only true for "final"
- DO NOT use markdown, DO NOT use \`\`\`json, respond ONLY the JSON
- USE ONLY the exact IDs provided in the skills list`;
  }
}