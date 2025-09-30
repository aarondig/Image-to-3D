import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Simple endpoint to test if Tripo API key is valid
 * GET /api/test-key
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const tripoApiBase = process.env.TRIPO_API_BASE;
  const tripoApiKey = process.env.TRIPO_API_KEY;

  if (!tripoApiBase || !tripoApiKey) {
    return res.status(500).json({ error: 'Missing environment variables' });
  }

  try {
    // Test API key by making a simple request (list tasks or get balance)
    const response = await fetch(`${tripoApiBase}/user/balance`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tripoApiKey}`,
      },
    });

    const data = await response.json();

    return res.status(200).json({
      status: response.status,
      keyValid: response.ok,
      response: data,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
