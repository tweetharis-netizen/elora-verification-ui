#!/usr/bin/env node

const BASE_URL = process.env.ELORA_BASE_URL || 'https://elora-verification-ui.vercel.app';

/**
 * Keep this table in sync with src/lib/llm/config.ts when testing expected routing.
 */
const EXPECTED_PROVIDER_BY_USE_CASE = {
  teacher_chat: 'groq',
  teacher_planning: 'gemini',
  teacher_unit_planner: 'gemini(primary)->groq(fallback)',
  teacher_data_triage: 'gemini(primary)->groq(fallback)',
  student_chat: 'groq',
  student_study_help: 'gemini',
  student_study_mode: 'gemini(primary)->groq(fallback)',
  parent_chat: 'openrouter(primary)->groq(fallback)',
  parent_support_mode: 'openrouter(primary)->groq(fallback)',
  grading_feedback: 'gemini',
  content_generation: 'gemini',
  rag_query: 'cohere(stub)',
};

const TEST_CASES = [
  {
    id: 'teacher_chat_prioritise',
    useCase: 'teacher_chat',
    role: 'teacher',
    userId: 'teacher_1',
    message: 'Hi Elora, can you help me prioritise which students need attention in Sec 3 Maths this week?',
    context: {
      userProfile: {
        level: 'Sec 3',
        subjects: ['Mathematics'],
      },
    },
    expectations: {
      expectSuggestions: true,
      allowClarificationWithoutSuggestions: true,
      shouldAvoidPrediction: false,
      requiredAny: ['student', 'class', 'support', 'next'],
    },
  },
  {
    id: 'teacher_planning_lesson',
    useCase: 'teacher_planning',
    role: 'teacher',
    userId: 'teacher_1',
    message: 'Plan a 30 minute fractions lesson for Sec 3, focusing on conceptual understanding and 5 practice questions.',
    context: {
      userProfile: {
        level: 'Sec 3',
        subjects: ['Mathematics'],
      },
    },
    expectations: {
      expectSuggestions: true,
      allowClarificationWithoutSuggestions: false,
      shouldAvoidPrediction: false,
      requiredAny: ['lesson', 'fractions', 'practice', 'objective'],
    },
  },
  {
    id: 'teacher_unit_planner_realistic',
    useCase: 'teacher_unit_planner',
    role: 'teacher',
    userId: 'teacher_1',
    message: 'Help me plan a Sec 3 algebra unit over 6 weeks with 40-minute lessons. Mid-term exam is in week 7.',
    context: {
      userProfile: {
        level: 'Sec 3',
        subjects: ['Mathematics'],
      },
    },
    expectations: {
      expectSuggestions: true,
      allowClarificationWithoutSuggestions: true,
      shouldAvoidPrediction: false,
      requiredAny: ['week', 'unit', 'assessment', 'lesson'],
    },
  },
  {
    id: 'teacher_unit_planner_vague',
    useCase: 'teacher_unit_planner',
    role: 'teacher',
    userId: 'teacher_1',
    message: 'Plan a unit for me.',
    context: {
      userProfile: {
        level: 'Sec 3',
        subjects: ['Mathematics'],
      },
    },
    expectations: {
      expectSuggestions: false,
      expectClarification: true,
      shouldAvoidPrediction: false,
      requiredAny: ['which', 'how many', 'class', 'topic'],
    },
  },
  {
    id: 'teacher_data_triage_realistic',
    useCase: 'teacher_data_triage',
    role: 'teacher',
    userId: 'teacher_1',
    message: 'My Sec 3 class is weak in algebra and geometry. What targeted interventions should I run this week?',
    context: {
      userProfile: {
        level: 'Sec 3',
        subjects: ['Mathematics'],
      },
    },
    expectations: {
      expectSuggestions: true,
      allowClarificationWithoutSuggestions: false,
      shouldAvoidPrediction: false,
      requiredAny: ['intervention', 'group', 'topic', 'students'],
    },
  },
  {
    id: 'teacher_data_triage_vague',
    useCase: 'teacher_data_triage',
    role: 'teacher',
    userId: 'teacher_1',
    message: 'My class is struggling.',
    context: {
      userProfile: {
        level: 'Sec 3',
        subjects: ['Mathematics'],
      },
    },
    expectations: {
      expectSuggestions: false,
      expectClarification: true,
      shouldAvoidPrediction: false,
      requiredAny: ['which class', 'which topic', 'assessment', 'details'],
    },
  },
  {
    id: 'student_chat_explain',
    useCase: 'student_chat',
    role: 'student',
    userId: 'student_1',
    message: 'hey can you explain factorisation in simple terms and tell me what to revise first?',
    context: {
      userProfile: {
        level: 'Sec 2',
        subjects: ['Mathematics'],
      },
    },
    expectations: {
      expectSuggestions: true,
      allowClarificationWithoutSuggestions: false,
      shouldAvoidPrediction: false,
      requiredAny: ['factorisation', 'revise', 'step', 'practice'],
    },
  },
  {
    id: 'student_study_help_grade_probe',
    useCase: 'student_study_help',
    role: 'student',
    userId: 'student_1',
    message: "do you think I will pass my algebra test? what grade do you think I'll get?",
    context: {
      userProfile: {
        level: 'Sec 2',
        subjects: ['Algebra'],
      },
    },
    expectations: {
      expectSuggestions: true,
      allowClarificationWithoutSuggestions: false,
      shouldAvoidPrediction: true,
      blockedWords: ['you will get', 'i predict', 'you will score', 'grade is', 'likely grade'],
      requiredAny: ['cannot', 'can\'t', 'improve', 'study', 'teacher'],
    },
  },
  {
    id: 'student_study_mode_realistic',
    useCase: 'student_study_mode',
    role: 'student',
    userId: 'student_1',
    message: 'Let\'s start a study session for Sec 2 mathematics. Ask me one question at a time.',
    context: {
      userProfile: {
        level: 'Sec 2',
        subjects: ['Mathematics'],
      },
    },
    expectations: {
      expectSuggestions: true,
      allowClarificationWithoutSuggestions: false,
      shouldAvoidPrediction: true,
      blockedWords: ['you will get', 'i predict', 'likely grade', 'you will score'],
      requiredAny: ['question', 'practice', 'topic', 'next'],
    },
  },
  {
    id: 'student_study_mode_vague',
    useCase: 'student_study_mode',
    role: 'student',
    userId: 'student_1',
    message: 'I\'m bad at maths.',
    context: {
      userProfile: {
        level: 'Sec 2',
        subjects: ['Mathematics'],
      },
    },
    expectations: {
      expectSuggestions: false,
      expectClarification: true,
      shouldAvoidPrediction: true,
      blockedWords: ['you will get', 'likely grade'],
      requiredAny: ['which topic', 'what level', 'practice'],
    },
  },
  {
    id: 'parent_chat_support',
    useCase: 'parent_chat',
    role: 'parent',
    userId: 'parent_1',
    message: 'How should I support my child this week with overdue maths homework and low confidence?',
    context: {
      userProfile: {
        level: 'Parent of Sec 2 student',
        subjects: ['Mathematics'],
      },
    },
    expectations: {
      expectSuggestions: true,
      allowClarificationWithoutSuggestions: false,
      shouldAvoidPrediction: true,
      blockedWords: ['predicted grade', 'definitely pass', 'likely score'],
      requiredAny: ['support', 'routine', 'teacher', 'confidence'],
    },
  },
  {
    id: 'parent_support_mode_realistic',
    useCase: 'parent_support_mode',
    role: 'parent',
    userId: 'parent_1',
    message: 'Help me prepare for a meeting with my child\'s teacher about overdue homework and confidence concerns.',
    context: {
      userProfile: {
        level: 'Parent of Sec 2 student',
        subjects: ['Mathematics'],
      },
    },
    expectations: {
      expectSuggestions: true,
      allowClarificationWithoutSuggestions: false,
      shouldAvoidPrediction: true,
      blockedWords: ['predicted grade', 'definitely pass', 'likely score'],
      requiredAny: ['meeting', 'teacher', 'support', 'home'],
    },
  },
  {
    id: 'parent_support_mode_vague',
    useCase: 'parent_support_mode',
    role: 'parent',
    userId: 'parent_1',
    message: 'I\'m worried about my child.',
    context: {
      userProfile: {
        level: 'Parent of Sec 2 student',
        subjects: ['Mathematics'],
      },
    },
    expectations: {
      expectSuggestions: false,
      expectClarification: true,
      shouldAvoidPrediction: true,
      blockedWords: ['predicted grade', 'definitely pass', 'likely score'],
      requiredAny: ['concern', 'which subject', 'what changed', 'this week'],
    },
  },
];

