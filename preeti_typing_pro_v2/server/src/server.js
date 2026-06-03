import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from './db.js';
import { authRouter } from './routes/auth.js';
import { lessonsRouter } from './routes/lessons.js';
import { progressRouter } from './routes/progress.js';
import { adminRouter } from './routes/admin.js';

migrate();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.join(__dirname, '..', '..', 'client');

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true, app: 'Preeti Typing Pro API' }));
app.use('/api/auth', authRouter);
app.use('/api/lessons', lessonsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/admin', adminRouter);
app.use(express.static(clientDir));
app.get('*', (req, res) => res.sendFile(path.join(clientDir, 'index.html')));

const port = Number(process.env.PORT || 5050);
app.listen(port, () => console.log(`Preeti Typing Pro running on http://localhost:${port}`));
