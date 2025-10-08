import type { VercelRequest, VercelResponse } from '@vercel/node';
import FormData from 'form-data';
import {
  parseCookies,
  generateSessionId,
  enableCors,
  hasExceededLimit,
  incrementUsage,
  createJob,
} from './_shared.js';

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
    // Parse cookies to get or create session ID
    const cookies = parseCookies(req.headers.cookie || '');
    let sessionId = cookies.sid;

    // Generate new session ID if not present
    if (!sessionId) {
      sessionId = generateSessionId();
      // Set cookie (expires in 24 hours)
      res.setHeader('Set-Cookie', `sid=${sessionId}; Path=/; Max-Age=86400; SameSite=Strict; Secure`);
    }

    // Check if session has exceeded daily limit
    if (hasExceededLimit(sessionId, 3)) {
      return res.status(402).json({
        error: 'Daily generation limit reached',
        detail: 'You have used all 3 generations for today. Please try again tomorrow.',
      });
    }

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

    // Try approach: Upload image first, then create task
    // Step 1: Upload the image to get a token
    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const imageBuffer = Buffer.from(base64Data, 'base64');

    console.log('Uploading image, size:', imageBuffer.length, 'bytes');

    // Upload to get file token
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
      const errorText = await uploadResponse.text();
      console.error('Upload error:', uploadResponse.status, errorText);
      return res.status(500).json({
        error: 'Image upload failed',
        detail: errorText,
      });
    }

    const uploadData = await uploadResponse.json();
    const fileToken = uploadData.data?.image_token || uploadData.image_token;

    console.log('File uploaded, token:', fileToken);

    // Step 2: Create image_to_model task with TripoSR (free tier)
    const quality = options?.quality === 'high' ? 'high' : 'fast';

    const taskPayload = {
      type: 'image_to_model',
      file: {
        type: 'jpg',
        file_token: fileToken,
      },
      model_version: 'v2.0-20240919', // TripoSR model
      ...(quality && { mode: quality }),
    };

    console.log('📤 [CREATE-MESH] Creating TripoSR job with payload:', JSON.stringify(taskPayload, null, 2));

    const tripoResponse = await fetch(`${tripoApiBase}/task`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tripoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskPayload),
    });

    console.log('📥 [CREATE-MESH] TripoSR API response status:', tripoResponse.status);

    if (!tripoResponse.ok) {
      const errorText = await tripoResponse.text();
      console.error('❌ [CREATE-MESH] TripoSR API error:', tripoResponse.status, errorText);

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
    console.log('📦 [CREATE-MESH] TripoSR full response:', JSON.stringify(data, null, 2));

    const taskId = data.data?.task_id || data.task_id;

    // Create job metadata for fallback tracking
    createJob(taskId, 'tripoSR', image);

    // Increment usage count on successful job creation
    incrementUsage(sessionId);

    console.log('✅ [CREATE-MESH] Job created successfully - taskId:', taskId, 'provider: tripoSR');

    // Return taskId and status
    return res.status(202).json({
      taskId,
      status: 'QUEUED',
      provider: 'tripoSR',
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
