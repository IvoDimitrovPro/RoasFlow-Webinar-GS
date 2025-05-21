import { NextResponse } from 'next/server';
import { tokenProvider } from '@/actions/stream.actions';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req: Request) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = await tokenProvider();
    return NextResponse.json({ token, userId });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
