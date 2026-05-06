#!/usr/bin/env node
import assert from 'node:assert/strict';
import { parseSuggestionsFromResponse } from '../src/components/Copilot/CopilotShared';

console.log('🧪 Copilot suggestion suppression tests');

const responseWithSuggestions = [
  'Here is a short answer.',
  'Suggestions:',
  '- Practice more',
  '- Create a study guide',
].join('\n');

const doneCase = parseSuggestionsFromResponse(responseWithSuggestions, "Thanks, that's all for now!");
assert.equal(doneCase.suggestions.length, 0, 'Done signal should suppress suggestions');
assert.match(doneCase.cleanContent, /Here is a short answer\./i, 'Done case should preserve the main response');

const activeCase = parseSuggestionsFromResponse(responseWithSuggestions, 'Can you give me more practice questions?');
assert.ok(activeCase.suggestions.length > 0, 'Active user should receive parsed suggestions');
assert.deepEqual(
  activeCase.suggestions.map((item) => item.label),
  ['Practice more', 'Create a study guide'],
  'Active case should preserve parsed suggestion text'
);

const noHeaderCase = parseSuggestionsFromResponse('Try this next:\n- Use the formula\n- Check your answer', 'I still need help');
assert.equal(noHeaderCase.suggestions.length, 2, 'Trailing bullet suggestions should still parse without a header');

console.log('✅ Copilot suggestion suppression tests passed');