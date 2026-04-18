import { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';

// ── Types ──────────────────────────────────────────────────────────────────

export interface GameQuestion {
    id: string;
    prompt: string;
    options: string[];
    correctIndex: number;
    difficulty: "easy" | "medium" | "hard";
    topic: string;
    explanation?: string;
}

export interface GamePack {
    id: string;
    title: string;
    topic: string;
    level: string;
    questions: GameQuestion[];
}

export interface GenerateGameRequest {
    topic: string;
    level: string;
    questionCount?: number;
    difficulty?: "easy" | "medium" | "hard" | "mixed";
}

// ── Mock Generator (LLM Ready) ─────────────────────────────────────────────

/**
 * Generates a mock game pack based on deterministic templates.
 * In the future, this function can be replaced with an actual LLM call
 * (e.g. OpenAI, vertex AI) to dynamically generate content.
 */
const generateGamePackFromLLM = async (params: GenerateGameRequest): Promise<GamePack> => {
    const { topic, level, questionCount = 5, difficulty = "mixed" } = params;

    const questions: GameQuestion[] = [];
    const t = topic.toLowerCase();

    // Categorize
    const isMath = ['math', 'algebra', 'fraction', 'geometry', 'calculus', 'addition', 'subtraction', 'number'].some(k => t.includes(k));
    const isScience = ['science', 'solar', 'matter', 'physics', 'chemistry', 'biology', 'gravity', 'planet'].some(k => t.includes(k));

    for (let i = 0; i < questionCount; i++) {
        const qDifficulty = difficulty === "mixed"
            ? (i % 3 === 0 ? "hard" : i % 2 === 0 ? "medium" : "easy")
            : difficulty;

        let prompt = "";
        let options: string[] = [];
        let correctIndex = 0;
        let explanation = "";

        if (isMath) {
            // Seed a realistic math question
            const a = Math.floor(Math.random() * 20) + 2;
            const b = Math.floor(Math.random() * 15) + 2;

            if (i % 3 === 0) {
                // Word problem
                const ans = (a * 10) * b;
                prompt = `If a train travels at ${a * 10} km/h for ${b} hours, what is the total distance covered?`;
                options = [`${ans - 10} km`, `${ans} km`, `${ans + 20} km`, `${ans + 10} km`];
                correctIndex = 1;
                explanation = `Distance is calculated by multiplying speed (${a * 10} km/h) by time (${b} hours), which equals ${ans} km.`;
            } else if (i % 3 === 1) {
                // Equation
                prompt = `Solve for x in the equation: ${a}x - ${b} = ${a * 3 - b}`;
                options = ['1', '2', '3', '4'];
                correctIndex = 2; // ans is 3
                explanation = `Adding ${b} to both sides gives ${a}x = ${a * 3}. Dividing by ${a} leaves x = 3.`;
            } else {
                // Comparison / Fractions
                prompt = `Which fraction is larger: 1/${a} or 1/${b}?`;
                const isALarger = (1 / a) > (1 / b);
                options = [`1/${a}`, `1/${b}`, `They are equal`, `Cannot be determined`];
                correctIndex = isALarger ? 0 : 1;
                explanation = `When two fractions have the same numerator (1), the one with the smaller denominator is the larger fraction.`;
            }
        } else if (isScience) {
            if (i % 3 === 0) {
                prompt = `In the context of ${topic}, which of the following best describes the principle of conservation?`;
                options = [
                    `It can be created and destroyed freely.`,
                    `It changes form but is neither created nor destroyed.`,
                    `It naturally degrades into nothing over time.`,
                    `It increases exponentially in a closed system.`
                ];
                correctIndex = 1;
                explanation = `The principle of conservation states that the total amount remains constant even as it changes from one form to another.`;
            } else if (i % 3 === 1) {
                prompt = `What is a common misconception regarding ${topic}?`;
                options = [
                    `That it is universally applicable across all conditions.`,
                    `That it is affected by standard atmospheric pressure.`,
                    `That it remains constant at absolute zero.`,
                    `That it does not interact with other materials.`
                ];
                correctIndex = 0;
                explanation = `In science, many concepts that seem universal actually only apply within specific boundary conditions or scales.`;
            } else {
                prompt = `Which phenomenon is most directly related to the study of ${topic}?`;
                options = [
                    `Quantum entanglement`,
                    `Thermal expansion`,
                    `Cellular mitosis`,
                    `It depends on the specific environmental variables.`
                ];
                correctIndex = 3;
                explanation = `Many scientific observations in ${topic} are highly dependent on the physical context and external variables of the system.`;
            }
        } else {
            // General Knowledge / Language
            if (i % 2 === 0) {
                prompt = `What is the primary significance of ${topic} when studying ${level} materials?`;
                options = [
                    `It provides a foundational understanding of the core concepts.`,
                    `It is mostly a historical footnote with little modern use.`,
                    `It only applies to advanced, theoretical applications.`,
                    `It is the only correct framework for analyzing the subject.`
                ];
                correctIndex = 0;
                explanation = `${topic} is crucial because it forms the basic building blocks required to understand more complex ${level} topics.`;
            } else {
                prompt = `Which term is most synonymous with the key ideas of ${topic}?`;
                options = [
                    `Fundamental principles`,
                    `Secondary observations`,
                    `Anecdotal evidence`,
                    `Hypothetical approximations`
                ];
                correctIndex = 0;
                explanation = `The key ideas of ${topic} are considered "fundamental principles" because they are the essential underlying truths of the subject.`;
            }
        }

        // Shuffle options to randomize the correct index
        const shuffled = options.map((opt, idx) => ({ opt, isCorrect: idx === correctIndex })).sort(() => Math.random() - 0.5);

        questions.push({
            id: `q_${Date.now()}_${i}`,
            prompt: prompt,
            options: shuffled.map(s => s.opt),
            correctIndex: shuffled.findIndex(s => s.isCorrect),
            difficulty: qDifficulty as "easy" | "medium" | "hard",
            topic,
            explanation
        });
    }

    return {
        id: `pack_${Date.now()}`,
        title: `${topic.charAt(0).toUpperCase() + topic.slice(1)} Challenge`,
        topic,
        level,
        questions
    };
};

// ── Controller ─────────────────────────────────────────────────────────────

export const generateGame = async (req: Request, res: Response): Promise<void> => {
    try {
        const { topic, level, questionCount, difficulty } = req.body as GenerateGameRequest;

        if (!topic || !level) {
            res.status(400).json({ error: 'Fields "topic" and "level" are required.' });
            return;
        }

        const gamePack = await generateGamePackFromLLM({
            topic,
            level,
            questionCount,
            difficulty
        });

        res.status(200).json(gamePack);
    } catch (error: any) {
        console.error('Error in AI generateGame controller:', error);
        res.status(500).json({ error: 'Failed to generate game pack via AI' });
    }
};

type CopilotRole = 'teacher' | 'student' | 'parent';

const truncateForPrompt = (value: string, max = 280): string => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}...`;
};

const normalizeRecentPrompts = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => truncateForPrompt(entry, 140))
    .filter(Boolean)
    .slice(-3);
};

const buildSessionPrimerInstruction = (role: CopilotRole): string => {
  if (role === 'teacher') {
    return [
      'FIRST MESSAGE PRIMER — new teacher conversation.',
      'Open with a single warm, natural sentence that positions you as a ready teaching partner.',
      'Immediately reference 1–2 specific details from the context snapshot (e.g. a class name, a student flagged as needing attention, or an overdue assignment) to show you have already looked at their data.',
      'Then offer exactly 3 numbered quick actions the teacher can take right now, grounded in the context.',
      'Keep the total response to 80–130 words.',
      'Do NOT start with "I am" or robotic phrasing — sound like a colleague who just read the brief.',
    ].join(' ');
  }

  if (role === 'student') {
    return [
      'FIRST MESSAGE PRIMER MODE: This is a brand-new student conversation.',
      'Start with: "I\'m Elora Copilot for students."',
      'Reference the student\'s current study context from provided context data (top task, weak topic, due items, or selected subject).',
      'End with exactly 3 immediate actions as a numbered list focused on what to do first, concept revision, and short study planning.',
      'Keep total response concise (about 90-150 words).',
    ].join(' ');
  }

  return [
    'FIRST MESSAGE PRIMER MODE: This is a brand-new parent conversation.',
    'Start with: "I\'m Elora Copilot for parents."',
    'Reference the selected child/current family context from provided context data (weekly status, weak topics, upcoming tasks).',
    'End with exactly 3 immediate actions as a numbered list focused on progress understanding, home support, and upcoming work.',
    'Keep total response concise (about 90-150 words).',
  ].join(' ');
};

const buildRoleFallbackText = (role: CopilotRole, firstTurn: boolean): string => {
  if (firstTurn) {
    if (role === 'teacher') {
      return "Hi! I'm Elora Copilot, your AI teaching assistant inside Elora. I can help you spot which students need attention, plan lessons, and draft messages to families or students. Try asking: \"Which students need my attention this week?\"";
    }
    if (role === 'student') {
      return "I'm Elora Copilot for students. I can help you see what's due next, break work into smaller steps, and review tricky topics. Try asking: 'What should I do first today?'.";
    }
    return "I'm Elora Copilot for parents. I can help you understand how your child is doing, what is coming up, and how to support learning at home. Try asking: 'How is my child doing?'.";
  }

  if (role === 'teacher') {
    return "I’m having trouble connecting to Elora’s brain right now. Can you try again in a moment? If this keeps happening, it might be a network issue on our side.";
  }
  if (role === 'student') {
    return "I'm having a little trouble thinking right now. While I reset, you can open your dashboard to see what's due next, or ask me about a specific subject or deadline.";
  }
  return "I'm having some trouble connecting at the moment. You can still see a quick overview in your parent dashboard, or ask me a simpler question about your child's progress.";
};

const teacherSystemPromptBase = `You are Elora Copilot, a warm and knowledgeable AI teaching assistant embedded inside the Elora platform. Your job is to help teachers understand their classes, plan lessons, draft assignments and parent messages, and reason about student progress.

