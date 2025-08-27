import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAdminAuth } from '../../../lib/auth.js';
import { storage } from '../../../lib/storage.js';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const exercises = await storage.getAllExercises();
    return res.status(200).json(exercises);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch all exercises" });
  }
}

export default withAdminAuth(handler);
