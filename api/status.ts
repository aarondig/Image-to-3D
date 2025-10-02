import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { JobStatus } from '../src/types/api';

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

  // Extract asset information - check multiple possible locations
  let asset = null;
  if (status === 'SUCCEEDED') {
    const modelUrl = tripoData.data?.result?.pbr_model?.url ||
                     tripoData.data?.output?.pbr_model ||
                     tripoData.data?.result?.model ||
                     tripoData.data?.output?.model ||
                     tripoData.data?.model ||
                     tripoData.output?.model;

    if (modelUrl) {
      asset = {
        url: modelUrl,
        format: 'glb',
        sizeBytes: 0,
      };
      console.log('Asset found:', modelUrl);
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
    const taskId = String(req.query.id || '');

    if (!taskId) {
      return res.status(400).json({ error: 'Missing or invalid id' });
    }

    // Get Tripo API credentials
    const tripoApiBase = process.env.TRIPO_API_BASE;
    const tripoApiKey = process.env.TRIPO_API_KEY;

    if (!tripoApiBase || !tripoApiKey) {
      console.error('Missing TRIPO_API_BASE or TRIPO_API_KEY environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Query Tripo API
    const tripoResponse = await fetch(`${tripoApiBase}/task/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tripoApiKey}`,
      },
    });

    if (!tripoResponse.ok) {
      const errorText = await tripoResponse.text();
      console.error('Tripo API error:', tripoResponse.status, errorText);

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

    // Normalize and return response
    const normalized = normalizeResponse(tripoData);
    return res.status(200).json(normalized);
  } catch (error) {
    console.error('Error in status endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
