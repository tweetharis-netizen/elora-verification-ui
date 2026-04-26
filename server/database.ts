import Database from 'better-sqlite3';
import path from 'path';

export const DEMO_USER_IDS = new Set(['teacher_1', 'student_1', 'parent_1']);

// Vercel serverless files are read-only, so use /tmp there.
const dbPath = process.env.VERCEL
    ? path.join('/tmp', 'elora.db')
    : path.resolve(process.cwd(), 'elora.db');

export const sqliteDb = new Database(dbPath, { verbose: console.log });

sqliteDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('teacher','student','parent')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS waitlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
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
    subject TEXT,
    level TEXT,
    estimated_duration_minutes INTEGER,
    source_material TEXT,
    due_date    TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'draft' 
                CHECK(status IN ('draft', 'published')),
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS assignment_objectives (
    assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    objective_id TEXT NOT NULL,
    text TEXT NOT NULL,
    bloom_level TEXT,
    category TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (assignment_id, objective_id)
  );

  CREATE TABLE IF NOT EXISTS assignment_tasks (
    assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT,
    estimated_minutes INTEGER,
    order_index INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (assignment_id, task_id)
  );

  CREATE TABLE IF NOT EXISTS assignment_task_objectives (
    assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL,
    objective_id TEXT NOT NULL,
    PRIMARY KEY (assignment_id, task_id, objective_id)
  );

  CREATE TABLE IF NOT EXISTS assignment_attachments (
    assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    attachment_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    mime_type TEXT,
    size_bytes INTEGER,
    storage_path TEXT,
    uploaded_at TEXT,
    PRIMARY KEY (assignment_id, attachment_id)
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

  CREATE TABLE IF NOT EXISTS teacher_conversations (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
    student_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    title TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_message_at TEXT
  );

  CREATE TABLE IF NOT EXISTS teacher_conversation_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES teacher_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
    content TEXT NOT NULL,
    intent TEXT,
    source TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS student_conversations (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
    subject TEXT,
    week_key TEXT,
    title TEXT,
    thread_type TEXT NOT NULL DEFAULT 'weekly_subject'
      CHECK(thread_type IN ('weekly_subject', 'checkpoint', 'free_study')),
    summary TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_message_at TEXT
  );

  CREATE TABLE IF NOT EXISTS student_conversation_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES student_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
    content TEXT NOT NULL,
    intent TEXT,
    source TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_assignments_class 
    ON assignments(class_id);
  CREATE INDEX IF NOT EXISTS idx_assignment_objectives_assignment
    ON assignment_objectives(assignment_id);
  CREATE INDEX IF NOT EXISTS idx_assignment_tasks_assignment
    ON assignment_tasks(assignment_id);
  CREATE INDEX IF NOT EXISTS idx_assignment_task_objectives_assignment
    ON assignment_task_objectives(assignment_id);
  CREATE INDEX IF NOT EXISTS idx_assignment_attachments_assignment
    ON assignment_attachments(assignment_id);
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
  CREATE INDEX IF NOT EXISTS idx_teacher_conversations_teacher_updated
    ON teacher_conversations(teacher_id, updated_at DESC);
  CREATE INDEX IF NOT EXISTS idx_teacher_conversations_teacher_class
    ON teacher_conversations(teacher_id, class_id);
  CREATE INDEX IF NOT EXISTS idx_teacher_conversations_teacher_student
    ON teacher_conversations(teacher_id, student_id);
  CREATE INDEX IF NOT EXISTS idx_teacher_messages_conversation_created
    ON teacher_conversation_messages(conversation_id, created_at ASC);
  CREATE INDEX IF NOT EXISTS idx_student_conversations_student_updated
    ON student_conversations(student_id, updated_at DESC);
  CREATE INDEX IF NOT EXISTS idx_student_conversations_student_subject_week
    ON student_conversations(student_id, subject, week_key);
  CREATE INDEX IF NOT EXISTS idx_student_messages_conversation_created
    ON student_conversation_messages(conversation_id, created_at ASC);
`);

const ensureAssignmentColumn = (columnName: string, columnSqlType: string) => {
  const existingColumns = sqliteDb
    .prepare(`PRAGMA table_info(assignments)`)
    .all() as Array<{ name: string }>;
  if (existingColumns.some((column) => column.name === columnName)) {
    return;
  }
  sqliteDb.exec(`ALTER TABLE assignments ADD COLUMN ${columnName} ${columnSqlType}`);
};

ensureAssignmentColumn('subject', 'TEXT');
ensureAssignmentColumn('level', 'TEXT');
ensureAssignmentColumn('estimated_duration_minutes', 'INTEGER');
ensureAssignmentColumn('source_material', 'TEXT');

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