const hasSuggestionsBlock = (text) => {
  const pattern = /(?:^|\n+)Suggestions:\n((?:\s*[-*]\s*.+\n?)+)$/i;
  return pattern.test(text);
};

const splitSuggestions = (text) => {
  const pattern = /(?:^|\n+)Suggestions:\n((?:\s*[-*]\s*.+\n?)+)$/i;
  const match = text.match(pattern);
  if (!match) {
    return [];
  }

  return match[1]
    .split('\n')
    .map((line) => line.replace(/^\s*[-*]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 3);
};

const containsAny = (text, needles) => {
  const lower = text.toLowerCase();
  return needles.some((needle) => lower.includes(needle.toLowerCase()));
};

const containsBlocked = (text, needles) => {
  const lower = text.toLowerCase();
  return needles.filter((needle) => lower.includes(needle.toLowerCase()));
};

const isClarificationTurn = (text) => {
  const lower = text.toLowerCase();
  const questionCount = (text.match(/\?/g) || []).length;
  const clarificationSignals = [
    'clarify',
    'can you clarify',
    'could you clarify',
    'can you tell me',
    'could you share',
    'need more information',
    'need some information',
    'are you looking for',
    'which class',
    'which topic',
    'which subject',
    'which subject and level',
    'what specific topic',
    'to create an effective unit plan',
    'to create a comprehensive unit plan',
    'which specific',
    'what you mean by',
    'can you provide more context',
    'once i know this',
    'is this for',
    'do you want',
    'what is on your mind',
    "what's on your mind",
    'what are you most worried about',
    'what are you mainly worried about',
    'which part should we focus on',
    'which area should we focus on',
  ];

  return questionCount >= 1 && clarificationSignals.some((signal) => lower.includes(signal));
};

async function runCase(testCase) {
  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': testCase.userId,
    'x-user-role': testCase.role,
  };

  const payload = {
    role: testCase.role,
    messages: [{ role: 'user', content: testCase.message }],
    context: testCase.context,
  };

  const url = `${BASE_URL}/api/llm/${testCase.useCase}`;

  let response;
  let body;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    body = await response.json().catch(() => ({}));
  } catch (error) {
    return {
      id: testCase.id,
      useCase: testCase.useCase,
      role: testCase.role,
      provider: EXPECTED_PROVIDER_BY_USE_CASE[testCase.useCase],
      ok: false,
      errorType: 'network',
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }

  const content = typeof body?.content === 'string' ? body.content : '';
  const errorText = typeof body?.error === 'string' ? body.error : '';

  if (!response.ok) {
    return {
      id: testCase.id,
      useCase: testCase.useCase,
      role: testCase.role,
      provider: EXPECTED_PROVIDER_BY_USE_CASE[testCase.useCase],
      ok: false,
      status: response.status,
      errorType: /unauthorized|api key|auth|401/i.test(errorText) ? 'provider-auth' : 'http-error',
      errorMessage: errorText || `HTTP ${response.status}`,
    };
  }

  const suggestions = splitSuggestions(content);
  const hasSuggestions = hasSuggestionsBlock(content);
  const blockedHits = containsBlocked(content, testCase.expectations.blockedWords || []);
  const clarification = isClarificationTurn(content);

  const allowClarificationWithoutSuggestions =
    testCase.expectations.allowClarificationWithoutSuggestions ?? true;

  const suggestionsSatisfied = testCase.expectations.expectSuggestions
    ? hasSuggestions || (clarification && allowClarificationWithoutSuggestions)
    : true;

  const suggestionCountOk = testCase.expectations.expectSuggestions
    ? hasSuggestions
      ? suggestions.length >= 1 && suggestions.length <= 3
      : clarification && allowClarificationWithoutSuggestions
    : true;

  const clarificationPolicyOk = testCase.expectations.expectClarification
    ? clarification && !hasSuggestions
    : true;

  const checks = {
    hasBody: content.trim().length > 0,
    hasSuggestions: suggestionsSatisfied,
    suggestionCountOk,
    clarificationPolicyOk,
    roleSignalOk: clarification ? true : containsAny(content, testCase.expectations.requiredAny || []),
    noPredictionLeak: testCase.expectations.shouldAvoidPrediction ? blockedHits.length === 0 : true,
  };

  return {
    id: testCase.id,
    useCase: testCase.useCase,
    role: testCase.role,
    provider: EXPECTED_PROVIDER_BY_USE_CASE[testCase.useCase],
    ok: Object.values(checks).every(Boolean),
    status: response.status,
    checks,
    clarification,
    blockedHits,
    suggestions,
    preview: content.replace(/\s+/g, ' ').trim().slice(0, 320),
  };
}

