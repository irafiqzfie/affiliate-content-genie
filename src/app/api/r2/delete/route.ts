import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import { deleteFromR2, extractFileKey, isR2Url } from '@/lib/r2';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url, fileKey } = body;

    let keyToDelete = fileKey;

    // If URL provided, extract file key
    if (url && !fileKey) {
      if (!isR2Url(url)) {
        return NextResponse.json(
          { error: 'Not an R2 URL' },
          { status: 400 }
        );
      }
      keyToDelete = extractFileKey(url);
    }

    if (!keyToDelete) {
      return NextResponse.json(
        { error: 'No file key or URL provided' },
        { status: 400 }
      );
    }

    // Security: Ensure user can only delete their own files
    if (!keyToDelete.includes(session.user.id) && !keyToDelete.startsWith('generated/') && !keyToDelete.startsWith('placeholders/')) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this file' },
        { status: 403 }
      );
    }

    await deleteFromR2(keyToDelete);

    console.log('✅ Deleted from R2:', keyToDelete);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error) {
    console.error('❌ Delete error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
