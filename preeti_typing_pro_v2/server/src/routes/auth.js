import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { db } from '../db.js';
import { createToken, requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

authRouter.post('/register', (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid registration data' });
  const { name, email, password } = parsed.data;
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (exists) return res.status(409).json({ error: 'Email already registered' });
  const user = {
    id: nanoid(),
    name,
    email: email.toLowerCase(),
    password_hash: bcrypt.hashSync(password, 10)
  };
  db.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)').run(user.id, user.name, user.email, user.password_hash);
  const publicUser = db.prepare('SELECT id, name, email, avatar_url, role, level, language, theme, daily_goal_minutes FROM users WHERE id = ?').get(user.id);
  res.status(201).json({ token: createToken(publicUser), user: publicUser });
});

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email || '').toLowerCase());
  if (!user || !user.password_hash || !bcrypt.compareSync(String(password || ''), user.password_hash)) {
    return res.status(401).json({ error: 'Wrong email or password' });
  }
  const publicUser = db.prepare('SELECT id, name, email, avatar_url, role, level, language, theme, daily_goal_minutes FROM users WHERE id = ?').get(user.id);
  res.json({ token: createToken(publicUser), user: publicUser });
});

authRouter.post('/demo', (req, res) => {
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get('demo@preetifont.local');
  if (!user) {
    const id = nanoid();
    db.prepare('INSERT INTO users (id, name, email, provider, avatar_url) VALUES (?, ?, ?, ?, ?)').run(id, 'Demo Learner', 'demo@preetifont.local', 'demo', '');
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }
  const publicUser = db.prepare('SELECT id, name, email, avatar_url, role, level, language, theme, daily_goal_minutes FROM users WHERE id = ?').get(user.id);
  res.json({ token: createToken(publicUser), user: publicUser });
});

// Google OAuth-ready endpoint. In production, verify Google idToken with google-auth-library.
authRouter.post('/google', (req, res) => {
  const { name, email, avatarUrl } = req.body;
  if (!email) return res.status(400).json({ error: 'Google email is required' });
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase());
  if (!user) {
    const id = nanoid();
    db.prepare('INSERT INTO users (id, name, email, avatar_url, provider) VALUES (?, ?, ?, ?, ?)')
      .run(id, name || 'Google User', String(email).toLowerCase(), avatarUrl || '', 'google');
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }
  const publicUser = db.prepare('SELECT id, name, email, avatar_url, role, level, language, theme, daily_goal_minutes FROM users WHERE id = ?').get(user.id);
  res.json({ token: createToken(publicUser), user: publicUser });
});

authRouter.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

authRouter.patch('/settings', requireAuth, (req, res) => {
  const allowed = ['language', 'theme', 'daily_goal_minutes'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'No valid settings sent' });
  const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE users SET ${sets} WHERE id = ?`).run(...Object.values(updates), req.user.id);
  const user = db.prepare('SELECT id, name, email, avatar_url, role, level, language, theme, daily_goal_minutes FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});
