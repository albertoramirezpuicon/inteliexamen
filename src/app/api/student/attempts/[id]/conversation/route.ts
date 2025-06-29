import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

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

    const saveResult = await query(saveMessageQuery, [attemptId, message]);

    if (!saveResult || !saveResult.insertId) {
      throw new Error('Failed to save message');
    }

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
      assessmentResult.map(async (skill: any) => {
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

    // Call AI evaluation
    const aiResponse = await evaluateWithAI({
      studentReply: message,
      assessment: assessmentResult[0],
      skills: skillsWithLevels,
      conversationHistory: historyResult,
      attemptId
    });

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
    if (aiResponse.canDetermineLevel && aiResponse.skillResults) {
      console.log('AI Response:', JSON.stringify(aiResponse, null, 2));
      console.log('Available skill levels:', skillsWithLevels.map(skill => ({
        skillId: skill.skill_id,
        skillName: skill.skill_name,
        levels: skill.levels.map((level: any) => ({ id: level.id, label: level.label }))
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
      aiResponse,
      results: aiResponse.skillResults || []
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
  assessment: any;
  skills: any[];
  conversationHistory: any[];
  attemptId: number;
}) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
  const MODEL = 'gpt-4o';

  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const { studentReply, assessment, skills, conversationHistory, attemptId } = params;

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
    
    if (typeof parsedResponse.canDetermineLevel !== 'boolean') {
      throw new Error('AI response missing canDetermineLevel field');
    }
    
    if (typeof parsedResponse.message !== 'string') {
      throw new Error('AI response missing message field');
    }
    
    return parsedResponse;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    console.error('Raw AI response:', aiResponseText);
    
    // Return a fallback response
    return {
      canDetermineLevel: false,
      message: assessment.output_language === 'es' 
        ? 'Lo siento, hubo un error al procesar tu respuesta. Por favor, intenta de nuevo.'
        : 'Sorry, there was an error processing your response. Please try again.'
    };
  }
}

function createEvaluationPrompt(params: {
  studentReply: string;
  assessment: any;
  skills: any[];
  conversationHistory: any[];
  turnCount: number;
  maxTurns: number;
  outputLanguage: string;
}): string {
  const { studentReply, assessment, skills, conversationHistory, turnCount, maxTurns, outputLanguage } = params;

  const conversationText = conversationHistory
    .map(msg => `${msg.message_type === 'student' ? 'Student' : 'AI'}: ${msg.message_text}`)
    .join('\n');

  const skillsText = skills.map(skill => {
    const levelsText = skill.levels.map((level: any) => 
      `- Level ID ${level.id} (${level.label}): ${level.description}`
    ).join('\n');
    
    return `Skill ID ${skill.skill_id}: ${skill.skill_name}
Description: ${skill.skill_description}
Levels:
${levelsText}`;
  }).join('\n\n');

  if (outputLanguage === 'es') {
    return `Evalúa la respuesta del estudiante y determina si se puede establecer su nivel de competencia.

CONTEXTO DE LA EVALUACIÓN:
- Caso: ${assessment.case_text}
- Respuesta del estudiante: ${studentReply}
- Turno actual: ${turnCount} de ${maxTurns} máximo

HABILIDADES A EVALUAR:
${skillsText}

HISTORIAL DE CONVERSACIÓN:
${conversationText}

INSTRUCCIONES:
1. Analiza si la respuesta del estudiante es suficiente para determinar su nivel de competencia
2. Si NO se puede determinar el nivel, pide más información o aclare la respuesta
3. Si SÍ se puede determinar, asigna el nivel más apropiado para cada habilidad
4. Considera que el número máximo de turnos es: ${maxTurns}
5. IMPORTANTE: Usa ÚNICAMENTE los IDs exactos proporcionados arriba para skillId y skillLevelId

IMPORTANTE: Responde ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones adicionales.

RESPONDE EN FORMATO JSON:
{
  "canDetermineLevel": true/false,
  "message": "Mensaje para el estudiante",
  "skillResults": [
    {
      "skillId": número_exacto_del_skill,
      "skillLevelId": número_exacto_del_nivel,
      "feedback": "Feedback específico para esta habilidad"
    }
  ]
}

Si canDetermineLevel es false, skillResults debe estar vacío o no incluido.
Si canDetermineLevel es true, debe incluir un resultado para cada habilidad.
NO uses markdown, NO uses \`\`\`json, responde SOLO el JSON.
USA ÚNICAMENTE los IDs exactos proporcionados en la lista de habilidades.`;
  } else {
    return `Evaluate the student's response and determine if their competency level can be established.

EVALUATION CONTEXT:
- Case: ${assessment.case_text}
- Student's response: ${studentReply}
- Current turn: ${turnCount} of ${maxTurns} maximum

SKILLS TO EVALUATE:
${skillsText}

CONVERSATION HISTORY:
${conversationText}

INSTRUCTIONS:
1. Analyze if the student's response is sufficient to determine their competency level
2. If the level CANNOT be determined, ask for more information or clarify the response
3. If the level CAN be determined, assign the most appropriate level for each skill
4. Consider that the maximum number of turns is: ${maxTurns}
5. IMPORTANT: Use ONLY the exact IDs provided above for skillId and skillLevelId

IMPORTANT: Respond ONLY with valid JSON, no markdown, no additional explanations.

RESPOND IN JSON FORMAT:
{
  "canDetermineLevel": true/false,
  "message": "Message for the student",
  "skillResults": [
    {
      "skillId": exact_skill_number,
      "skillLevelId": exact_level_number,
      "feedback": "Specific feedback for this skill"
    }
  ]
}

If canDetermineLevel is false, skillResults should be empty or not included.
If canDetermineLevel is true, must include a result for each skill.
DO NOT use markdown, DO NOT use \`\`\`json, respond ONLY the JSON.
USE ONLY the exact IDs provided in the skills list.`;
  }
}