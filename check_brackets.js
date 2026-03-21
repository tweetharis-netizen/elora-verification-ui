const fs = require('fs');
const code = fs.readFileSync('c:\\Users\\tweet\\Downloads\\CUserstweetDocumentsElora\\elora-verification-ui-1\\src\\pages\\ParentDashboardPage.tsx', 'utf8');

const checkMismatches = (text) => {
    const stack = [];
    const pairs = { '{': '}', '(': ')', '[': ']' };
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (pairs[char]) {
                stack.push({ char, line: i + 1, col: j + 1 });
            } else if (Object.values(pairs).includes(char)) {
                if (stack.length === 0) {
                    console.log(`Unmatched closing ${char} at line ${i + 1}, column ${j + 1}`);
                } else {
                    const top = stack.pop();
                    if (pairs[top.char] !== char) {
                        console.log(`Mismatch: ${top.char} at l${top.line}:c${top.col} with ${char} at l${i+1}:c${j+1}`);
                    }
                }
            }
        }
    }
    if (stack.length > 0) {
        console.log('Unclosed brackets:', stack.map(s => `${s.char} (l${s.line}:c${s.col})`).join(', '));
    } else {
        console.log('No bracket mismatches found.');
    }
};

checkMismatches(code);
