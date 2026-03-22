/// <reference types="node" />
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret',
  anthropicKey: process.env.ANTHROPIC_API_KEY || '',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  nodeEnv: process.env.NODE_ENV || 'development',
};