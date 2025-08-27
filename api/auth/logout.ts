import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clearAuthCookie } from '../../lib/auth.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  clearAuthCookie(res);
  res.status(200).json({ message: 'Déconnexion réussie' });
}
