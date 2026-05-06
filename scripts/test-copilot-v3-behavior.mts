#!/usr/bin/env node
import assert from 'node:assert/strict';
import { buildSystemPrompt, buildContextHintLines } from '../src/lib/llm/prompt';

console.log('🧪 Copilot v3 prompt behavior tests');

const roleCases: Array<{ role: 'student' | 'teacher' | 'parent'; useCase: 'student_chat' | 'teacher_chat' | 'parent_support_mode' }> = [
  { role: 'student', useCase: 'student_chat' },
  { role: 'teacher', useCase: 'teacher_chat' },
  { role: 'parent', useCase: 'parent_support_mode' },
];

for (const { role, useCase } of roleCases) {
  const prompt = buildSystemPrompt({ role, useCase } as any);
  console.log(`\n--- Role: ${role} ---`);

  assert.match(prompt, /Be honest about limits/i, 'Global honesty should be present');
  assert.match(prompt, /Reply Structure Guidelines/i, 'Structure guidelines should be present');

  if (role === 'student') {
    assert.match(prompt, /Quick Check/i, 'Student prompt should include Quick Check');
    assert.match(prompt, /Let\'?s break it down/i, 'Student prompt should include Lets break it down');
    assert.match(prompt, /Your turn/i, 'Student prompt should include Your turn');
    assert.match(prompt, /exploratory/i, 'Student prompt should reference exploratory mode');
    assert.match(prompt, /details/i, 'Student prompt should reference details mode');
    assert.match(prompt, /Dig-Deeper/i, 'Student prompt should reference Dig-Deeper mode');
    assert.match(prompt, /Wrap-Up/i, 'Student prompt should reference Wrap-Up mode');
    assert.match(prompt, /Firmness/i, 'Student prompt should reference Firmness mode');
    assert.match(prompt, /homework/i, 'Student prompt should include homework guardrail');
  }

  if (role === 'teacher') {
    assert.match(prompt, /Objectives/i, 'Teacher prompt should include Objectives heading');
    assert.match(prompt, /Warm-?up/i, 'Teacher prompt should include Warm-up heading');
    assert.match(prompt, /Main Activity/i, 'Teacher prompt should include Main Activity heading');
    assert.match(prompt, /Differentiation/i, 'Teacher prompt should include Differentiation heading');
    assert.match(prompt, /Assessment/i, 'Teacher prompt should include Assessment heading');
    assert.ok(
      /Below\s*\/\s*On\s*\/\s*Above/i.test(prompt) || /Below level/i.test(prompt) || /On level/i.test(prompt) || /Above level/i.test(prompt),
      'Teacher prompt should include 3-tier differentiation language'
    );
    assert.match(prompt, /exit ticket/i, 'Teacher prompt should include exit ticket guidance');
  }

  if (role === 'parent') {
    assert.match(prompt, /Big picture/i, 'Parent prompt should include Big picture section');
    assert.match(prompt, /Strengths/i, 'Parent prompt should include Strengths section');
    assert.match(prompt, /Things to work on/i, 'Parent prompt should include Things to work on section');
    assert.match(prompt, /How you can help at home/i, 'Parent prompt should include home help section');
    assert.match(prompt, /time-bound/i, 'Parent prompt should include time-bound home action guidance');
    assert.match(prompt, /low-friction/i, 'Parent prompt should include low-friction home action guidance');
    assert.ok(/Jargon translation/i.test(prompt) || /Translate jargon/i.test(prompt), 'Parent prompt should include jargon translation guidance');
  }
}

console.log('\n✅ Copilot v3 prompt behavior tests passed');

// --- Greeting and Capability Query Context Hints Tests ---
console.log('\n🧪 Greeting and capability query context hints tests');

for (const { role } of roleCases) {
  console.log(`\n--- Greeting context for ${role} ---`);
  const greetingHints = buildContextHintLines({ role, context: { isGreeting: true, userName: 'Alex' } });
  const greetingHintsText = greetingHints.join('\n');
  
  assert.ok(greetingHints.length > 0, `Should have greeting hints for ${role}`);
  assert.match(greetingHintsText, /Greeting hint/i, `Greeting hint label should be present for ${role}`);
  assert.match(greetingHintsText, /Alex/i, `User name should be included in greeting for ${role}`);
  
  if (role === 'student') {
    assert.match(greetingHintsText, /Explain a tricky concept|Quiz me|Build a revision plan/i, 'Student greeting should suggest learning actions');
  } else if (role === 'teacher') {
    assert.match(greetingHintsText, /Differentiate|Analyze class data|Draft parent/i, 'Teacher greeting should suggest teacher actions');
  } else if (role === 'parent') {
    assert.match(greetingHintsText, /Simplify|home support|Translate/i, 'Parent greeting should suggest parent actions');
  }
}

for (const { role } of roleCases) {
  console.log(`\n--- Capability query context for ${role} ---`);
  const capabilityHints = buildContextHintLines({ role, context: { isCapabilityQuery: true } });
  const capabilityHintsText = capabilityHints.join('\n');
  
  assert.ok(capabilityHints.length > 0, `Should have capability hints for ${role}`);
  assert.match(capabilityHintsText, /capability-query hint/i, `Capability query hint label should be present for ${role}`);
  assert.match(capabilityHintsText, /2.*4 sentence/i, `Capability tour should mention 2-4 sentence format for ${role}`);
  assert.match(capabilityHintsText, /example asks/i, `Capability tour should mention example asks for ${role}`);
  assert.match(capabilityHintsText, /What are you working on today/i, `Capability tour should include a follow-up prompt for ${role}`);
  
  if (role === 'student') {
    assert.match(capabilityHintsText, /Study.*Learning/i, 'Student capability should mention Study & Learning');
  } else if (role === 'teacher') {
    assert.match(capabilityHintsText, /Planning/i, 'Teacher capability should mention Planning');
  } else if (role === 'parent') {
    assert.match(capabilityHintsText, /Progress/i, 'Parent capability should mention Progress');
  }
}

console.log('\n✅ Greeting and capability query context hints tests passed');

// --- Generic Help Context Hints Tests ---
console.log('\n🧪 Generic-help context hints tests');
for (const { role } of roleCases) {
  console.log(`\n--- Generic-help context for ${role} ---`);
  const helpHints = buildContextHintLines({ role, context: { isGenericHelp: true, userName: 'Alex' } });
  const helpHintsText = helpHints.join('\n');

  assert.ok(helpHints.length > 0, `Should have generic-help hints for ${role}`);
  assert.match(helpHintsText, /Generic-help hint/i, `Generic-help hint label should be present for ${role}`);
  assert.match(helpHintsText, /Ask 1–2 short clarifying questions|Ask 1-2 short clarifying questions/i, `Generic-help guidance should recommend clarifying questions for ${role}`);
}

console.log('\n✅ Generic-help context hints tests passed');

// --- Intent Flag Context Hints Tests ---
console.log('\n🧪 Intent flag context hints tests');

const studentStudyHints = buildContextHintLines({ role: 'student', context: { isStudyPlanning: true } }).join('\n');
assert.match(studentStudyHints, /Study-planning hint/i, 'Student study planning hint should be present');
assert.match(studentStudyHints, /spaced repetition|retrieval practice/i, 'Student study plan should mention spaced repetition or retrieval practice');

const teacherStudyHints = buildContextHintLines({ role: 'teacher', context: { isStudyPlanning: true } }).join('\n');
assert.match(teacherStudyHints, /Study-planning hint/i, 'Teacher study planning hint should be present');
assert.match(teacherStudyHints, /objectives|assessments/i, 'Teacher study plan should mention objectives or assessments');

const studentQuizHints = buildContextHintLines({ role: 'student', context: { isQuizGeneration: true } }).join('\n');
assert.match(studentQuizHints, /Quiz-generation hint/i, 'Student quiz generation hint should be present');
assert.match(studentQuizHints, /rising difficulty/i, 'Student quiz generation should mention rising difficulty');

const teacherQuizHints = buildContextHintLines({ role: 'teacher', context: { isQuizGeneration: true } }).join('\n');
assert.match(teacherQuizHints, /Quiz-generation hint/i, 'Teacher quiz generation hint should be present');
assert.match(teacherQuizHints, /answer key/i, 'Teacher quiz generation should mention answer key');

const studentAttemptHints = buildContextHintLines({ role: 'student', context: { isReviewMyAttempt: true } }).join('\n');
assert.match(studentAttemptHints, /Review-attempt hint/i, 'Student review attempt hint should be present');
assert.match(studentAttemptHints, /strengths/i, 'Review attempt should mention strengths');

const teacherLessonHints = buildContextHintLines({ role: 'teacher', context: { isLessonPlanning: true } }).join('\n');
assert.match(teacherLessonHints, /Lesson-planning hint/i, 'Teacher lesson planning hint should be present');
assert.match(teacherLessonHints, /Objectives/i, 'Lesson planning should reference Objectives section');

const parentReportHints = buildContextHintLines({ role: 'parent', context: { isReportExplanation: true } }).join('\n');
assert.match(parentReportHints, /Report-explanation hint/i, 'Parent report explanation hint should be present');
assert.match(parentReportHints, /Big picture/i, 'Report explanation should reference Big picture structure');

console.log('\n✅ Intent flag context hints tests passed');
