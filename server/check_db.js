const Database = require('better-sqlite3');
const db = new Database('elora.db');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name).join(', '));

const assignments = db.prepare("SELECT COUNT(*) as count FROM assignments").get();
const attempts = db.prepare("SELECT COUNT(*) as count FROM assignment_attempts").get();
const users = db.prepare("SELECT COUNT(*) as count FROM users").get();

console.log('Assignments count:', assignments.count);
console.log('Attempts count:', attempts.count);
console.log('Users count:', users.count);

db.close();
