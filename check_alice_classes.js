import Database from 'better-sqlite3';

const db = new Database('db.sqlite');

const users = db.prepare("SELECT id, name, email, role FROM users WHERE role='teacher'").all();
console.log('All teachers:', JSON.stringify(users, null, 2));

const alice = db.prepare("SELECT id, name, teacher_id FROM classes WHERE teacher_id='real_teacher_alice'").all();
console.log('Classes for real_teacher_alice:', alice);

const realTeacherCtx = db.prepare("SELECT id, name, teacher_id FROM classes WHERE teacher_id='real_teacher_ctx'").all();
console.log('Classes for real_teacher_ctx:', realTeacherCtx);
