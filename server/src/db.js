import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data', 'preeti_typing.db');
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      avatar_url TEXT,
      provider TEXT DEFAULT 'email',
      role TEXT DEFAULT 'user',
      level TEXT DEFAULT 'Beginner',
      daily_goal_minutes INTEGER DEFAULT 20,
      language TEXT DEFAULT 'en',
      theme TEXT DEFAULT 'light',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      title_en TEXT NOT NULL,
      title_ne TEXT NOT NULL,
      type TEXT NOT NULL,
      level TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS practice_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lesson_id TEXT,
      mode TEXT NOT NULL,
      typed_text TEXT NOT NULL,
      target_text TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      typed_chars INTEGER NOT NULL,
      correct_chars INTEGER NOT NULL,
      mistakes INTEGER NOT NULL,
      wpm REAL NOT NULL,
      accuracy REAL NOT NULL,
      score INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      title_en TEXT NOT NULL,
      title_ne TEXT NOT NULL,
      description_en TEXT,
      description_ne TEXT,
      icon TEXT DEFAULT '🏆'
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      user_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(user_id, achievement_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
    );
  `);
}
