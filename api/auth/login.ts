import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthService, setAuthCookie } from '../../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const user = await AuthService.login(email, password);
    setAuthCookie(res, user);

    res.status(200).json({ user, message: 'Connexion réussie' });
  } catch (error) {
    res.status(401).json({
      message: error instanceof Error ? error.message : 'Erreur de connexion'
    });
  }
}
