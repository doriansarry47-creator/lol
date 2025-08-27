import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth } from '../../lib/auth.js';
import { storage } from '../../lib/storage.js';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const authUser = (req as any).user;

  try {
    const user = await storage.getUser(authUser.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password, ...userWithoutPassword } = user;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch user profile" });
  }
}

export default withAuth(handler);
