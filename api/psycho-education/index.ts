import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAdminAuth } from '../../lib/auth.js';
import { storage } from '../../lib/storage.js';
import { insertPsychoEducationContentSchema } from '../../shared/schema.js';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const content = await storage.getPsychoEducationContent();
      res.status(200).json(content);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération du contenu" });
    }
  } else if (req.method === 'POST') {
    await withAdminAuth(async (req, res) => {
      try {
        const data = insertPsychoEducationContentSchema.parse(req.body);
        const content = await storage.createPsychoEducationContent(data);
        res.status(201).json(content);
      } catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : "Validation échouée" });
      }
    })(req, res);
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}

export default handler;
