// This file bootstraps the rate limiter middleware for use in Express apps.
import dotenv from 'dotenv';
dotenv.config({ path: process.env.ENV_PATH || '../../.env' });

import { rateLimiter, deductResponseTokens } from './rateLimiter';
import { initializeDatabase } from './db';

export { rateLimiter, deductResponseTokens, initializeDatabase };