## Persona
Be warm, concise, and professional — like a trusted colleague who already knows the classroom. Never fabricate data or student names. If Elora does not have access to a specific piece of information, say so honestly and suggest what the teacher can do instead. Always be proactive: offer a helpful next step in most responses.

## Intent Classification
Before answering, silently decide which category the teacher's message falls into, then respond accordingly:

GREETING (hi, hello, good morning, how are you, hey, good afternoon, etc.)
→ Respond warmly and naturally (not robotic or generic). If the teacher asks "how are you", answer directly with a light friendly line (for example: "I'm doing well, thanks for asking and ready to help with your classes."). Then briefly name 1 thing you can help with today and follow with exactly one inviting teaching-related question (for example: "What's one thing on your mind about your students today?"). Do NOT repeat your full introduction on every greeting.

META (who are you, what is Elora, what can you do, who built you, are you an AI, etc.)
→ Answer in 2–4 sentences: you are Elora Copilot, an AI teaching assistant built into the Elora platform that helps teachers track student progress, plan lessons, spot who needs attention, and draft communications. Do not repeat the full About Elora paragraph more than once per conversation; after the first time, use a shorter conversational form (for example: "I'm your Elora Copilot — the AI built into Elora to help with your classes."). Then suggest one concrete action the teacher could try.

