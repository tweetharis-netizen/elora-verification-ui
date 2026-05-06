import assert from 'node:assert/strict';

const { parseReferenceMentions, normalizeReferenceMentions } = await import('../src/lib/mentions/referenceMentions.js');

const parsed = parseReferenceMentions(
  'Please help with @Q3 from @Assignment:LinearFunctions and @Resource:IntroFractionsVideo.'
);


assert.equal(parsed.length, 3, 'Expected three parsed mentions from shorthand and typed tokens.');
const find = (t: string, v: string) => parsed.find((p) => p.type === t && p.value === v);
assert.ok(find('question', '3'), 'Expected a question mention with value 3');
assert.ok(find('assignment', 'LinearFunctions'), 'Expected an assignment mention with value LinearFunctions');
assert.ok(find('resource', 'IntroFractionsVideo'), 'Expected a resource mention with value IntroFractionsVideo');

const punctuated = parseReferenceMentions('Explain @Q3, then move to @Assignment:LinearFunctions.');
const pFind = (t: string, v: string) => punctuated.find((p) => p.type === t && p.value === v);
assert.ok(pFind('question', '3'), 'Expected @Q3 with trailing comma to parse correctly');
assert.ok(
  pFind('assignment', 'LinearFunctions'),
  'Expected @Assignment with trailing period to parse correctly'
);

const malformed = parseReferenceMentions('Ignore @@Q3 and lone @ token, but keep @Q4');
assert.equal(malformed.length, 1, 'Malformed mention tokens should be ignored.');
assert.ok(malformed.find((p) => p.type === 'question' && p.value === '4'));

const overlongValue = `@Assignment:${'A'.repeat(101)}`;
const overlongParsed = parseReferenceMentions(`Please check ${overlongValue} and @Q2`);
assert.equal(overlongParsed.length, 1, 'Overly long mention tokens should be ignored.');
assert.ok(overlongParsed.find((p) => p.type === 'question' && p.value === '2'));

const mixed = parseReferenceMentions(
  `Mix @Q1 @Q2 @@Q3 @Q4 @Q5 @Q6 @Q7 @Q8 @Q9 @Q10 @ and ${overlongValue}`
);
assert.equal(mixed.length, 8, 'Mixed mentions should keep only valid mentions and enforce cap of 8.');
assert.ok(mixed.find((p) => p.type === 'question' && p.value === '1'));
assert.ok(mixed.find((p) => p.type === 'question' && p.value === '8'));

const normalized = normalizeReferenceMentions([
  { raw: '@Question:5', type: 'Question', value: '5' },
  { raw: '@Question:5', type: 'question', value: '5' },
  { raw: '@Assignment:AlgebraWeek2', type: 'assignment', value: 'AlgebraWeek2' },
  { raw: '@Bad', type: 'bad_type', value: 'Something' },
]);

assert.equal(normalized.length, 3, 'Expected deduplicated and normalized mention list.');
const nFind = (t: string, v?: string) => normalized.find((p) => p.type === t && (v ? p.value === v : true));
assert.ok(nFind('question'), 'Normalized should include a question');
assert.ok(nFind('assignment'), 'Normalized should include an assignment');
assert.ok(nFind('unknown'), 'Normalized should include an unknown for bad types');

console.log('Reference mention parser smoke test passed.');
