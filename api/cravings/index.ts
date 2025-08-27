import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth } from '../../lib/auth.js';
import { storage } from '../../lib/storage.js';
import { insertCravingEntrySchema } from '../../shared/schema.js';

async function handler(req: VercelRequest, res: VercelResponse) {
  const authUser = (req as any).user;

  if (req.method === 'GET') {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const entries = await storage.getCravingEntries(authUser.id, limit);
      res.status(200).json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch craving entries" });
    }
  } else if (req.method === 'POST') {
    try {
      const data = insertCravingEntrySchema.parse({
        ...req.body,
        userId: authUser.id,
      });
      const entry = await storage.createCravingEntry(data);
      res.status(201).json(entry);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Validation failed" });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}

export default withAuth(handler);
