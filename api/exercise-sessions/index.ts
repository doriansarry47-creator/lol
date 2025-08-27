import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth } from '../../lib/auth.js';
import { storage } from '../../lib/storage.js';
import { insertExerciseSessionSchema } from '../../shared/schema.js';

async function handler(req: VercelRequest, res: VercelResponse) {
  const authUser = (req as any).user;

  if (req.method === 'GET') {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const sessions = await storage.getExerciseSessions(authUser.id, limit);
      res.status(200).json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exercise sessions" });
    }
  } else if (req.method === 'POST') {
    try {
      const data = insertExerciseSessionSchema.parse({
        ...req.body,
        userId: authUser.id,
      });
      const session = await storage.createExerciseSession(data);
      res.status(201).json(session);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Validation failed" });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}

export default withAuth(handler);
