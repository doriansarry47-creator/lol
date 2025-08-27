import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAdminAuth } from '../../../lib/auth.js';
import { storage } from '../../../lib/storage.js';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  try {
    const content = await storage.getAllPsychoEducationContent();
    res.status(200).json(content);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch all psycho-education content" });
  }
}

export default withAdminAuth(handler);
