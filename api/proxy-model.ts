import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Proxy endpoint to fetch 3D models from Tripo CDN
 * Bypasses CORS restrictions by proxying through our server
 * Supports format parameter to convert GLB URLs to USDZ
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url, format } = req.query;

  console.log('[proxy-model] Request received', { url, format, query: req.query });

  if (!url || typeof url !== 'string') {
    console.error('[proxy-model] Missing or invalid url parameter', { url, type: typeof url });
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // URL will be decoded by Vercel automatically, but let's ensure it's properly decoded
  const decodedUrl = decodeURIComponent(url);

  console.log('[proxy-model] Decoded URL', { original: url, decoded: decodedUrl });

  // Validate it's a Tripo URL
  if (!decodedUrl.startsWith('https://tripo-data.rg1.data.tripo3d.com/')) {
    console.error('[proxy-model] Invalid URL - not from Tripo CDN', { url: decodedUrl });
    return res.status(400).json({ error: 'Invalid URL - must be from Tripo CDN' });
  }

  // Convert GLB URL to USDZ if requested
  let fetchUrl = decodedUrl;
  let contentType = 'model/gltf-binary';

  if (format === 'usdz') {
    // Replace .glb with .usdz in the URL
    fetchUrl = decodedUrl.replace(/\.glb$/i, '.usdz');
    contentType = 'model/vnd.usdz+zip';
    console.log('[proxy-model] Converting to USDZ format', { originalUrl: decodedUrl, usdzUrl: fetchUrl });
  }

  console.log('[proxy-model] Fetching from Tripo CDN', { fetchUrl, format });

  try {
    // Fetch the model from Tripo
    const response = await fetch(fetchUrl);

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
    console.log('[proxy-model] Buffer received', { size: buffer.byteLength, format });

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    console.log('[proxy-model] Sending model to client', { format, contentType });
    // Send the model file
    return res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('[proxy-model] Error:', error);
    return res.status(500).json({
      error: 'Failed to proxy model',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
