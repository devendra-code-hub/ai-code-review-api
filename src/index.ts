import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from './config';
import reviewRouter from './routes/review';
import { errorHandler } from './middleware/errorHandler';
import { authRateLimiter } from './middleware/rateLimiter';

const app = express();

// ── Global Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50kb' }));

import path from 'path';
app.use(express.static(path.join(__dirname, '../public')));

// ── In-memory User Store (swap with MongoDB model later) ──────────────────
const users: { id: string; email: string; password: string }[] = [];

// ── Auth Routes ────────────────────────────────────────────────────────────
app.post('/api/auth/register', authRateLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' }) as any;

  if (users.find(u => u.email === email))
    return res.status(409).json({ error: 'User already exists' }) as any;

  const hashed = await bcrypt.hash(password, 10);
  const user = { id: Date.now().toString(), email, password: hashed };
  users.push(user);

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  res.status(201).json({ message: 'Registered successfully', token });
});

app.post('/api/auth/login', authRateLimiter, async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);

  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: 'Invalid credentials' }) as any;

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  res.json({ message: 'Login successful', token });
});

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/review', reviewRouter);

// ── Error Handler ──────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────────────────────
const start = async () => {
  try {
    if (config.mongoUri) {
      await mongoose.connect(config.mongoUri);
      console.log('✅ MongoDB connected');
    }
  } catch {
    console.log('⚠️  MongoDB not connected, running without DB');
  }

  app.listen(config.port, () => {
    console.log(`🚀 Server running on http://localhost:${config.port}`);
    console.log(`📋 Health: http://localhost:${config.port}/api/review/health`);
  });
};

start();