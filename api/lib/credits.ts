import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

/**
 * In-memory storage for usage tracking
 * Format: { sessionId: { date: usageCount } }
 * This resets on serverless function cold starts, which is acceptable for MVP
 * For production, use Vercel KV, Redis, or a database
 */
const usageStore: Record<string, Record<string, number>> = {};

/**
 * Get today's date key (YYYY-MM-DD)
 */
function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Parse cookie string into key-value object
 */
export function parseCookies(cookieString: string): Record<string, string> {
  return cookieString.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, string>);
}

/**
 * Generate a random session ID
 */
export function generateSessionId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Enable CORS for API endpoints
 */
export function enableCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin || '';
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}

/**
 * Get usage count for a session on the current day
 */
export function getUsageForSession(sessionId: string): number {
  const today = getTodayKey();
  const sessionUsage = usageStore[sessionId] || {};
  return sessionUsage[today] || 0;
}

/**
 * Increment usage count for a session
 */
export function incrementUsage(sessionId: string): void {
  const today = getTodayKey();

  if (!usageStore[sessionId]) {
    usageStore[sessionId] = {};
  }

  usageStore[sessionId][today] = (usageStore[sessionId][today] || 0) + 1;
}

/**
 * Check if session has exceeded daily limit
 */
export function hasExceededLimit(sessionId: string, limit: number = 3): boolean {
  // DEV MODE: Check for bypass flag
  const devModeBypass = process.env.DEV_MODE_BYPASS_LIMITS === 'true';
  if (devModeBypass) {
    console.log('⚠️ DEV MODE: Credit limits bypassed');
    return false;
  }

  const usage = getUsageForSession(sessionId);
  return usage >= limit;
}

/**
 * Clean up old usage data (older than 2 days)
 * Call this periodically to prevent memory bloat
 */
export function cleanupOldUsage(): void {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const cutoffKey = twoDaysAgo.toISOString().split('T')[0];

  Object.keys(usageStore).forEach((sessionId) => {
    const sessionUsage = usageStore[sessionId];
    Object.keys(sessionUsage).forEach((dateKey) => {
      if (dateKey < cutoffKey) {
        delete sessionUsage[dateKey];
      }
    });

    // Remove session if no usage data remains
    if (Object.keys(sessionUsage).length === 0) {
      delete usageStore[sessionId];
    }
  });
}
