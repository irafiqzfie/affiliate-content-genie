import { NextResponse } from 'next/server';

// In-memory store to track video generation status
const operationStore = new Map<string, { startTime: number }>();

export function setOperation(id: string) {
    operationStore.set(id, { startTime: Date.now() });
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const operationId = params.id;
    const operation = operationStore.get(operationId);

    if (!operation) {
      return NextResponse.json({ message: 'Operation not found' }, { status: 404 });
    }
    
    const elapsedTime = Date.now() - operation.startTime;

    // Simulate a 35-second generation time
    if (elapsedTime > 35000) {
      operationStore.delete(operationId); // Clean up
      return NextResponse.json({
        done: true,
        // Use a placeholder video
        videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
      });
    } else {
      return NextResponse.json({ done: false });
    }
  } catch (error) {
    console.error('Video status error:', error);
    return NextResponse.json({ message: 'Error checking video status' }, { status: 500 });
  }
}
