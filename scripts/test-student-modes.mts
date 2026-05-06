#!/usr/bin/env node
import assert from 'node:assert/strict';
import { buildSystemPrompt } from '../src/lib/llm/prompt';
import { detectStudentMode } from '../src/services/askElora';

console.log('🧪 Student mode detection tests');

const studentPrompt = buildSystemPrompt({ role: 'student', useCase: 'student_chat' as any });
assert.match(studentPrompt, /Quick Check/i, 'Student prompt should include Quick Check');
assert.match(studentPrompt, /Let\'?s break it down/i, 'Student prompt should include Lets break it down');
assert.match(studentPrompt, /Your turn/i, 'Student prompt should include Your turn');
assert.match(studentPrompt, /exploratory/i, 'Student prompt should mention exploratory mode');
assert.match(studentPrompt, /details/i, 'Student prompt should mention details mode');
assert.match(studentPrompt, /Dig-Deeper/i, 'Student prompt should mention Dig-Deeper mode');
assert.match(studentPrompt, /Wrap-Up/i, 'Student prompt should mention Wrap-Up mode');
assert.match(studentPrompt, /Firmness/i, 'Student prompt should mention Firmness mode');

for (const mode of ['exploratory', 'details', 'dig_deeper', 'wrap_up', 'firmness'] as const) {
  const modePrompt = buildSystemPrompt({
    role: 'student',
    useCase: 'student_chat' as any,
    context: {
      copilotContextSummary: {
        studentQuestionMode: mode,
        sourceSnippets: [{ id: 'src-1', label: 'worksheet.pdf', type: 'file' }],
      },
    } as any,
  });

  assert.match(modePrompt, new RegExp(`Student mode hint: This turn is in '${mode}' mode`, 'i'), `Student prompt should include the ${mode} mode hint`);
}

const tests: Array<{msg?: string; recent?: string[]; first?: boolean; expected: string}> = [
  { msg: 'Hi, can you help me?', first: true, expected: 'exploratory' },
  { msg: "I'm stuck", recent: [], first: false, expected: 'details' },
  { msg: 'I think the answer is 42 because I added the values and...', recent: [], first: false, expected: 'dig_deeper' },
  { msg: 'Thanks, that helps, I get it now', recent: [], first: false, expected: 'wrap_up' },
  { msg: 'Just tell me the answer', recent: [], first: false, expected: 'firmness' },
];

for (const t of tests) {
  const got = detectStudentMode({ message: t.msg, recentUserPrompts: t.recent, isFirstMessage: !!t.first, role: 'student' });
  assert.equal(got, t.expected, `Expected ${t.expected} for ${t.msg}`);
  console.log(`Test: "${t.msg}" -> expected=${t.expected} got=${got} => PASS`);
}

console.log('✅ Student mode detection tests passed');
