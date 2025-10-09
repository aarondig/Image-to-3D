import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Convert/Export GLB to USDZ using Tripo API
 * This endpoint triggers a format conversion job at Tripo
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  const origin = req.headers.origin || '';
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({ error: 'Missing taskId' });
    }

    const tripoApiBase = process.env.TRIPO_API_BASE;
    const tripoApiKey = process.env.TRIPO_API_KEY;

    if (!tripoApiBase || !tripoApiKey) {
      console.error('[convert-usdz] Missing TRIPO_API_BASE or TRIPO_API_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    console.log(`📤 [CONVERT-USDZ] Requesting USDZ export for task: ${taskId}`);

    // Use Tripo's conversion API - create a new task that converts existing model to USDZ
    // Based on Tripo API pattern: type='convert' with original task_id and output format
    const conversionPayload = {
      type: 'convert',
      original_task_id: taskId,
      format: 'usdz',
    };

    console.log('[CONVERT-USDZ] Conversion payload:', JSON.stringify(conversionPayload, null, 2));

    const tripoResponse = await fetch(`${tripoApiBase}/task`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tripoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(conversionPayload),
    });

    console.log(`📥 [CONVERT-USDZ] Tripo response status: ${tripoResponse.status}`);

    if (!tripoResponse.ok) {
      const errorText = await tripoResponse.text();
      console.error('[CONVERT-USDZ] Tripo API error:', errorText);
      return res.status(tripoResponse.status).json({
        error: 'Conversion failed',
        detail: errorText,
      });
    }

    const data = await tripoResponse.json();
    console.log('📦 [CONVERT-USDZ] Response data:', JSON.stringify(data, null, 2));

    const conversionTaskId = data.data?.task_id || data.task_id;

    // Return conversion task ID for polling
    return res.status(202).json({
      taskId: conversionTaskId,
      status: 'processing',
      message: 'USDZ conversion started',
    });
  } catch (error) {
    console.error('[CONVERT-USDZ] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
