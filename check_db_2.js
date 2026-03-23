import Database from 'better-sqlite3';
const db = new Database('./elora.db');
const names = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
console.log('Tables:', names.join(', '));
if (names.includes('game_sessions')) {
  const info = db.prepare("PRAGMA table_info(game_sessions)").all();
  console.log('game_sessions columns:', info.map(c => c.name).join(', '));
} else {
  console.log('game_sessions TABLE MISSING!');
}
db.close();
