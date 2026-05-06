import assert from 'node:assert/strict';

process.env.ELORA_REVIEW_PROVIDER = 'mock';

const { reviewStudentCopilotReply, STUDENT_REVIEW_SAFE_FALLBACK_REPLY } = await import('../src/lib/llm/studentReview.js');

const safeCandidateReply = [
  'Here is a careful explanation of the idea.',
  'First, identify the known values.',
  'Then follow the rule step by step.',
  'Finally, check your answer with a quick example so you know it makes sense.',
  'Suggestions:\n- Ask me one practice question now.\n- Give me a step-by-step worked example.\n- Summarise this in 3 easy points.',
].join(' ');

const safeResult = await reviewStudentCopilotReply({
  candidateReply: safeCandidateReply,
  context: {
    role: 'student',
    useCase: 'student_chat',
  },
});

assert.equal(safeResult.reviewUsed, true, 'Expected the student review path to run.');
assert.equal(safeResult.reviewOutcome, 'ok', 'Expected a safe review verdict.');
assert.equal(safeResult.adjustedReply, safeCandidateReply, 'Expected the safe reply to pass through unchanged.');

const warmupFallbackResult = await reviewStudentCopilotReply({
  candidateReply: 'Here is the answer without a warmup.',
  context: {
    role: 'student',
    useCase: 'student_chat',
    guardrails: { requireWarmup: true },
  },
});

assert.equal(warmupFallbackResult.reviewUsed, true, 'Expected the review path to run for guarded content.');
assert.equal(warmupFallbackResult.reviewOutcome, 'fallback', 'Expected an unsafe reply to fall back.');
assert.equal(warmupFallbackResult.adjustedReply, STUDENT_REVIEW_SAFE_FALLBACK_REPLY, 'Expected the safe fallback message.');
assert.match(warmupFallbackResult.adjustedReply, /reliable explanation/i);

const homeworkResult = await reviewStudentCopilotReply({
  candidateReply: 'The final answer is 24. First, multiply the fractions and then simplify.',
  context: {
    role: 'student',
    useCase: 'student_chat',
    isHomework: true,
  },
});

assert.equal(homeworkResult.reviewUsed, true, 'Expected the homework path to run through review.');
assert.equal(homeworkResult.reviewOutcome, 'edited', 'Expected the hint-rewritten homework reply to be marked as edited.');
assert.equal(/final answer is 24/i.test(homeworkResult.adjustedReply), false);
assert.match(homeworkResult.adjustedReply, /work out the final answer yourself/i);

console.log('Student Copilot review smoke test passed.');
console.log({
  safe: {
    reviewUsed: safeResult.reviewUsed,
    reviewOutcome: safeResult.reviewOutcome,
    providerUsed: safeResult.providerUsed,
  },
  warmupFallback: {
    reviewUsed: warmupFallbackResult.reviewUsed,
    reviewOutcome: warmupFallbackResult.reviewOutcome,
    providerUsed: warmupFallbackResult.providerUsed,
  },
  homework: {
    reviewUsed: homeworkResult.reviewUsed,
    reviewOutcome: homeworkResult.reviewOutcome,
    providerUsed: homeworkResult.providerUsed,
  },
});
