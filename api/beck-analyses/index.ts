import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth } from '../../lib/auth.js';
import { storage } from '../../lib/storage.js';
import { insertBeckAnalysisSchema } from '../../shared/schema.js';

async function handler(req: VercelRequest, res: VercelResponse) {
  const authUser = (req as any).user;

  if (req.method === 'GET') {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const analyses = await storage.getBeckAnalyses(authUser.id, limit);
      return res.status(200).json(analyses);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch Beck analyses" });
    }
  }

  if (req.method === 'POST') {
    try {
      const data = insertBeckAnalysisSchema.parse({
        ...req.body,
        userId: authUser.id,
      });
      const analysis = await storage.createBeckAnalysis(data);
      return res.status(201).json(analysis);
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : "Validation failed" });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}

export default withAuth(handler);
