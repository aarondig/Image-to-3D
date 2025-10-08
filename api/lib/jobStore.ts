/**
 * Job state management for queue fallback logic
 * Tracks job metadata across API calls
 */

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
  originalImage?: string; // Store for fallback retry
}

/**
 * In-memory job store
 * In production, consider using Redis or Vercel KV
 */
const jobStore: Record<string, JobMetadata> = {};

/**
 * Create a new job entry
 */
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

/**
 * Get job metadata
 */
export function getJob(taskId: string): JobMetadata | null {
  return jobStore[taskId] || null;
}

/**
 * Update job metadata
 */
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

/**
 * Check if fallback should be triggered
 */
export function shouldTriggerFallback(job: JobMetadata): boolean {
  // Don't fallback if already attempted
  if (job.fallback.attempted) {
    return false;
  }

  // Don't fallback if locked (job has started running)
  if (job.fallbackLocked) {
    return false;
  }

  // Check queue wait time (trigger after 10 seconds)
  const queueWaitMs = Date.now() - job.queueStartedAt;
  const threshold = 10000; // 10 seconds

  return queueWaitMs >= threshold;
}

/**
 * Get queue wait time in milliseconds
 */
export function getQueueWaitMs(job: JobMetadata): number {
  return Date.now() - job.queueStartedAt;
}

/**
 * Lock fallback (called when job enters RUNNING state)
 */
export function lockFallback(taskId: string): void {
  const job = jobStore[taskId];
  if (job) {
    job.fallbackLocked = true;
    console.log(`[JobStore] Locked fallback for job ${taskId}`);
  }
}

/**
 * Clean up old jobs (older than 1 hour)
 */
export function cleanupOldJobs(): void {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);

  Object.keys(jobStore).forEach((taskId) => {
    const job = jobStore[taskId];
    if (job.queueStartedAt < oneHourAgo) {
      delete jobStore[taskId];
      console.log(`[JobStore] Cleaned up old job ${taskId}`);
    }
  });
}
