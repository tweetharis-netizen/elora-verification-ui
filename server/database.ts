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

  CREATE TABLE IF NOT EXISTS assignments (
    id          TEXT PRIMARY KEY,
    class_id    TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id  TEXT NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    game_pack_id TEXT,
    due_date    TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'draft' 
                CHECK(status IN ('draft', 'published')),
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS assignment_attempts (
    id              TEXT PRIMARY KEY,
    assignment_id   TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id      TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'not_started'
                    CHECK(status IN ('not_started','in_progress','submitted')),
    best_session_id TEXT,
    score           INTEGER,
    submitted_at    TEXT,
    updated_at      TEXT DEFAULT (datetime('now')),
    UNIQUE(assignment_id, student_id)
  );

  CREATE TABLE IF NOT EXISTS game_sessions (
    id            TEXT PRIMARY KEY,
    student_id    TEXT NOT NULL REFERENCES users(id),
    assignment_id TEXT REFERENCES assignments(id), -- nullable
    class_id      TEXT REFERENCES classes(id),     -- nullable
    pack_id       TEXT,
    score         INTEGER NOT NULL,                -- 0–100
    topic_tags    TEXT,                            -- JSON array of strings
    results       TEXT,                            -- JSON array of detailed question outcomes
    played_at     TEXT NOT NULL,
    created_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_assignments_class 
    ON assignments(class_id);
  CREATE INDEX IF NOT EXISTS idx_attempts_student 
    ON assignment_attempts(student_id);
  CREATE INDEX IF NOT EXISTS idx_attempts_assignment 
    ON assignment_attempts(assignment_id);
  CREATE INDEX IF NOT EXISTS idx_game_sessions_student 
    ON game_sessions(student_id);
  CREATE INDEX IF NOT EXISTS idx_game_sessions_assignment 
    ON game_sessions(assignment_id);
  CREATE INDEX IF NOT EXISTS idx_game_sessions_class 
    ON game_sessions(class_id);
`);

// Seed
sqliteDb.prepare(`
  INSERT OR IGNORE INTO users (id, name, email, role) VALUES
    ('teacher_1', 'Mr. Michael Lee', 'teacher@elora.com', 'teacher'),
    ('student_1', 'Jordan Lee', 'student@elora.com', 'student'),
    ('parent_1', 'Mr. Lee', 'parent@elora.com', 'parent')
`).run();

sqliteDb.prepare(`
  INSERT OR IGNORE INTO parent_children (parent_id, child_id) VALUES
    ('parent_1', 'student_1')
`).run();

// Export a simple db wrapper with standard helpers
export const db = {
    prepare: (sql: string) => sqliteDb.prepare(sql),
    exec: (sql: string) => sqliteDb.exec(sql),
    transaction: (fn: any) => sqliteDb.transaction(fn),
    get: (sql: string, ...params: any[]) => sqliteDb.prepare(sql).get(...params),
    all: (sql: string, ...params: any[]) => sqliteDb.prepare(sql).all(...params),
    run: (sql: string, ...params: any[]) => sqliteDb.prepare(sql).run(...params),
};
