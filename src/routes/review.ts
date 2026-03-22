/// <reference types="node" />
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { reviewRateLimiter } from '../middleware/rateLimiter';
import { analyzeCode } from '../services/aiService';
import { JwtPayload } from '../types';

const router = Router();

const reviewSchema = z.object({
  code: z.string().min(10).max(10000),
  language: z.string().min(1).max(50),
  context: z.string().max(500).optional(),
});

router.post(
  '/',
  authenticate,
  reviewRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = reviewSchema.safeParse((req as any).body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const result = await analyzeCode(parsed.data);
    const user = (req as any).user as JwtPayload;
    res.json({ success: true, user: user?.email, review: result });
  }
);

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'AI Code Review API' });
});

export default router;