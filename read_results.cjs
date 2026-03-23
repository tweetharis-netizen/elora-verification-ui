const fs = require('fs');
const text = fs.readFileSync('test_results_utf8.txt', 'utf8');
const lines = text.split('\n');
const out = [];
lines.forEach(line => {
    const l = line.trim();
    if (l.match(/FAIL \[|PASS \[|===|PASSED :|FAILED :/)) {
        out.push(l);
    }
});
fs.writeFileSync('summary_clean.txt', out.join('\n'), 'utf8');
console.log('Written to summary_clean.txt');
console.log('Line count:', out.length);
out.forEach(l => process.stdout.write(l + '\n'));
