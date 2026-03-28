const fs = require('fs');
let c = fs.readFileSync('src/components/classroom/ClassroomComponents.tsx', 'utf8');
c = c.replace(/\\\"/g, '\"');
c = c.replace(/className=\{\\\\/g, 'className={');
c = c.replace(/\\\\}/g, '}');
c = c.replace(/\\\$/g, '$');
fs.writeFileSync('src/components/classroom/ClassroomComponents.tsx', c);
