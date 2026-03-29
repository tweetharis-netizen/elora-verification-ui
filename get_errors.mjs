import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

try {
  execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
  writeFileSync('errors_out.txt', 'NO ERRORS\n', 'utf8');
} catch (e) {
  const output = (e.stdout || '') + (e.stderr || '');
  writeFileSync('errors_out.txt', output, 'utf8');
}
console.log('done');
