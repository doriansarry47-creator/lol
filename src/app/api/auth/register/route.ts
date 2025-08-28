import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users, insertUserSchema } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName, role } = insertUserSchema.pick({
      email: true,
      password: true,
      firstName: true,
      lastName: true,
      role: true
    }).parse(body);

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return new NextResponse('Un utilisateur avec cet email existe déjà', { status: 409 });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create the user and their initial stats
    const newUser = await db.transaction(async (tx) => {
        const [createdUser] = await tx.insert(users).values({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: role || 'patient',
        }).returning();

        // Initialize stats for the new user, as was done in the legacy code
        await tx.insert(users).values({ id: createdUser.id });

        return createdUser;
    });

    // Don't return the password hash
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    // Zod errors can be handled more gracefully, but for now, a generic error is fine.
    return new NextResponse('Erreur lors de l\'inscription', { status: 500 });
  }
}
