import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAdminAuth } from '../lib/auth.js';
import { seedData } from '../lib/seed-data.js';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  try {
    await seedData();
    res.status(200).json({ message: "Données d'exemple créées avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création des données d'exemple" });
  }
}

export default withAdminAuth(handler);
