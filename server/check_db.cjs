const Database = require('better-sqlite3');
const db = new Database('elora.db');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name).join(', '));

// Only count if tables exist
const tableNames = tables.map(t => t.name);
if (tableNames.includes('assignments')) {
    const assignments = db.prepare("SELECT COUNT(*) as count FROM assignments").get();
    console.log('Assignments count:', assignments.count);
}
if (tableNames.includes('assignment_attempts')) {
    const attempts = db.prepare("SELECT COUNT(*) as count FROM assignment_attempts").get();
    console.log('Attempts count:', attempts.count);
}
if (tableNames.includes('users')) {
    const users = db.prepare("SELECT COUNT(*) as count FROM users").get();
    console.log('Users count:', users.count);
}

db.close();
