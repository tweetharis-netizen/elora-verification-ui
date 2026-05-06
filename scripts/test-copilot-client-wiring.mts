#!/usr/bin/env node
import assert from 'node:assert/strict';
import { callEloraCopilot } from '../src/lib/api/eloraCopilotClient';
import { setCurrentUser } from '../src/services/dataService';

console.log('🧪 Copilot client wiring tests');

const originalFetch = globalThis.fetch;
let lastFetchBody: Record<string, any> = {};

setCurrentUser({
  id: 'teacher_1',
  name: 'Teacher Demo',
  role: 'teacher',
});

try {
  globalThis.fetch = (async (...args) => {
    // Capture request body for inspection
    if (args[1]?.body) {
      try {
        lastFetchBody = JSON.parse(args[1].body as string);
      } catch {}
    }
    return new Response(JSON.stringify({ content: 'Primary content path works.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  const modernResult = await callEloraCopilot({
    role: 'teacher',
    useCase: 'teacher_chat',
    messages: [{ role: 'user', content: 'hi' }],
    context: {
      role: 'teacher',
      userName: 'Michael',
      isGreeting: true,
      isCapabilityQuery: false,
      isGenericHelp: false,
      isStudyPlanning: true,
      isQuizGeneration: true,
      isReviewMyAttempt: false,
      isLessonPlanning: true,
      isReportExplanation: false,
    },
  });
  assert.equal(modernResult, 'Primary content path works.');
  assert.equal(lastFetchBody.context?.isGreeting, true, 'Context should include isGreeting');
  assert.equal(lastFetchBody.context?.isCapabilityQuery, false, 'Context should include isCapabilityQuery');
  assert.equal(lastFetchBody.context?.role, 'teacher', 'Context should include role');
  assert.equal(lastFetchBody.context?.userName, 'Michael', 'Context should include userName');
  assert.equal(lastFetchBody.context?.isGenericHelp, false, 'Context should include isGenericHelp');
  assert.equal(lastFetchBody.context?.isStudyPlanning, true, 'Context should include isStudyPlanning');
  assert.equal(lastFetchBody.context?.isQuizGeneration, true, 'Context should include isQuizGeneration');
  assert.equal(lastFetchBody.context?.isReviewMyAttempt, false, 'Context should include isReviewMyAttempt');
  assert.equal(lastFetchBody.context?.isLessonPlanning, true, 'Context should include isLessonPlanning');
  assert.equal(lastFetchBody.context?.isReportExplanation, false, 'Context should include isReportExplanation');

  globalThis.fetch = (async (...args) => {
    if (args[1]?.body) {
      try {
        lastFetchBody = JSON.parse(args[1].body as string);
      } catch {}
    }
    return new Response(JSON.stringify({ text: 'Legacy text path still works.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  const legacyResult = await callEloraCopilot({
    role: 'teacher',
    useCase: 'teacher_chat',
    messages: [{ role: 'user', content: 'hello' }],
    context: {
      role: 'teacher',
      isCapabilityQuery: true,
    },
  });
  assert.equal(legacyResult, 'Legacy text path still works.');
  assert.equal(lastFetchBody.context?.isCapabilityQuery, true, 'Capability query flag should be passed through');

  globalThis.fetch = (async (...args) => {
    if (args[1]?.body) {
      try {
        lastFetchBody = JSON.parse(args[1].body as string);
      } catch {}
    }
    return new Response(JSON.stringify({ content: '', text: '   ' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  await assert.rejects(
    () =>
      callEloraCopilot({
        role: 'teacher',
        useCase: 'teacher_chat',
        messages: [{ role: 'user', content: 'test' }],
      }),
    /empty response/i,
  );

  console.log('✅ Copilot client wiring tests passed');
} finally {
  globalThis.fetch = originalFetch;
  setCurrentUser(null);
}
