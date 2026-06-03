import { Router } from 'express';
import { deleteById, id, insert, load } from '../store.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

export const lessonsRouter = Router();

lessonsRouter.get('/', (req, res) => {
  const order = { Beginner: 1, Intermediate: 2, Advanced: 3 };
  const lessons = [...load().lessons].sort((a, b) => (order[a.level] || 9) - (order[b.level] || 9) || a.type.localeCompare(b.type));
  res.json({ lessons });
});

lessonsRouter.post('/', requireAuth, requireAdmin, (req, res) => {
  const { title_en, title_ne, type, level, content } = req.body || {};
  if (!title_en || !title_ne || !type || !['Beginner', 'Intermediate', 'Advanced'].includes(level) || !content) {
    return res.status(400).json({ error: 'title_en, title_ne, type, level and content are required' });
  }
  const lesson = insert('lessons', { id: id('lesson'), title_en, title_ne, type, level, content });
  res.status(201).json({ lesson });
});

lessonsRouter.delete('/:lessonId', requireAuth, requireAdmin, (req, res) => {
  deleteById('lessons', req.params.lessonId);
  res.json({ ok: true });
});
