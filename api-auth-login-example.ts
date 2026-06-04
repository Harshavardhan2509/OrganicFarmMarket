// @ts-nocheck
// app/api/auth/login/route-example.ts
// Example API route for user login

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// This is a simplified example - use with proper error handling

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // TODO: Implement with your database
    // 1. Find user by email
    // const user = await prisma.user.findUnique({ where: { email } });
    // 
    // 2. Check password
    // if (!user || !await bcrypt.compare(password, user.password)) {
    //   return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    // }
    //
    // 3. Create session/JWT token
    // const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    //
    // 4. Return user data
    // return NextResponse.json({
    //   user: { id: user.id, email: user.email, name: user.name, role: user.role },
    //   token
    // });

    return NextResponse.json({
      message: 'TODO: Implement login with your database',
      error: 'Not implemented yet',
    }, { status: 501 });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
