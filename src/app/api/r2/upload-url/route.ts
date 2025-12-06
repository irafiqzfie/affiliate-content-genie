import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import { generatePresignedUploadUrl } from '@/lib/r2';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fileName, contentType, folder = 'user-content' } = body;

    // Validate inputs
    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'Missing fileName or contentType' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Generate presigned URL
    const result = await generatePresignedUploadUrl({
      folder,
      userId: session.user.id,
      fileName,
      contentType,
      expiresIn: 3600, // 1 hour
    });

    console.log('✅ Generated presigned URL:', {
      fileKey: result.fileKey,
      publicUrl: result.publicUrl,
    });

    return NextResponse.json({
      success: true,
      uploadUrl: result.uploadUrl,
      fileKey: result.fileKey,
      publicUrl: result.publicUrl,
    });

  } catch (error) {
    console.error('❌ Error generating presigned URL:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate upload URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
