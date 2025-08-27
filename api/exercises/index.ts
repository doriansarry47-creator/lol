import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAdminAuth } from '../../lib/auth.js';
import { storage } from '../../lib/storage.js';
import { insertExerciseSchema } from '../../shared/schema.js';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const exercises = await storage.getExercises();
      res.status(200).json(exercises);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des exercices" });
    }
  } else if (req.method === 'POST') {
    await withAdminAuth(async (req, res) => {
      try {
        const data = insertExerciseSchema.parse(req.body);
        const exercise = await storage.createExercise(data);
        res.status(201).json(exercise);
      } catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : "Validation échouée" });
      }
    })(req, res);
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}

export default handler;
