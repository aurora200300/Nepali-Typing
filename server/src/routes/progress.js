import { Router } from 'express';
import { id, insert, load, save, todayKey, updateUser } from '../store.js';
import { requireAuth } from '../middleware/auth.js';
import { calculateTypingStats, getLevel } from '../utils/scoring.js';

export const progressRouter = Router();
progressRouter.use(requireAuth);

function unlockAchievements(userId, stats) {
  const db = load();
  const codes = [];
  if (stats.wpm >= 30) codes.push('WPM_30');
  if (stats.wpm >= 50) codes.push('WPM_50');
  if (stats.accuracy >= 90) codes.push('ACC_90');
  if (stats.mistakes === 0 && stats.typedChars > 20) codes.push('NO_ERROR');
  for (const code of codes) {
    const achievement = db.achievements.find(a => a.code === code);
    if (achievement && !db.user_achievements.some(x => x.user_id === userId && x.achievement_id === achievement.id)) {
      db.user_achievements.push({ user_id: userId, achievement_id: achievement.id, unlocked_at: new Date().toISOString() });
    }
  }
  save();
}

progressRouter.post('/session', (req, res) => {
  const { targetText, typedText, durationSeconds, lessonId, mode = 'practice' } = req.body || {};
  if (!targetText || typeof typedText !== 'string') return res.status(400).json({ error: 'targetText and typedText are required' });
  const stats = calculateTypingStats({ targetText, typedText, durationSeconds });
  const session = insert('practice_sessions', {
    id: id('session'),
    user_id: req.user.id,
    lesson_id: lessonId || null,
    mode,
    typed_text: typedText,
    target_text: targetText,
    duration_seconds: Number(durationSeconds || 1),
    typed_chars: stats.typedChars,
    correct_chars: stats.correctChars,
    mistakes: stats.mistakes,
    wpm: stats.wpm,
    accuracy: stats.accuracy,
    score: stats.score
  });
  unlockAchievements(req.user.id, stats);
  const userSessions = load().practice_sessions.filter(s => s.user_id === req.user.id);
  const bestWpm = Math.max(0, ...userSessions.map(s => Number(s.wpm || 0)));
  updateUser(req.user.id, { level: getLevel(bestWpm) });
  res.status(201).json({ session: { id: session.id, ...stats, mode } });
});

progressRouter.get('/dashboard', (req, res) => {
  const db = load();
  const sessions = db.practice_sessions.filter(s => s.user_id === req.user.id);
  const today = todayKey();
  const todays = sessions.filter(s => String(s.created_at || '').slice(0, 10) === today);
  const sum = (arr, field) => arr.reduce((n, x) => n + Number(x[field] || 0), 0);
  const avg = (arr, field) => arr.length ? Math.round((sum(arr, field) / arr.length) * 10) / 10 : 0;
  const weeklyMap = new Map();
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  sessions.filter(s => new Date(s.created_at).getTime() >= cutoff).forEach(s => {
    const day = String(s.created_at).slice(0, 10);
    if (!weeklyMap.has(day)) weeklyMap.set(day, []);
    weeklyMap.get(day).push(s);
  });
  const weekly = [...weeklyMap.entries()].sort().map(([day, rows]) => ({ day, wpm: avg(rows, 'wpm'), accuracy: avg(rows, 'accuracy'), sessions: rows.length }));
  const recent = [...sessions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
  const achievements = db.user_achievements
    .filter(ua => ua.user_id === req.user.id)
    .map(ua => ({ ...db.achievements.find(a => a.id === ua.achievement_id), unlocked_at: ua.unlocked_at }))
    .filter(a => a.id)
    .sort((a, b) => new Date(b.unlocked_at) - new Date(a.unlocked_at));
  const streakDays = [...new Set(sessions.map(s => String(s.created_at).slice(0, 10)))].sort().reverse();
  res.json({
    today: {
      avgWpm: avg(todays, 'wpm'),
      avgAccuracy: avg(todays, 'accuracy'),
      practiceSeconds: sum(todays, 'duration_seconds'),
      typedChars: sum(todays, 'typed_chars'),
      mistakes: sum(todays, 'mistakes'),
      score: sum(todays, 'score'),
      sessions: todays.length
    },
    weekly,
    recent,
    achievements,
    streak: countStreak(streakDays),
    user: req.user
  });
});

progressRouter.get('/leaderboard', (req, res) => {
  const db = load();
  const rows = db.users.map(user => {
    const sessions = db.practice_sessions.filter(s => s.user_id === user.id);
    if (!sessions.length) return null;
    const totalScore = sessions.reduce((n, s) => n + Number(s.score || 0), 0);
    const bestWpm = Math.round(Math.max(...sessions.map(s => Number(s.wpm || 0))) * 10) / 10;
    const avgAccuracy = Math.round((sessions.reduce((n, s) => n + Number(s.accuracy || 0), 0) / sessions.length) * 10) / 10;
    return { name: user.name, avatar_url: user.avatar_url, level: user.level, bestWpm, avgAccuracy, totalScore };
  }).filter(Boolean).sort((a, b) => b.totalScore - a.totalScore || b.bestWpm - a.bestWpm).slice(0, 20);
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
