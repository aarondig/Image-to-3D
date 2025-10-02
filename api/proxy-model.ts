import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Proxy endpoint to fetch GLB models from Tripo CDN
 * Bypasses CORS restrictions by proxying through our server
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // Validate it's a Tripo URL
  if (!url.startsWith('https://tripo-data.rg1.data.tripo3d.com/')) {
    return res.status(400).json({ error: 'Invalid URL - must be from Tripo CDN' });
  }

  try {
    // Fetch the GLB from Tripo
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch model' });
    }

    // Get the file as a buffer
    const buffer = await response.arrayBuffer();

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'model/gltf-binary');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Send the GLB file
    return res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Failed to proxy model',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
