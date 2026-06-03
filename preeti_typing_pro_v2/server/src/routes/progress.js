import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { calculateTypingStats, getLevel } from '../utils/scoring.js';

export const progressRouter = Router();
progressRouter.use(requireAuth);

function unlockAchievements(userId, stats) {
  const codes = [];
  if (stats.wpm >= 30) codes.push('WPM_30');
  if (stats.wpm >= 50) codes.push('WPM_50');
  if (stats.accuracy >= 90) codes.push('ACC_90');
  if (stats.mistakes === 0 && stats.typedChars > 20) codes.push('NO_ERROR');
  for (const code of codes) {
    const achievement = db.prepare('SELECT id FROM achievements WHERE code = ?').get(code);
    if (achievement) db.prepare('INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)').run(userId, achievement.id);
  }
}

progressRouter.post('/session', (req, res) => {
  const { targetText, typedText, durationSeconds, lessonId, mode = 'practice' } = req.body;
  if (!targetText || typeof typedText !== 'string') return res.status(400).json({ error: 'targetText and typedText are required' });
  const stats = calculateTypingStats({ targetText, typedText, durationSeconds });
  const id = nanoid();
  db.prepare(`INSERT INTO practice_sessions
    (id, user_id, lesson_id, mode, typed_text, target_text, duration_seconds, typed_chars, correct_chars, mistakes, wpm, accuracy, score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, req.user.id, lessonId || null, mode, typedText, targetText, Number(durationSeconds || 1), stats.typedChars, stats.correctChars, stats.mistakes, stats.wpm, stats.accuracy, stats.score);
  unlockAchievements(req.user.id, stats);
  const best = db.prepare('SELECT MAX(wpm) AS bestWpm FROM practice_sessions WHERE user_id = ?').get(req.user.id);
  db.prepare('UPDATE users SET level = ? WHERE id = ?').run(getLevel(best.bestWpm || 0), req.user.id);
  res.status(201).json({ session: { id, ...stats, mode } });
});

progressRouter.get('/dashboard', (req, res) => {
  const today = db.prepare(`SELECT
      COALESCE(ROUND(AVG(wpm),1),0) avgWpm,
      COALESCE(ROUND(AVG(accuracy),1),0) avgAccuracy,
      COALESCE(SUM(duration_seconds),0) practiceSeconds,
      COALESCE(SUM(typed_chars),0) typedChars,
      COALESCE(SUM(mistakes),0) mistakes,
      COALESCE(SUM(score),0) score,
      COUNT(*) sessions
    FROM practice_sessions
    WHERE user_id = ? AND DATE(created_at) = DATE('now')`).get(req.user.id);

  const weekly = db.prepare(`SELECT DATE(created_at) day, ROUND(AVG(wpm),1) wpm, ROUND(AVG(accuracy),1) accuracy, COUNT(*) sessions
    FROM practice_sessions
    WHERE user_id = ? AND created_at >= DATETIME('now', '-7 days')
    GROUP BY DATE(created_at)
    ORDER BY day`).all(req.user.id);

  const recent = db.prepare(`SELECT id, mode, wpm, accuracy, mistakes, score, created_at FROM practice_sessions
    WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`).all(req.user.id);

  const achievements = db.prepare(`SELECT a.* , ua.unlocked_at FROM user_achievements ua
    JOIN achievements a ON a.id = ua.achievement_id
    WHERE ua.user_id = ? ORDER BY ua.unlocked_at DESC`).all(req.user.id);

  const streakRows = db.prepare(`SELECT DISTINCT DATE(created_at) day FROM practice_sessions WHERE user_id = ? ORDER BY day DESC LIMIT 60`).all(req.user.id);
  const streak = countStreak(streakRows.map(r => r.day));
  res.json({ today, weekly, recent, achievements, streak, user: req.user });
});

progressRouter.get('/leaderboard', (req, res) => {
  const rows = db.prepare(`SELECT u.name, u.avatar_url, u.level, ROUND(MAX(p.wpm),1) bestWpm, ROUND(AVG(p.accuracy),1) avgAccuracy, SUM(p.score) totalScore
    FROM practice_sessions p JOIN users u ON u.id = p.user_id
    GROUP BY u.id ORDER BY totalScore DESC, bestWpm DESC LIMIT 20`).all();
  res.json({ leaderboard: rows });
});

function countStreak(days) {
  const set = new Set(days);
  let count = 0;
  const d = new Date();
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if (!set.has(key)) break;
    count += 1;
    d.setDate(d.getDate() - 1);
  }
  return count;
}