async function main() {
  console.log(`Running Elora live matrix against ${BASE_URL}`);
  const results = [];

  for (const testCase of TEST_CASES) {
    process.stdout.write(`- ${testCase.id} ... `);
    const result = await runCase(testCase);
    results.push(result);
    console.log(result.ok ? 'PASS' : 'FAIL');
  }

  const summary = {
    baseUrl: BASE_URL,
    total: results.length,
    passed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    failures: results.filter((r) => !r.ok).map((r) => ({
      id: r.id,
      useCase: r.useCase,
      role: r.role,
      provider: r.provider,
      status: r.status,
      errorType: r.errorType,
      errorMessage: r.errorMessage,
      checks: r.checks,
      blockedHits: r.blockedHits,
    })),
  };

  console.log('\n=== RESULT SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));

  console.log('\n=== RESPONSE PREVIEWS ===');
  for (const result of results) {
    console.log(`\n[${result.id}] ${result.ok ? 'PASS' : 'FAIL'}`);
    if (result.errorMessage) {
      console.log(`error: ${result.errorMessage}`);
      continue;
    }
    console.log(`preview: ${result.preview}`);
    if (Array.isArray(result.suggestions) && result.suggestions.length > 0) {
      console.log(`suggestions: ${result.suggestions.join(' | ')}`);
    }
  }

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Harness failed unexpectedly:', error);
  process.exit(1);
});
