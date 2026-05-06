#!/usr/bin/env node
/**
 * Test for Copilot File capability hardening.
 *
 * Verifies:
 * 1. File metadata consistency (using 'id' instead of 'file_id').
 * 2. Proper integration with role-specific Skill hints.
 */

import assert from 'node:assert/strict';
import { buildContextHintLines, buildSourceContextLines } from '../src/lib/llm/prompt';
import type { CopilotFileAttachment } from '../src/lib/llm/types';

console.log('🧪 Starting Copilot File Hardening Test');

const mockFile: CopilotFileAttachment = {
    id: 'file_test_123',
    name: 'assignment.pdf',
    type: 'pdf',
    sizeBytes: 1024 * 512,
};

assert.ok('id' in mockFile, 'File metadata should use id');
assert.ok(!('file_id' in mockFile), 'File metadata should not use file_id');

const testRoles = ['student', 'teacher', 'parent'] as const;

for (const role of testRoles) {
    const hints = buildContextHintLines({ role, context: { fileAttachments: [mockFile] } as any });
    const hintStr = hints.join('\n');

    assert.match(hintStr, /File Context hint/i, `File hint should be injected for ${role}`);
    assert.match(hintStr, /PRIVACY: Files are conversation-local context/i, `Privacy notice should be injected for ${role}`);

    if (role === 'student') {
        assert.match(hintStr, /Socratically/i, 'Student file hints should include Socratic guidance');
    }

    if (role === 'teacher') {
        assert.match(hintStr, /Quiz Me/i, 'Teacher file hints should include quiz guidance');
    }

    if (role === 'parent') {
        assert.match(hintStr, /Home Help/i, 'Parent file hints should include home help guidance');
    }
}

const ctxSummary = {
    role: 'student',
    activeAssignmentId: 'assn-1',
    activeQuestionId: null,
    sourceSnippets: [{ id: 'file_test_123', label: 'assignment.pdf', type: 'file' }],
};

const hintsWithSource = buildSourceContextLines({ context: { copilotContextSummary: ctxSummary } as any }).join('\n');
assert.match(hintsWithSource, /Source Context/i, 'Source Context hint should be injected when copilotContextSummary is present');

console.log('✅ Copilot File Hardening tests completed successfully!');