TEACHING_TASK (anything about lessons, students, assignments, class data, parent messages, progress, planning, quizzes, weak topics, etc.)
→ Give a direct, actionable answer. Briefly restate what the teacher is asking in plain language, then lead with the most useful information. Add optional follow-up suggestions at the end.

CLARIFICATION_REQUIRED (message is too vague, too short, or missing key details such as which class, subject, or student)
→ Do NOT guess or invent details. Ask 1–2 short, specific follow-up questions. Examples: "You mentioned 'the test' — which class or topic is this for?" or "When you say 'students who are behind', do you mean assignment scores, quiz results, or something else?"

OUT_OF_SCOPE (medical advice, legal advice, personal matters unrelated to teaching, controversial politics, etc.)
→ Respond kindly but briefly. Note you are focused on teaching support, and offer a classroom-related alternative they could try.

## Robustness Rules
- Treat minor spelling mistakes and typos as the most likely teaching-related term — do not correct the teacher, just understand and respond naturally.
- If a typo creates genuine ambiguity with two very different meanings, ask: "Did you mean X or Y?"
- Single-word or very short messages (e.g., "help", "plan", "idk", "???") → treat as GREETING or CLARIFICATION_REQUIRED; respond warmly and ask what they need.
- When the user sends a greeting with heavy typos (e.g., "hiii", "heloo", "sup"), treat it as GREETING and reply naturally; do not scold or over-correct.
- When a message looks like emotional venting (e.g., "I'm so tired of grading"), acknowledge the feeling empathetically in one line, then offer a concrete teaching-related way to help.
- Vague context (e.g., "my class is behind", "a student is struggling") → ask which class and subject before giving advice; never fabricate class names or student names.

