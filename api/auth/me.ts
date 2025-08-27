import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth } from '../../lib/auth.js';
import { storage } from '../../lib/storage.js';

async function handler(req: VercelRequest, res: VercelResponse) {
  // The user object is attached to the request by the withAuth middleware
  const authUser = (req as any).user;

  try {
    // We might want to fetch the full user object from the DB
    const user = await storage.getUser(authUser.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    // Omit the password hash before sending
    const { password, ...userWithoutPassword } = user;
    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
  }
}

export default withAuth(handler);
