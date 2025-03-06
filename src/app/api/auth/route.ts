import { NextResponse } from 'next/server';
import { adminAuth } from '@/src/lib/firebaseAdmin';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    return new NextResponse(JSON.stringify({ sessionCookie }), {
      headers: {
        'Set-Cookie': `session=${sessionCookie}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${expiresIn}`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
