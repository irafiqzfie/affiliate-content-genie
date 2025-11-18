import { NextResponse } from 'next/server';
import { getOperation, deleteOperation } from '../../operationStore';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const operationId = parts[parts.length - 1];
    const operation = getOperation(operationId);

    if (!operation) {
      return NextResponse.json({ message: 'Operation not found' }, { status: 404 });
    }
    
    const elapsedTime = Date.now() - operation.startTime;

    // Simulate a 35-second generation time
    if (elapsedTime > 35000) {
      deleteOperation(operationId); // Clean up
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
