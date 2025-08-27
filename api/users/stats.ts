import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth } from '../../lib/auth.js';
import { storage } from '../../lib/storage.js';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  const authUser = (req as any).user;

  try {
    const stats = await storage.getUserStats(authUser.id);
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user stats" });
  }
}

export default withAuth(handler);
