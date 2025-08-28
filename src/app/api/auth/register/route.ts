import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { ZodError } from 'zod';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const newUser = await AuthService.register(body);

    // Don't return the password hash
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error) {
    console.error('Registration API Error:', error);

    if (error instanceof ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }

    if (error instanceof Error) {
        return new NextResponse(error.message, { status: 400 });
    }

    return new NextResponse('Erreur lors de l\'inscription', { status: 500 });
  }
}
