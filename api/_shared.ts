/**
 * Shared utilities for API routes
 * Placed at api root level to avoid module resolution issues
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// ============================================================================
// CREDIT TRACKING
// ============================================================================

/**
 * In-memory storage for usage tracking
 */
const usageStore: Record<string, Record<string, number>> = {};

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function parseCookies(cookieString: string): Record<string, string> {
  return cookieString.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, string>);
}

export function generateSessionId(): string {
  return crypto.randomBytes(16).toString('hex');
}

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

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}

export function getUsageForSession(sessionId: string): number {
  const today = getTodayKey();
  const sessionUsage = usageStore[sessionId] || {};
  return sessionUsage[today] || 0;
}

export function incrementUsage(sessionId: string): void {
  const today = getTodayKey();

  if (!usageStore[sessionId]) {
    usageStore[sessionId] = {};
  }

  usageStore[sessionId][today] = (usageStore[sessionId][today] || 0) + 1;
}

export function hasExceededLimit(sessionId: string, limit: number = 3): boolean {
  const devModeBypass = process.env.DEV_MODE_BYPASS_LIMITS === 'true';
  if (devModeBypass) {
    console.log('⚠️ DEV MODE: Credit limits bypassed');
    return false;
  }

  const usage = getUsageForSession(sessionId);
  return usage >= limit;
}

// ============================================================================
// JOB STATE TRACKING
// ============================================================================

export type Provider = 'tripoSR' | 'tripo3D';
export type Stage = 'INIT' | 'QUEUE' | 'FALLBACK' | 'GENERATE' | 'COMPLETE' | 'ERROR';

export interface FallbackInfo {
  attempted: boolean;
  reason?: 'queue-timeout' | 'primary-failed';
  attemptedAt?: number;
}

export interface JobMetadata {
  taskId: string;
  provider: Provider;
  stage: Stage;
  queueStartedAt: number;
  fallbackLocked: boolean;
  fallback: FallbackInfo;
  originalImage?: string;
}

const jobStore: Record<string, JobMetadata> = {};

export function createJob(taskId: string, provider: Provider, originalImage?: string): JobMetadata {
  const metadata: JobMetadata = {
    taskId,
    provider,
    stage: 'INIT',
    queueStartedAt: Date.now(),
    fallbackLocked: false,
    fallback: { attempted: false },
    originalImage,
  };

  jobStore[taskId] = metadata;
  console.log(`[JobStore] Created job ${taskId} with provider ${provider}`);

  return metadata;
}

export function getJob(taskId: string): JobMetadata | null {
  return jobStore[taskId] || null;
}

export function updateJob(taskId: string, updates: Partial<JobMetadata>): JobMetadata | null {
  const job = jobStore[taskId];
  if (!job) {
    console.warn(`[JobStore] Attempted to update non-existent job ${taskId}`);
    return null;
  }

  Object.assign(job, updates);
  console.log(`[JobStore] Updated job ${taskId}:`, updates);

  return job;
}

export function shouldTriggerFallback(job: JobMetadata): boolean {
  // Check if fallback is disabled via environment variable (for testing)
  const fallbackDisabled = process.env.DISABLE_FALLBACK === 'true';
  if (fallbackDisabled) {
    console.log('⚠️ [FALLBACK] Fallback disabled via DISABLE_FALLBACK env var');
    return false;
  }

  if (job.fallback.attempted) {
    return false;
  }

  if (job.fallbackLocked) {
    return false;
  }

  const queueWaitMs = Date.now() - job.queueStartedAt;
  const threshold = parseInt(process.env.FALLBACK_THRESHOLD_MS || '16000'); // 16 seconds default

  console.log(`[FALLBACK] Queue wait: ${queueWaitMs}ms, threshold: ${threshold}ms`);

  return queueWaitMs >= threshold;
}

export function getQueueWaitMs(job: JobMetadata): number {
  return Date.now() - job.queueStartedAt;
}

export function lockFallback(taskId: string): void {
  const job = jobStore[taskId];
  if (job) {
    job.fallbackLocked = true;
    console.log(`[JobStore] Locked fallback for job ${taskId}`);
  }
}
