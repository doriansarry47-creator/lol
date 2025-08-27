import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthService, setAuthCookie } from '../../lib/auth.js';
import { insertUserSchema } from '../../shared/schema.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const userData = insertUserSchema.parse(req.body);
    const user = await AuthService.register(userData);
    setAuthCookie(res, user);

    res.status(200).json({ user, message: 'Inscription réussie' });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "Erreur lors de l'inscription"
    });
  }
}
