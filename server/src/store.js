import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'preeti_typing_data.json');

const empty = () => ({
  users: [],
  lessons: [],
  practice_sessions: [],
  achievements: [],
  user_achievements: []
});

let cache = null;

export function id(prefix = 'id') {
  return `${prefix}_${crypto.randomUUID().replaceAll('-', '').slice(0, 18)}`;
}

export function now() {
  return new Date().toISOString();
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function migrate() {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify(empty(), null, 2));
  load();
}

export function load() {
  if (!cache) {
    try {
      cache = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    } catch {
      cache = empty();
      save();
    }
    for (const key of Object.keys(empty())) if (!Array.isArray(cache[key])) cache[key] = [];
  }
  return cache;
}

export function save() {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(cache || empty(), null, 2));
}

export function resetStore() {
  cache = empty();
  save();
}

export function publicUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

export function insert(collection, item) {
  const db = load();
  db[collection].push({ ...item, created_at: item.created_at || now() });
  save();
  return item;
}

export function upsertBy(collection, key, value, createFn, updateFn = x => x) {
  const db = load();
  let item = db[collection].find(x => x[key] === value);
  if (item) {
    Object.assign(item, updateFn(item));
  } else {
    item = createFn();
    db[collection].push({ ...item, created_at: item.created_at || now() });
  }
  save();
  return item;
}

export function updateUser(userId, patch) {
  const db = load();
  const user = db.users.find(x => x.id === userId);
  if (!user) return null;
  Object.assign(user, patch);
  save();
  return user;
}

export function deleteById(collection, itemId) {
  const db = load();
  const before = db[collection].length;
  db[collection] = db[collection].filter(x => x.id !== itemId);
  save();
  return before !== db[collection].length;
}
