import type { Response } from 'express';
import { isUseCase } from '../../src/lib/llm/config.js';
import { llmRouter, LLMTemporarilyUnavailableError } from '../../src/lib/llm/router.js';
import type { LLMMessage, UseCase, UserRole } from '../../src/lib/llm/types.js';
import type { AuthRequest } from '../middleware/auth.js';

const USER_ROLES: UserRole[] = ['teacher', 'student', 'parent'];

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isUserRole = (value: unknown): value is UserRole => {
  return typeof value === 'string' && USER_ROLES.includes(value as UserRole);
};

const isLLMMessage = (value: unknown): value is LLMMessage => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.role === 'system' || value.role === 'user' || value.role === 'assistant') &&
    typeof value.content === 'string'
  );
};

const isLLMMessageArray = (value: unknown): value is LLMMessage[] => {
  return Array.isArray(value) && value.every((entry) => isLLMMessage(entry));
};

const normalizeContext = (value: unknown): Record<string, unknown> | undefined => {
  return isRecord(value) ? value : undefined;
};

const USE_CASE_SUGGESTIONS: Record<UseCase, string[]> = {
  teacher_chat: [
    'Show me who needs attention this week.',
    'Turn this into a short classroom action list.',
    'Draft a parent update for priority students.',
  ],
  teacher_planning: [
    'Turn this into a detailed 30-minute lesson.',
    'Add differentiation for mixed-ability learners.',
    'Draft a quick exit ticket for this lesson.',
  ],
  teacher_unit_planner: [
    'Turn week 1 into detailed lessons.',
    'Draft a quiz for topic X.',
    'Add checkpoint assessments by week.',
  ],
  teacher_data_triage: [
    'Turn this into a small-group plan.',
    'Draft parent messages for struggling students.',
    'Prioritise interventions for next week.',
  ],
  student_chat: [
    'Give me one practice question now.',
    'Summarise this topic in 3 points.',
    'Help me plan what to revise next.',
  ],
  student_study_help: [
    'Give me one easier practice question first.',
    'Now ask me a harder follow-up question.',
    'Summarise what I should revise tonight.',
  ],
  student_study_mode: [
    'Ask me a harder question.',
    'Give me a mixed mini-quiz.',
    'Summarise what I have learned so far.',
  ],
  parent_chat: [
    'Draft a message to the teacher about this.',
    'Suggest questions for the next meeting.',
    'Outline a 1-week support plan at home.',
  ],
  parent_support_mode: [
    'Draft a message to the teacher about this.',
    'Suggest questions for the next meeting.',
    'Outline a 1-week support plan at home.',
  ],
  grading_feedback: [
    'Rewrite this feedback for a gentler tone.',
    'Convert this into rubric-aligned bullets.',
    'Add one actionable next step for the student.',
  ],
  content_generation: [
    'Adapt this for a shorter lesson.',
    'Create a higher-difficulty version.',
    'Add a quick assessment section.',
  ],
  rag_query: [
    'Show the evidence used for this answer.',
    'Summarise the key facts in simple terms.',
    'List what additional data would improve confidence.',
  ],
};

const extractLastUserMessage = (messages: LLMMessage[]): string => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role === 'user' && message.content.trim().length > 0) {
      return message.content.trim();
    }
  }

  return '';
};

const isLikelyVaguePrompt = ({
  useCase,
  userMessage,
}: {
  useCase: UseCase;
  userMessage: string;
}): boolean => {
  const lower = userMessage.toLowerCase();
  const compactLength = lower.replace(/\s+/g, ' ').trim().length;

  if (compactLength === 0) {
    return true;
  }

  if (useCase === 'teacher_unit_planner') {
    return compactLength < 80 || /plan a unit for me|help me plan a unit/.test(lower);
  }

  if (useCase === 'teacher_data_triage') {
    return compactLength < 60 || /class is struggling|students are weak/.test(lower);
  }

  if (useCase === 'student_study_mode') {
    return compactLength < 70 || /bad at math|bad at maths|need help with math/.test(lower);
  }

  if (useCase === 'parent_support_mode') {
    return compactLength < 75 || /worried about my child|need help as a parent/.test(lower);
  }

  return false;
};

