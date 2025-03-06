import { adminDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId, boosterCount } = await request.json();
    
    await adminDb.collection('collections').doc(userId).update({
      nbBooster: boosterCount
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
