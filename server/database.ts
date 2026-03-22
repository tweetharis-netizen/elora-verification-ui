import Database from 'better-sqlite3';
import path from 'path';

export const DEMO_USER_IDS = new Set(['teacher_1', 'student_1', 'parent_1']);

// the database is relative to project root. We can use path.resolve from process.cwd()
const dbPath = path.resolve(process.cwd(), 'elora.db');

export const sqliteDb = new Database(dbPath, { verbose: console.log });

sqliteDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('teacher','student','parent')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL DEFAULT 'General',
    teacher_id TEXT NOT NULL REFERENCES users(id),
    join_code TEXT UNIQUE NOT NULL,
    schedule_time TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES classes(id),
    student_id TEXT NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
    joined_at TEXT DEFAULT (datetime('now')),
    UNIQUE(class_id, student_id)
  );

  CREATE TABLE IF NOT EXISTS parent_children (
    parent_id TEXT NOT NULL REFERENCES users(id),
    child_id TEXT NOT NULL REFERENCES users(id),
    PRIMARY KEY (parent_id, child_id)
  );
`);

// Seed
const seedUsers = sqliteDb.prepare(`
  INSERT OR IGNORE INTO users (id, name, email, role) VALUES
    ('teacher_1', 'Mr. Michael Lee', 'teacher@elora.com', 'teacher'),
    ('student_1', 'Jordan Lee', 'student@elora.com', 'student'),
    ('parent_1', 'Mr. Lee', 'parent@elora.com', 'parent')
`);
seedUsers.run();

const seedParentChild = sqliteDb.prepare(`
  INSERT OR IGNORE INTO parent_children (parent_id, child_id) VALUES
    ('parent_1', 'student_1')
`);
seedParentChild.run();
