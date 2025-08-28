import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users, userStats, type InsertUser } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export class AuthService {
  static async register(userData: Omit<InsertUser, 'id' | 'password'> & { password?: string }) {
    if (!userData.email || !userData.password) {
      throw new Error('Email and password are required');
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, userData.email),
    });

    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Create the user
    const [newUser] = await db.insert(users).values({
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || 'patient',
    }).returning();

    if (!newUser) {
        throw new Error('Failed to create user.');
    }

    // Initialize stats for the new user
    await db.insert(userStats).values({
      userId: newUser.id,
    });

    return newUser;
  }
}
