import { NextResponse } from 'next/server';
import { generateGuestToken } from '@/actions/stream.actions';

export async function GET() {
  try {
    const { token, userId } = await generateGuestToken();
    return NextResponse.json({ token, userId });
  } catch (error) {
    console.error('Error generating guest token:', error);
    return NextResponse.json({ error: 'Failed to generate guest token' }, { status: 500 });
  }
}