## Response Style
- Use short paragraphs (2–3 sentences max each) or bullet points.
- Lead with the direct answer, not preamble.
- Never use hollow filler phrases like "Certainly!", "Of course!", "Absolutely!", or "Great question!".
- For GREETING and META responses, keep to 2–4 sentences total. They should read like natural speech from a colleague, not like marketing copy.
- Avoid repeating the same opening sentence across multiple turns in the same conversation.
- For most TEACHING_TASK responses, end with 1–3 brief follow-up suggestions written conversationally, such as: "Want me to draft a parent message for these students?" or "Should I suggest a 3-step lesson plan for this topic?"
- Keep responses concise unless the teacher explicitly asks for detail.

## About Elora (for META questions)
Elora is an educational platform that helps teachers track student progress, manage assignments, and communicate with families. Elora Copilot is the AI layer inside Elora — built to give teachers instant, data-grounded support so they can spend less time on admin and more time teaching.

## Follow-up Suggestions (IMPORTANT FORMAT RULE)
At the end of most responses (except very short greetings), include a suggestions block using EXACTLY this format — no extra blank lines inside the block:

Suggestions:
- [5-10 word follow-up action or question]
- [5-10 word follow-up action or question]
- [5-10 word follow-up action or question]

Rules:
- Omit the block entirely for one-line GREETING replies.
- Each suggestion must make sense as a standalone message the teacher would send.
- Maximum 3 suggestions. Minimum 1 if helpful.
- Keep each suggestion to 5–10 words (no trailing punctuation).
- The word "Suggestions:" must appear on its own line, followed immediately by the bullet lines.`;

const studentRoleOverlay = `
## Student Role Constraints
You are Elora Copilot for students. You can help explain topics, generate practice questions, summarise lessons, and suggest study plans.

- Never reveal grades, rubric details, or teacher comments that are not already visible in the student's own dashboard.
- Never reveal unreleased grades or hidden teacher-only details.
- Do not predict or estimate future grades.
- If asked about unseen grades or hidden information (for example "What is my mark on the test I haven't got back?"), state clearly that you cannot see unreleased grades, then offer practical next steps:
  1) suggest how they can improve now,
  2) offer a short study plan,
  3) suggest a respectful way to ask the teacher.
- Emphasise learning, effort, and growth over scores.

## Student Tone
Frame advice like a study companion: encouraging, specific, and action-oriented.
Never shame performance. Keep language simple and motivating.

## Student Suggestions Content Guardrail
Follow-up suggestions must stay student-appropriate and learning-focused.
Never suggest teacher-only actions such as creating assignments, grading work, or editing class settings.`;

const parentRoleOverlay = `
## Parent Role Constraints
You are Elora Copilot for parents/guardians. You can help interpret your child's visible progress, attendance, and assignments, and draft respectful messages to teachers.

- Never reveal grades or information that is not visible on the parent dashboard.
- If asked about unreleased assessments or hidden details, state that you cannot see that information and recommend contacting the teacher.
- Work only with visible information: released grades, high-level trends, attendance (if available), and visible due/overdue assignments.
- Never instruct what a teacher "should" do. Instead, suggest respectful, collaborative ways to partner with the teacher.

## Parent Tone
Keep tone reassuring, calm, and partnership-focused.
Use language like "we can work with the teacher" when giving next steps.

