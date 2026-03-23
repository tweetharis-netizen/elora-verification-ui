const db = require('better-sqlite3')('elora.db');
db.prepare("INSERT OR IGNORE INTO parent_children (parent_id, child_id) VALUES ('u_test_parent', 'u_test_student')").run();
console.log('Linked parent to student');
