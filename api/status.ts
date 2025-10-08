import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { JobStatus } from '../src/types/api.js';
import FormData from 'form-data';
import {
  getJob,
  updateJob,
  shouldTriggerFallback,
  getQueueWaitMs,
  lockFallback,
  type JobMetadata,
} from './_shared.js';

/**
 * Enable CORS for the API endpoint
 */
function enableCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}

/**
 * Map Tripo status codes to our normalized JobStatus enum
 */
function normalizeStatus(tripoStatus: string): JobStatus {
  const statusMap: Record<string, JobStatus> = {
    'queued': 'QUEUED',
    'running': 'RUNNING',
    'success': 'SUCCEEDED',
    'failed': 'FAILED',
    'timeout': 'TIMEOUT',
  };

  return statusMap[tripoStatus.toLowerCase()] || 'RUNNING';
}

/**
 * Normalize Tripo API response to our standard format
 */
function normalizeResponse(tripoData: any) {
  console.log('Raw Tripo response:', JSON.stringify(tripoData));

  const status = normalizeStatus(tripoData.data?.status || tripoData.status || 'running');

  // Tripo sends progress as 0-100, convert to 0-1
  let rawProgress = tripoData.data?.progress ?? (status === 'SUCCEEDED' ? 100 : 0);
  const progress = rawProgress > 1 ? rawProgress / 100 : rawProgress;

  console.log('Status:', status, 'Raw progress:', rawProgress, 'Normalized:', progress);

  // Extract asset information - check multiple possible locations and formats
  let asset = null;
  if (status === 'SUCCEEDED') {
    const result = tripoData.data?.result || tripoData.data?.output || tripoData.output || {};

    // Try to get rendered_image URLs (contains both GLB and USDZ)
    const renderedImage = result.rendered_image || result.pbr_model || result.model;

    // Check if we have multiple formats
    let glbUrl = null;
    let usdzUrl = null;

    if (renderedImage) {
      // If it's an object with format-specific URLs
      if (typeof renderedImage === 'object') {
        glbUrl = renderedImage.glb?.url || renderedImage.url;
        usdzUrl = renderedImage.usdz?.url;
      } else if (typeof renderedImage === 'string') {
        // Single URL (assume GLB)
        glbUrl = renderedImage;
      }
    }

    // Fallback to checking direct paths
    if (!glbUrl) {
      glbUrl = tripoData.data?.result?.pbr_model?.url ||
               tripoData.data?.output?.pbr_model ||
               tripoData.data?.result?.model ||
               tripoData.data?.output?.model ||
               tripoData.data?.model ||
               tripoData.output?.model;
    }

    if (glbUrl) {
      asset = {
        url: glbUrl,
        format: 'glb',
        sizeBytes: 0,
        // Include USDZ URL if available
        ...(usdzUrl && { usdzUrl }),
      };
      console.log('Asset found:', { glbUrl, usdzUrl });
    } else {
      console.log('No asset URL found in response');
    }
  }

  return {
    taskId: tripoData.data?.task_id || tripoData.task_id,
    status,
    progress,
    message: getStatusMessage(status, progress),
    asset,
    error: tripoData.data?.error || tripoData.error || null,
  };
}

/**
 * Get human-readable status message
 */
function getStatusMessage(status: JobStatus, progress: number): string {
  switch (status) {
    case 'QUEUED':
      return 'Job in queue...';
    case 'RUNNING':
      return `Generating mesh... ${Math.round(progress * 100)}%`;
    case 'SUCCEEDED':
      return 'Mesh generation complete';
    case 'FAILED':
      return 'Generation failed';
    case 'TIMEOUT':
      return 'Job timed out';
    default:
      return 'Processing...';
  }
}

/**
 * Create fallback job with Tripo3D
 */