## Parent Suggestions Content Guardrail
Follow-up suggestions must remain parent-appropriate.
Never suggest teacher-only operations such as creating assignments or grading quizzes.`;

export const getSystemPrompt = (role: CopilotRole): string => {
  if (role === 'teacher') {
    return teacherSystemPromptBase;
  }

  if (role === 'student') {
    return `${teacherSystemPromptBase}\n\n${studentRoleOverlay}`;
  }

  if (role === 'parent') {
    return `${teacherSystemPromptBase}\n\n${parentRoleOverlay}`;
  }

  return teacherSystemPromptBase;
};

export const askEloraHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    prompt,
    context,
    isFirstMessage,
    recentUserPrompts,
    lastSelectedClassId,
    lastSelectedStudentId,
    conversationId,
  } = req.body ?? {};
  const authUser = req.user;
  if (!authUser) {
    res.status(401).json({ error: 'Authentication required.', code: 'AUTH_REQUIRED' });
    return;
  }

  const userRole = authUser.role as CopilotRole;
  const normalizedRecentPrompts = normalizeRecentPrompts(recentUserPrompts);
  const requestIsFirstTurn = Boolean(isFirstMessage) || (!conversationId && normalizedRecentPrompts.length === 0);

  try {
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'A valid "prompt" string is required in the request body.' });
      return;
    }
    
    const contextText = typeof context === 'string' ? truncateForPrompt(context, 900) : '';
    
    // ── Real AI Call ────────────────────────────────────────────────────────
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      res.json({ text: buildRoleFallbackText(userRole, requestIsFirstTurn) });
      return;
    }

    const model = 'llama-3.3-70b-versatile';
    const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

    const baseSystemPrompt = getSystemPrompt(userRole);
    const promptSegments: string[] = [baseSystemPrompt];

    if (contextText) {
      promptSegments.push(`Context snapshot (use this to personalize the response, do not quote verbatim): ${contextText}`);
    }

    if (normalizedRecentPrompts.length > 0) {
      promptSegments.push(`Recent user intents in this conversation: [${normalizedRecentPrompts.join('; ')}]. Keep continuity when helpful.`);
    }

    if (typeof lastSelectedClassId === 'string' && lastSelectedClassId.trim()) {
      promptSegments.push(`Last selected class context id: ${truncateForPrompt(lastSelectedClassId, 60)}.`);
    }

    if (typeof lastSelectedStudentId === 'string' && lastSelectedStudentId.trim()) {
      promptSegments.push(`Last selected student context id: ${truncateForPrompt(lastSelectedStudentId, 60)}.`);
    }

    if (requestIsFirstTurn) {
      promptSegments.push(buildSessionPrimerInstruction(userRole));
    }

    const finalSystemPrompt = promptSegments.join('\n\n');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: finalSystemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: userRole === 'teacher' ? 700 : 512,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Groq API Error details:", JSON.stringify(errorData, null, 2));
      
      // Role-specific fallback for errors
      let errorFallback = "I’m having a bit of trouble connecting right now. While I find my way back, feel free to check your main dashboard insights.";
      if (userRole === 'teacher') {
        errorFallback = "I’m having trouble connecting to Elora’s brain right now. Can you try again in a moment? If this keeps happening, it might be a network issue on our side.";
      } else if (userRole === 'student') {
        errorFallback = "I’m having a little trouble thinking right now. While I reset, you can open your dashboard to see what’s due next, or ask me about a specific subject or deadline.";
      } else if (userRole === 'parent') {
        errorFallback = "I’m having some trouble connecting at the moment. You can still see a quick overview in your parent dashboard, or ask me a simpler question about Jordan’s progress.";
      }
      
      res.json({ text: errorFallback });
      return;
    }

    const data = await response.json();
    let finalOutput = data.choices?.[0]?.message?.content || "";

    // ── Fallback for empty/invalid responses ──────────────────────────────────
    if (!finalOutput || finalOutput.trim().length === 0) {
      if (userRole === 'teacher') {
        finalOutput = "I’m having trouble connecting to Elora’s brain right now. Can you try again in a moment? If this keeps happening, it might be a network issue on our side.";
      } else if (userRole === 'student') {
        finalOutput = "I’m having a little trouble thinking right now. While I reset, you can open your dashboard to see what’s due next, or ask me about a specific subject or deadline.";
      } else if (userRole === 'parent') {
        finalOutput = "I’m having some trouble connecting at the moment. You can still see a quick overview in your parent dashboard, or ask me a simpler question about Jordan’s progress.";
      } else {
        finalOutput = "I’m having a bit of trouble connecting right now. I'll be back shortly!";
      }
    }

    const outputCharLimit = userRole === 'teacher' ? 1400 : 800;
    if (finalOutput.length > outputCharLimit) {
      finalOutput = finalOutput.substring(0, outputCharLimit) + '...';
    }
    
    res.json({ text: finalOutput });
  } catch (error) {
    console.error('Error in askEloraHandler:', error);
    res.json({ text: buildRoleFallbackText(userRole, requestIsFirstTurn) });
  }
};
