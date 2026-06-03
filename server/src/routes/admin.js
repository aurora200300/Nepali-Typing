import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get('/overview', (req, res) => {
  const users = db.prepare('SELECT COUNT(*) count FROM users').get().count;
  const sessions = db.prepare('SELECT COUNT(*) count FROM practice_sessions').get().count;
  const avg = db.prepare('SELECT ROUND(AVG(wpm),1) avgWpm, ROUND(AVG(accuracy),1) avgAccuracy FROM practice_sessions').get();
  const activeToday = db.prepare("SELECT COUNT(DISTINCT user_id) count FROM practice_sessions WHERE DATE(created_at)=DATE('now')").get().count;
  res.json({ users, sessions, activeToday, ...avg });
});

adminRouter.get('/users', (req, res) => {
  const users = db.prepare(`SELECT u.id, u.name, u.email, u.role, u.level, u.created_at,
    COUNT(p.id) sessions, COALESCE(MAX(p.wpm),0) bestWpm, COALESCE(SUM(p.score),0) score
    FROM users u LEFT JOIN practice_sessions p ON p.user_id = u.id
    GROUP BY u.id ORDER BY u.created_at DESC`).all();
  res.json({ users });
});
