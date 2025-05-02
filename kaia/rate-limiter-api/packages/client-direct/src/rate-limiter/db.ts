import sqlite3 from 'sqlite3';
import { config } from './config';
import fs from 'fs';
import path from 'path';

export function initializeDatabase(): sqlite3.Database {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const db = new sqlite3.Database(config.dbPath);
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS rate_limits (
      roomId TEXT PRIMARY KEY,
      createdAt INTEGER,
      tokensRemaining INTEGER,
      lastCalled INTEGER
    )`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_lastCalled ON rate_limits(lastCalled)`);
  });
  return db;
}

export function getRoom(db: sqlite3.Database, roomId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM rate_limits WHERE roomId = ?', [roomId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function createRoom(db: sqlite3.Database, roomId: string, tokens: number): Promise<void> {
  const now = Date.now();
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO rate_limits (roomId, createdAt, tokensRemaining, lastCalled) VALUES (?, ?, ?, ?)`,
      [roomId, now, tokens, now],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export function updateRoom(db: sqlite3.Database, roomId: string, tokensRemaining: number, lastCalled?: number): Promise<void> {
  const now = lastCalled || Date.now();
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE rate_limits SET tokensRemaining = ?, lastCalled = ? WHERE roomId = ?`,
      [tokensRemaining, now, roomId],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}