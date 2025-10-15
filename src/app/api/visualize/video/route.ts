import { NextResponse } from 'next/server';
import { setOperation } from './status/[id]/route';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ message: 'Prompt is required' }, { status: 400 });
    }

    // In a real app, this would start the VEO generation process.
    // Here, we'll generate a mock operation ID and store its start time.
    const operationId = `mock-op-${Date.now()}`;
    
    setOperation(operationId);

    return NextResponse.json({ operationId });

  } catch (error) {
    console.error('Video generation start error:', error);
    return NextResponse.json({ message: 'Error starting video generation' }, { status: 500 });
  }
}
