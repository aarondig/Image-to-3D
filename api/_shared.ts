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

export type Stage = 'INIT' | 'QUEUE' | 'GENERATE' | 'COMPLETE' | 'ERROR';

export interface JobMetadata {
  taskId: string;
  stage: Stage;
  createdAt: number;
}

const jobStore: Record<string, JobMetadata> = {};

export function createJob(taskId: string): JobMetadata {
  const metadata: JobMetadata = {
    taskId,
    stage: 'INIT',
    createdAt: Date.now(),
  };

  jobStore[taskId] = metadata;
  console.log(`[JobStore] Created job ${taskId}`);

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

// ============================================================================
// MOCK MODE FOR DEVELOPMENT
// ============================================================================

/**
 * Generate a mock task ID for development mode
 */
export function generateMockTaskId(): string {
  return `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Generate mock 3D model URL (a simple cube GLB)
 */
export function getMockModelUrl(): string {
  // Return a data URL for a minimal GLB file (simple cube)
  // In production, you could return a hosted sample model
  return 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb';
}

// ============================================================================
// SERVER-SIDE RESULT CACHING
// ============================================================================

export interface CachedModelResult {
  taskId: string;
  modelUrl: string;
  timestamp: number;
  imageHash: string;
}

const resultCache: Record<string, CachedModelResult> = {};
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Check if a result is cached for this image hash
 */
export function getCachedModelResult(imageHash: string): CachedModelResult | null {
  if (!imageHash) return null;

  const cached = resultCache[imageHash];
  if (!cached) return null;

  // Check if expired
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL_MS) {
    console.log(`🗑️ [SERVER-CACHE] Expired cache for hash: ${imageHash.substring(0, 16)}...`);
    delete resultCache[imageHash];
    return null;
  }

  console.log(`✅ [SERVER-CACHE] Found cached result for hash: ${imageHash.substring(0, 16)}...`);
  return cached;
}

/**
 * Cache a completed model result
 */
export function cacheModelResult(imageHash: string, taskId: string, modelUrl: string): void {
  if (!imageHash || !taskId || !modelUrl) return;

  resultCache[imageHash] = {
    taskId,
    modelUrl,
    timestamp: Date.now(),
    imageHash,
  };

  console.log(`💾 [SERVER-CACHE] Cached result for hash: ${imageHash.substring(0, 16)}...`);
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { count: number; oldestAgeMs: number } {
  const entries = Object.values(resultCache);
  const now = Date.now();

  return {
    count: entries.length,
    oldestAgeMs: entries.length > 0 ? Math.max(...entries.map(e => now - e.timestamp)) : 0,
  };
}
