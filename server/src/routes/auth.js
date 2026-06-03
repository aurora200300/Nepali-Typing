import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { createToken, requireAuth } from '../middleware/auth.js';
import { id, insert, load, publicUser, updateUser } from '../store.js';

export const authRouter = Router();

function baseUser(data) {
  return {
    id: id('user'),
    name: data.name,
    email: String(data.email || '').toLowerCase(),
    password_hash: data.password_hash || null,
    avatar_url: data.avatar_url || '',
    provider: data.provider || 'email',
    role: data.role || 'user',
    level: data.level || 'Beginner',
    daily_goal_minutes: data.daily_goal_minutes || 20,
    language: data.language || 'en',
    theme: data.theme || 'light'
  };
}

function sendAuth(res, user, status = 200) {
  const safe = publicUser(user);
  return res.status(status).json({ token: createToken(safe), user: safe });
}

// Simple email registration endpoint.
authRouter.post('/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || String(name).length < 2 || !email || !String(email).includes('@') || !password || String(password).length < 6) {
    return res.status(400).json({ error: 'Name, valid email and 6+ character password are required' });
  }
  const db = load();
  if (db.users.some(u => u.email === String(email).toLowerCase())) return res.status(409).json({ error: 'Email already registered' });
  const user = baseUser({ name, email, password_hash: bcrypt.hashSync(String(password), 10) });
  insert('users', user);
  sendAuth(res, user, 201);
});

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = load().users.find(u => u.email === String(email || '').toLowerCase());
  if (!user || !user.password_hash || !bcrypt.compareSync(String(password || ''), user.password_hash)) {
    return res.status(401).json({ error: 'Wrong email or password' });
  }
  sendAuth(res, user);
});

authRouter.post('/demo', (req, res) => {
  const db = load();
  let user = db.users.find(u => u.email === 'demo@preetifont.local');
  if (!user) user = insert('users', baseUser({ name: 'Demo Learner', email: 'demo@preetifont.local', provider: 'demo' }));
  sendAuth(res, user);
});

// Google-ready endpoint. For production, verify Google ID token on the server.
authRouter.post('/google', (req, res) => {
  const { name, email, avatarUrl } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Google email is required' });
  const db = load();
  let user = db.users.find(u => u.email === String(email).toLowerCase());
  if (!user) user = insert('users', baseUser({ name: name || 'Google User', email, avatar_url: avatarUrl || '', provider: 'google' }));
  sendAuth(res, user);
});

authRouter.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

authRouter.patch('/settings', requireAuth, (req, res) => {
  const allowed = ['language', 'theme', 'daily_goal_minutes'];
  const patch = {};
  for (const key of allowed) if (req.body?.[key] !== undefined) patch[key] = req.body[key];
  if (!Object.keys(patch).length) return res.status(400).json({ error: 'No valid settings sent' });
  const user = updateUser(req.user.id, patch);
  res.json({ user: publicUser(user) });
});
