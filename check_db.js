import Database from 'better-sqlite3';
const db = new Database('./elora.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name).join(', '));
try {
  const schema = db.prepare("PRAGMA table_info(game_sessions)").all();
  console.log('game_sessions schema:');
  console.table(schema);
} catch (e) {
  console.log('Table game_sessions does not exist');
}
db.close();
