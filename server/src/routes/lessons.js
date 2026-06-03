import { Router } from 'express';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

export const lessonsRouter = Router();

lessonsRouter.get('/', (req, res) => {
  const lessons = db.prepare('SELECT * FROM lessons ORDER BY level, type, created_at').all();
  res.json({ lessons });
});

const lessonSchema = z.object({
  title_en: z.string().min(2),
  title_ne: z.string().min(1),
  type: z.string().min(2),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  content: z.string().min(5)
});

lessonsRouter.post('/', requireAuth, requireAdmin, (req, res) => {
  const parsed = lessonSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid lesson data' });
  const lesson = { id: nanoid(), ...parsed.data };
  db.prepare('INSERT INTO lessons (id, title_en, title_ne, type, level, content) VALUES (?, ?, ?, ?, ?, ?)')
    .run(lesson.id, lesson.title_en, lesson.title_ne, lesson.type, lesson.level, lesson.content);
  res.status(201).json({ lesson });
});

lessonsRouter.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM lessons WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
