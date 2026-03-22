import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { reviewRateLimiter } from '../middleware/rateLimiter';
import { analyzeCode } from '../services/aiService';

const router = Router();

const reviewSchema = z.object({
  code: z.string().min(10, 'Code must be at least 10 characters').max(10000),
  language: z.string().min(1).max(50),
  context: z.string().max(500).optional(),
});

// POST /api/review  — protected + rate limited
router.post(
  '/',
  authenticate,
  reviewRateLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = reviewSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const result = await analyzeCode(parsed.data);
    res.json({ success: true, user: req.user?.email, review: result });
  }
);

// GET /api/review/health — public
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'AI Code Review API' });
});

export default router;