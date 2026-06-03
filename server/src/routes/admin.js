import { Router } from 'express';
import { load } from '../store.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get('/overview', (req, res) => {
  const db = load();
  const sessions = db.practice_sessions;
  const today = new Date().toISOString().slice(0, 10);
  const avg = field => sessions.length ? Math.round((sessions.reduce((n, s) => n + Number(s[field] || 0), 0) / sessions.length) * 10) / 10 : 0;
  res.json({
    users: db.users.length,
    lessons: db.lessons.length,
    sessions: sessions.length,
    achievements: db.achievements.length,
    activeToday: new Set(sessions.filter(s => String(s.created_at).slice(0, 10) === today).map(s => s.user_id)).size,
    avgWpm: avg('wpm'),
    avgAccuracy: avg('accuracy')
  });
});

adminRouter.get('/users', (req, res) => {
  const db = load();
  const users = db.users.map(u => {
    const sessions = db.practice_sessions.filter(s => s.user_id === u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      level: u.level,
      created_at: u.created_at,
      sessions: sessions.length,
      bestWpm: Math.round(Math.max(0, ...sessions.map(s => Number(s.wpm || 0))) * 10) / 10,
      score: sessions.reduce((n, s) => n + Number(s.score || 0), 0)
    };
  });
  res.json({ users });
});
