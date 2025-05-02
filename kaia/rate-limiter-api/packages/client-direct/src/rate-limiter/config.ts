import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  initialTokens: parseInt(process.env.INITIAL_TOKENS || '10000'),
  resetHours: parseFloat(process.env.RESET_HOURS || '5'),
  dbPath: path.join(process.cwd(), 'data', 'rate-limiter.db'),
};