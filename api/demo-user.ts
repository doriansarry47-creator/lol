import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../lib/storage.js';
import { AuthService } from '../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  try {
    const email = "demo@example.com";
    let user = await storage.getUserByEmail(email);

    if (!user) {
      const hashedPassword = await AuthService.hashPassword("demo123");
      user = await storage.createUser({
        email: email,
        password: hashedPassword,
        firstName: "Utilisateur",
        lastName: "Demo",
        role: "patient",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to create demo user" });
  }
}
