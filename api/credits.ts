import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parseCookies, generateSessionId, enableCors, getUsageForSession } from './_shared.js';

/**
 * GET /api/credits
 * Returns remaining credits for the current session
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  if (enableCors(req, res)) {
    return; // Preflight request handled
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
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

    // Get usage for this session
    const usage = getUsageForSession(sessionId);

    // Daily limit
    const dailyLimit = 3;
    const remaining = Math.max(0, dailyLimit - usage);

    return res.status(200).json({
      remainingMesh: remaining,
      dailyMeshLimit: dailyLimit,
      usedToday: usage,
    });
  } catch (error) {
    console.error('Error in credits endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
