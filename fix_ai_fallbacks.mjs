import { readFileSync, writeFileSync } from 'fs';

const file = 'server/controllers/ai.ts';
let content = readFileSync(file, 'utf8');

// --- Fix 1: teacher error fallback in !response.ok block ---
// Find and replace any remaining old-style teacher error fallback messages
// These contain curly quotes that we can't type directly, so we use char codes.
const apostrophe = '\u2019'; // right single quotation mark
const leftSingle  = '\u2018'; // left single quotation mark
const find1 = `if (userRole === 'teacher') {\n        errorFallback = \u201cI${apostrophe}m having a bit of trouble connecting right now. While that loads, you can still see which students need attention in your dashboard. Want to check your ${leftSingle}Needs attention${apostrophe} panel?\u201d;\n      } else if (userRole === 'student') {`;
const replace1 = `if (userRole === 'teacher') {\n        errorFallback = \"I'm having trouble connecting to Elora's brain right now \u2014 please try again in a moment. If this keeps happening, it may be a network hiccup on our side. Your class data is still visible in the main dashboard.\";\n      } else if (userRole === 'student') {`;

if (content.includes(find1)) {
  content = content.replace(find1, replace1);
  console.log('✅ Fixed error fallback block 1 (!response.ok)');
} else {
  console.log('ℹ️ Block 1 not found (may already be fixed)');
}

// --- Fix 2: teacher fallback in empty-output block ---
const find2 = `if (userRole === 'teacher') {\n        finalOutput = \u201cI${apostrophe}m having a bit of trouble connecting right now. While that loads, you can still see which students need attention in your dashboard. Want to check your ${leftSingle}Needs attention${apostrophe} panel?\u201d;\n      } else if (userRole === 'student') {`;
const replace2 = `if (userRole === 'teacher') {\n        finalOutput = \"I'm having trouble connecting to Elora's brain right now \u2014 please try again in a moment. If this keeps happening, it may be a network hiccup on our side. Your class data is still visible in the main dashboard.\";\n      } else if (userRole === 'student') {`;

if (content.includes(find2)) {
  content = content.replace(find2, replace2);
  console.log('✅ Fixed error fallback block 2 (empty output)');
} else {
  console.log('ℹ️ Block 2 not found (may already be fixed)');
}

writeFileSync(file, content, 'utf8');
console.log('Done.');
