import type { VercelRequest, VercelResponse } from '@vercel/node';

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

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}

/**
 * Validate image size from base64 data URL
 */
function validateImageSize(image: string, maxBytes: number): boolean {
  if (!image.startsWith('data:image/')) {
    return false;
  }

  const base64Data = image.split(',')[1] || '';
  const sizeBytes = Math.floor((base64Data.length * 3) / 4);

  return sizeBytes <= maxBytes;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  if (enableCors(req, res)) {
    return; // Preflight request handled
  }

  // Validate method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse request body
    const { image, options } = req.body;

    // Validate image field
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid image' });
    }

    // Validate image size (default 3MB)
    const maxBytes = parseInt(process.env.MAX_IMAGE_BYTES || '3000000');
    if (!validateImageSize(image, maxBytes)) {
      return res.status(400).json({ error: 'Image too large' });
    }

    // Build Tripo API request
    const tripoApiBase = process.env.TRIPO_API_BASE;
    const tripoApiKey = process.env.TRIPO_API_KEY;

    if (!tripoApiBase || !tripoApiKey) {
      console.error('Missing TRIPO_API_BASE or TRIPO_API_KEY environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Extract base64 data without the data URL prefix (data:image/jpeg;base64,)
    const base64Data = image.includes(',') ? image.split(',')[1] : image;

    const payload = {
      type: 'image_to_model',
      file: {
        type: 'png',
        file_token: base64Data,
      },
    };

    // Call Tripo API
    const tripoResponse = await fetch(`${tripoApiBase}/task`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tripoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!tripoResponse.ok) {
      const errorText = await tripoResponse.text();
      console.error('Tripo API error:', tripoResponse.status, errorText);

      // Map Tripo error codes
      if (tripoResponse.status === 402) {
        return res.status(402).json({ error: 'Quota/credits exceeded' });
      }

      return res.status(500).json({
        error: 'Provider error',
        detail: errorText || 'Unknown error',
      });
    }

    const data = await tripoResponse.json();

    // Return taskId and status
    return res.status(202).json({
      taskId: data.data?.task_id || data.task_id,
      status: 'QUEUED',
      etaSeconds: 60,
    });
  } catch (error) {
    console.error('Error in create-mesh:', error);
    return res.status(500).json({
      error: 'Internal server error',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