async function createFallbackJob(job: JobMetadata, reason: 'queue-timeout' | 'primary-failed'): Promise<string | null> {
  try {
    const tripoApiBase = process.env.TRIPO_API_BASE;
    const tripoApiKey = process.env.TRIPO_API_KEY;

    if (!tripoApiBase || !tripoApiKey || !job.originalImage) {
      console.error('❌ [FALLBACK] Missing required data for fallback');
      return null;
    }

    console.log(`🔄 [FALLBACK] Triggering fallback to Tripo3D (reason: ${reason})`);

    // Upload image again
    const base64Data = job.originalImage.includes(',') ? job.originalImage.split(',')[1] : job.originalImage;
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const uploadFormData = new FormData();
    uploadFormData.append('file', imageBuffer, {
      filename: 'image.jpg',
      contentType: 'image/jpeg',
    });

    const uploadResponse = await fetch(`${tripoApiBase}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tripoApiKey}`,
        ...uploadFormData.getHeaders(),
      },
      body: uploadFormData.getBuffer(),
    });

    if (!uploadResponse.ok) {
      console.error('❌ [FALLBACK] Upload failed:', uploadResponse.status);
      return null;
    }

    const uploadData = await uploadResponse.json();
    const fileToken = uploadData.data?.image_token || uploadData.image_token;

    // Create Tripo3D task (different model version - paid tier)
    const taskPayload = {
      type: 'image_to_model',
      file: {
        type: 'jpg',
        file_token: fileToken,
      },
      // No model_version specified = uses default Tripo3D (paid tier)
      mode: 'high',
    };

    console.log('📤 [FALLBACK] Creating Tripo3D job with payload:', JSON.stringify(taskPayload, null, 2));

    const tripoResponse = await fetch(`${tripoApiBase}/task`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tripoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskPayload),
    });

    if (!tripoResponse.ok) {
      const errorText = await tripoResponse.text();
      console.error('❌ [FALLBACK] Tripo3D API error:', tripoResponse.status, errorText);
      return null;
    }

    const data = await tripoResponse.json();
    console.log('📦 [FALLBACK] Tripo3D full response:', JSON.stringify(data, null, 2));

    const newTaskId = data.data?.task_id || data.task_id;
    console.log('✅ [FALLBACK] Fallback job created - newTaskId:', newTaskId);

    // Update job metadata
    updateJob(job.taskId, {
      provider: 'tripo3D',
      stage: 'FALLBACK',
      fallback: {
        attempted: true,
        reason,
        attemptedAt: Date.now(),
      },
    });

    return newTaskId;
  } catch (error) {
    console.error('❌ [FALLBACK] Error creating fallback job:', error);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  if (enableCors(req, res)) {
    return; // Preflight request handled
  }

  // Validate method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract taskId from query
    let taskId = String(req.query.id || '');

    if (!taskId) {
      return res.status(400).json({ error: 'Missing or invalid id' });
    }

    console.log(`🔍 [STATUS] Checking status for taskId: ${taskId}`);

    // Get Tripo API credentials
    const tripoApiBase = process.env.TRIPO_API_BASE;
    const tripoApiKey = process.env.TRIPO_API_KEY;

    if (!tripoApiBase || !tripoApiKey) {
      console.error('Missing TRIPO_API_BASE or TRIPO_API_KEY environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Get job metadata for fallback tracking
    const job = getJob(taskId);
    if (job) {
      console.log(`📊 [STATUS] Job metadata - provider: ${job.provider}, stage: ${job.stage}, fallback attempted: ${job.fallback.attempted}`);
    }

    // Query Tripo API
    console.log(`📡 [STATUS] Querying API for task: ${taskId}`);
    const tripoResponse = await fetch(`${tripoApiBase}/task/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tripoApiKey}`,
      },
    });

    console.log(`📥 [STATUS] API response status: ${tripoResponse.status}`);

    if (!tripoResponse.ok) {
      const errorText = await tripoResponse.text();
      console.error(`❌ [STATUS] Tripo API error: ${tripoResponse.status} - ${errorText}`);

      // 404 means task not found (expired or invalid)
      if (tripoResponse.status === 404) {
        return res.status(404).json({
          error: 'Unknown taskId (expired or never existed)',
        });
      }

      return res.status(500).json({
        error: 'Provider error',
        detail: errorText || 'Unknown error',
      });
    }

    const tripoData = await tripoResponse.json();
    console.log(`📦 [STATUS] Full API response:`, JSON.stringify(tripoData, null, 2));

    // Normalize response
    const normalized = normalizeResponse(tripoData);
    console.log(`✅ [STATUS] Normalized status: ${normalized.status}, progress: ${normalized.progress}`);

    // Check if we need to trigger fallback
    if (job && normalized.status === 'QUEUED') {
      const queueWaitMs = getQueueWaitMs(job);
      console.log(`⏱️  [STATUS] Queue wait time: ${queueWaitMs}ms`);

      if (shouldTriggerFallback(job)) {
        console.log(`🚨 [STATUS] Fallback threshold reached! Triggering fallback to Tripo3D`);

        const newTaskId = await createFallbackJob(job, 'queue-timeout');

        if (newTaskId) {
          // Switch to new taskId for future polls
          taskId = newTaskId;
          console.log(`🔄 [STATUS] Switched to fallback taskId: ${newTaskId}`);

          // Return response with new taskId and fallback metadata
          return res.status(200).json({
            ...normalized,
            taskId: newTaskId,
            provider: 'tripo3D',
            stage: 'FALLBACK',
            queueWaitMs,
            fallback: job.fallback,
          });
        }
      }

      // Return with queue metadata
      return res.status(200).json({
        ...normalized,
        provider: job.provider,
        stage: job.stage,
        queueWaitMs,
        fallback: job.fallback,
      });
    }

    // Lock fallback if job has started running
    if (job && normalized.status === 'RUNNING' && !job.fallbackLocked) {
      lockFallback(taskId);
      updateJob(taskId, { stage: 'GENERATE' });
      console.log(`🔒 [STATUS] Job entered RUNNING state - fallback locked`);
    }

    // Update stage on completion
    if (job && (normalized.status === 'SUCCEEDED' || normalized.status === 'FAILED')) {
      updateJob(taskId, { stage: normalized.status === 'SUCCEEDED' ? 'COMPLETE' : 'ERROR' });
    }

    // Return normalized response with metadata
    return res.status(200).json({
      ...normalized,
      ...(job && {
        provider: job.provider,
        stage: job.stage,
        fallback: job.fallback,
      }),
    });
  } catch (error) {
    console.error('Error in status endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
