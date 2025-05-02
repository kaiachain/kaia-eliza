import { Request, Response, NextFunction } from 'express';
import { config } from './config';
import { estimateTokens } from './tokenEstimator';
import { getRoom, createRoom, updateRoom } from './db';
import sqlite3 from 'sqlite3';

export const rateLimiter = (db: sqlite3.Database) => async (req: Request, res: Response, next: NextFunction) => {
  const roomId = req.body.roomId;
  if (!roomId) {
    return res.status(400).json({ error: 'Room ID is required in body' });
  }
  
  try {
    let room = await getRoom(db, roomId);
    const now = Date.now();
    
    if (!room) {
      await createRoom(db, roomId, config.initialTokens);
      room = { roomId, tokensRemaining: config.initialTokens, lastCalled: now };
    }
    
    const estimatedTokens = estimateTokens(req.body.text);
    
    if (estimatedTokens > room.tokensRemaining) {
      const secondsSinceLastCall = (now - room.lastCalled) / 1000;
      const resetTimeInSeconds = config.resetHours * 3600;
      
      if (secondsSinceLastCall >= resetTimeInSeconds) {
        room.tokensRemaining = config.initialTokens;
        if (estimatedTokens > room.tokensRemaining) {
          return res.status(429).json({
            error: `Not enough tokens available even after reset. Required: ${estimatedTokens}, Available: ${room.tokensRemaining}`,
            tokensRemaining: room.tokensRemaining,
            estimatedTokens,
          });
        }
      } else {
        const minutesRemaining = Math.ceil((resetTimeInSeconds - secondsSinceLastCall) / 60).toFixed(0);
        return res.status(429).json({
          error: `Please wait ${minutesRemaining} minutes before making another call`,
          tokensRemaining: room.tokensRemaining,
          estimatedTokens,
        });
      }
    }
    
    room.tokensRemaining -= estimatedTokens;
    room.lastCalled = now;
    await updateRoom(db, roomId, room.tokensRemaining, now);
    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deductResponseTokens = async (db: sqlite3.Database, roomId: string, resultText: string): Promise<number> => {
  const tokens = estimateTokens(resultText);
  const room = await getRoom(db, roomId);
  if (room) {
    const newTokens = room.tokensRemaining - tokens;
    await updateRoom(db, roomId, newTokens);
    return newTokens;
  }
  return 0;
};