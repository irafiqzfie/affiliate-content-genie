import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/authOptions'
import type { Session, NextAuthOptions } from 'next-auth'

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const pathnameParts = url.pathname.split('/').filter(Boolean);
    const idStr = pathnameParts[pathnameParts.length - 1];
    const id = parseInt(idStr || '', 10);
    
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
    }
    
    const session = (await getServerSession(authOptions as NextAuthOptions)) as Session | null;
    
    if (!session?.user?.id) {
      console.log('❌ PUT /api/saved-items/[id]: Unauthorized (no user ID)');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log(`🔄 Updating saved item ${id} for user: ${userId}`);

    if (!prisma) {
      console.warn('⚠️ Prisma not available - cannot update item');
      return NextResponse.json({ 
        message: 'Database temporarily unavailable. Please try again later.' 
      }, { status: 503 });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json({ message: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { title, content, imageUrl } = body;

    if (!title || !content) {
      return NextResponse.json({ message: 'Missing required fields: title and content are required' }, { status: 400 });
    }

    if (typeof content !== 'object' || !('video' in content) || !('post' in content) || !('info' in content)) {
      return NextResponse.json({ message: 'Invalid content structure: content must have video, post, and info properties' }, { status: 400 });
    }

    // Verify the item exists and belongs to this user
    const existingItem = await prisma.savedItem.findFirst({
      where: { id, userId }
    });

    if (!existingItem) {
      console.log(`⚠️ Item ${id} not found or unauthorized for user ${userId}`);
      return NextResponse.json({ message: 'Item not found or unauthorized' }, { status: 404 });
    }

    // Update the item (preserve creation timestamp, update content)
    const dataToUpdate: {
      title: string;
      video: string;
      post: string;
      info: string;
      imageUrl?: string | null;
    } = {
      title,
      video: content.video || '',
      post: content.post || '',
      info: content.info || '',
    };

    if (imageUrl !== undefined) {
      dataToUpdate.imageUrl = imageUrl && imageUrl.trim() !== '' ? imageUrl : null;
    }

    const updatedItem = await prisma.savedItem.update({
      where: { id },
      data: dataToUpdate
    });

    console.log('✅ Item updated successfully:', updatedItem.id);
    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error) {
    console.error('❌ PUT /api/saved-items/[id] error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error updating item';
    return NextResponse.json({ message: errorMessage, details: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const pathnameParts = url.pathname.split('/').filter(Boolean);
    const idStr = pathnameParts[pathnameParts.length - 1];
    const id = parseInt(idStr || '', 10);
    
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
    }
    
    const session = (await getServerSession(authOptions as NextAuthOptions)) as Session | null;
    
    // Require authentication - no development bypass for security
    if (!session?.user?.id) {
      console.log('❌ DELETE /api/saved-items/[id]: Unauthorized (no user ID)');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log(`🗑️  Attempting to delete saved item ${id} for user: ${userId}`);

    // Check if Prisma is available
    if (!prisma || typeof prisma.savedItem === 'undefined') {
      console.warn('⚠️ Prisma not available - saved items are in-memory only');
      return NextResponse.json({ message: 'Database not available - items are in-memory only' }, { status: 503 });
    }

    // Only delete if the item belongs to this user (enforce data isolation)
    const deleted = await prisma.savedItem.deleteMany({ 
      where: { 
        id,
        userId // Critical: only delete if item belongs to authenticated user
      } 
    });
    
    if (deleted.count === 0) {
      console.log(`⚠️  Item ${id} not found or unauthorized for user ${userId}`);
      return NextResponse.json({ message: 'Item not found or unauthorized' }, { status: 404 });
    }

    console.log(`✅ Item ${id} deleted successfully for user ${userId}`);
    return NextResponse.json({ message: `Item ${id} deleted successfully` }, { status: 200 });
  } catch (error) {
    console.error('❌ DELETE /api/saved-items/[id] error:', error);
    return NextResponse.json({ 
      message: 'Error deleting item',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
