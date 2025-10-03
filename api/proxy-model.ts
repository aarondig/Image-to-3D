import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Proxy endpoint to fetch GLB models from Tripo CDN
 * Bypasses CORS restrictions by proxying through our server
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.query;

  console.log('[proxy-model] Request received', { url, query: req.query });

  if (!url || typeof url !== 'string') {
    console.error('[proxy-model] Missing or invalid url parameter', { url, type: typeof url });
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // Validate it's a Tripo URL
  if (!url.startsWith('https://tripo-data.rg1.data.tripo3d.com/')) {
    console.error('[proxy-model] Invalid URL - not from Tripo CDN', { url });
    return res.status(400).json({ error: 'Invalid URL - must be from Tripo CDN' });
  }

  console.log('[proxy-model] Fetching from Tripo CDN', { url });

  try {
    // Fetch the GLB from Tripo
    const response = await fetch(url);

    console.log('[proxy-model] Tripo CDN response', {
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length')
    });

    if (!response.ok) {
      console.error('[proxy-model] Tripo CDN returned error', { status: response.status, statusText: response.statusText });
      return res.status(response.status).json({ error: `Failed to fetch model: ${response.statusText}` });
    }

    // Get the file as a buffer
    const buffer = await response.arrayBuffer();
    console.log('[proxy-model] Buffer received', { size: buffer.byteLength });

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'model/gltf-binary');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    console.log('[proxy-model] Sending GLB to client');
    // Send the GLB file
    return res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('[proxy-model] Error:', error);
    return res.status(500).json({
      error: 'Failed to proxy model',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