const buildClarificationFallback = (useCase: UseCase): string => {
  if (useCase === 'teacher_unit_planner') {
    return 'To plan your unit well, could you share the subject/topic, number of weeks, exam date, and typical lesson length?';
  }

  if (useCase === 'teacher_data_triage') {
    return 'Could you share which class and topic are most affected, plus what signals you are seeing (low quiz scores, missing work, or confidence drops)?';
  }

  if (useCase === 'student_study_mode') {
    return 'I can run a study session. Which topic do you want to practise first, and what level are you at?';
  }

  if (useCase === 'parent_support_mode') {
    return 'I can help you prepare. What is your main concern right now, and what outcome do you want from the meeting?';
  }

  return 'Could you share a bit more detail so I can tailor this for your context?';
};

const buildDegradedModeContent = ({
  useCase,
  role,
  userMessage,
}: {
  useCase: UseCase;
  role: UserRole;
  userMessage: string;
}): string => {
  if (isLikelyVaguePrompt({ useCase, userMessage })) {
    return buildClarificationFallback(useCase);
  }

  const baseByUseCase: Partial<Record<UseCase, string>> = {
    teacher_chat: 'Quick teacher triage: identify the students with missing work, low recent performance, and low participation, then plan targeted follow-up for each group.',
    teacher_planning: 'Starter lesson frame: define one clear objective, add a 5-minute diagnostic check, run guided practice, then close with a short exit ticket.',
    teacher_unit_planner: 'Starter unit outline: set weekly goals, map lesson themes per week, and place assessment checkpoints to track progress toward the exam.',
    teacher_data_triage: 'Targeted intervention plan: group learners by topic gap and confidence level, assign focused practice, and monitor outcomes with a short weekly checkpoint.',
    student_chat: 'Simple study step: focus on one concept at a time, learn the method, then do a short practice set and review mistakes.',
    student_study_help: 'I cannot predict grades, but I can help you improve. Start with your weakest topic, do 2-3 guided questions, then review errors and retry.',
    student_study_mode: 'Great, let us start practice. First question: for the topic you selected, explain the core rule in one sentence, then I will check it and raise or lower difficulty.',
    parent_chat: 'Parent support plan: set a calm homework routine, check in on confidence daily, and partner with the teacher using clear and respectful updates.',
    parent_support_mode: 'Meeting coach plan: prepare your key concerns, share concrete examples, and agree with the teacher on one short support plan for this week.',
  };

  const defaultBase =
    role === 'teacher'
      ? 'I can help you move forward with a practical classroom action plan right now.'
      : role === 'student'
      ? 'I can help you study with clear, step-by-step support.'
      : 'I can help you support your child with practical next steps and respectful communication.';

  const baseText = baseByUseCase[useCase] ?? defaultBase;
  const suggestions = USE_CASE_SUGGESTIONS[useCase] ?? USE_CASE_SUGGESTIONS.parent_chat;

  return [
    `${baseText} (Running in backup guidance mode.)`,
    '',
    'Suggestions:',
    ...suggestions.slice(0, 3).map((entry) => `- ${entry}`),
  ].join('\n');
};

export const postUseCaseLLMHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const rawUseCase = req.params.useCase;
  if (!isUseCase(rawUseCase)) {
    res.status(400).json({ error: 'Invalid useCase path parameter.' });
    return;
  }

  const { role, messages, userId, context } = req.body ?? {};

  if (!isUserRole(role)) {
    res.status(400).json({ error: 'Field "role" must be one of teacher, student, parent.' });
    return;
  }

  if (!isLLMMessageArray(messages)) {
    res.status(400).json({ error: 'Field "messages" must be an array of { role, content }.' });
    return;
  }

  const authRole = req.user?.role;
  if (authRole && role !== authRole) {
    res.status(403).json({ error: 'Role mismatch for authenticated request.' });
    return;
  }

  const resolvedUserId = typeof userId === 'string' && userId.trim().length > 0
    ? userId.trim()
    : req.user?.id;

  try {
    const result = await llmRouter({
      role,
      useCase: rawUseCase as UseCase,
      messages,
      userId: resolvedUserId,
      context: normalizeContext(context),
    });

    res.status(200).json({ content: result.content });
  } catch (error) {
    if (error instanceof LLMTemporarilyUnavailableError) {
      console.error('[llm-route] provider temporarily unavailable', {
        useCase: rawUseCase,
        role,
        userId: resolvedUserId ?? null,
        details: error.details,
      });

      const fallbackContent = buildDegradedModeContent({
        useCase: rawUseCase as UseCase,
        role,
        userMessage: extractLastUserMessage(messages),
      });

      res.status(200).json({ content: fallbackContent });
      return;
    }

    console.error('[llm-route] request failed', {
      useCase: rawUseCase,
      role,
      userId: resolvedUserId ?? null,
      error,
    });

    res.status(500).json({ error: 'Elora Copilot is temporarily unavailable.' });
  }
};
