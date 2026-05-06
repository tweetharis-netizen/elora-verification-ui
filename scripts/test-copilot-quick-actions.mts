#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

console.log('🧪 Copilot quick-action prompt tests');

const studentPage = readFileSync(new URL('../src/pages/StudentCopilotPage.tsx', import.meta.url), 'utf8');
const teacherPage = readFileSync(new URL('../src/pages/TeacherCopilotPage.tsx', import.meta.url), 'utf8');
const parentPage = readFileSync(new URL('../src/pages/ParentCopilotPage.tsx', import.meta.url), 'utf8');

assert.match(studentPage, /Create a concise study guide from the conversation and attached materials\./i, 'Student quick action should request a study guide');
assert.match(studentPage, /---ARTIFACT---/i, 'Student quick action should emit an artifact payload');
assert.match(studentPage, /The JSON should include \{title, summary, content, kind\}/i, 'Student quick action should define the artifact shape');

assert.match(teacherPage, /Create a 3-tier differentiated snapshot \(Below \/ On \/ Above level\)/i, 'Teacher quick action should request Below/On/Above differentiation');
assert.match(teacherPage, /Format as a clear table or bullet structure\./i, 'Teacher quick action should request a clear layout');
assert.match(teacherPage, /kind: 'lesson_plan'/i, 'Teacher quick action should emit a lesson_plan artifact kind');

assert.match(parentPage, /Simplify the attached report and provide home actions\./i, 'Parent quick action should simplify the report');
assert.match(parentPage, /Big picture \(2-3 sentences\), then Strengths \/ Things to work on \/ How you can help at home\./i, 'Parent quick action should use the report simplification structure');
assert.match(parentPage, /Provide 2-4 concrete home actions\./i, 'Parent quick action should request concrete home actions');
assert.match(parentPage, /\{title, summary, content, kind\}/i, 'Parent quick action should define the artifact shape');

console.log('✅ Copilot quick-action prompt tests passed');