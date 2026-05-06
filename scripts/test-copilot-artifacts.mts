#!/usr/bin/env node
import assert from 'node:assert/strict';

console.log('🧪 Copilot artifact parsing tests');

type ParsedArtifact = {
  title: string;
  summary?: string;
  content: string;
  kind?: string;
};

function parseArtifactFromResponse(raw: string): ParsedArtifact | null {
  const marker = '---ARTIFACT---';
  const idx = raw.indexOf(marker);
  if (idx < 0) return null;
  const tail = raw.slice(idx + marker.length).trim();
  try {
    const obj = JSON.parse(tail);
    if (obj && obj.title && obj.content) return obj;
  } catch {
    return null;
  }
  return null;
}

const cases: Array<{ name: string; raw: string; expectedKind: string }> = [
  {
    name: 'student',
    expectedKind: 'study_guide',
    raw: [
      'Some explanation...',
      '',
      '---ARTIFACT---',
      JSON.stringify({ title: 'Study Guide', summary: 'Short summary', content: 'Full content', kind: 'study_guide' }),
    ].join('\n'),
  },
  {
    name: 'teacher',
    expectedKind: 'lesson_plan',
    raw: [
      'Some explanation...',
      '',
      '---ARTIFACT---',
      JSON.stringify({ title: 'Lesson Plan', summary: 'Short summary', content: 'Full content', kind: 'lesson_plan' }),
    ].join('\n'),
  },
  {
    name: 'parent',
    expectedKind: 'parent_report',
    raw: [
      'Some explanation...',
      '',
      '---ARTIFACT---',
      JSON.stringify({ title: 'Parent Report', summary: 'Short summary', content: 'Full content', kind: 'parent_report' }),
    ].join('\n'),
  },
];

for (const testCase of cases) {
  const parsed = parseArtifactFromResponse(testCase.raw);
  assert.ok(parsed, `Expected artifact payload for ${testCase.name}`);
  assert.equal(parsed?.title, testCase.name === 'student' ? 'Study Guide' : testCase.name === 'teacher' ? 'Lesson Plan' : 'Parent Report');
  assert.equal(parsed?.summary, 'Short summary');
  assert.equal(parsed?.content, 'Full content');
  assert.equal(parsed?.kind, testCase.expectedKind);
}

assert.equal(parseArtifactFromResponse('No artifact here.'), null, 'Missing marker should return null');
assert.equal(
  parseArtifactFromResponse('---ARTIFACT---\n{ not valid json }'),
  null,
  'Malformed JSON tail should return null without throwing'
);

console.log('✅ Copilot artifact parsing tests passed');