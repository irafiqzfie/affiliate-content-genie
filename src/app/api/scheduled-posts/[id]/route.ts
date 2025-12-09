import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/authOptions'
import type { Session, NextAuthOptions } from 'next-auth'

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const idStr = parts[parts.length - 1];
    const id = parseInt(idStr || '', 10);
    
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
    }
    
    const session = (await getServerSession(authOptions as NextAuthOptions)) as Session | null
    
    // Require authentication - no development bypass for security
    if (!session?.user?.id) {
      console.log('❌ DELETE /api/scheduled-posts/[id]: Unauthorized (no user ID)');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log(`🗑️  Attempting to delete scheduled post ${id} for user: ${userId}`);

    // Check if Prisma is available
    if (!prisma || typeof prisma.scheduledPost === 'undefined') {
      console.warn('⚠️ Prisma not available - scheduled posts are in-memory only');
      return NextResponse.json({ message: 'Database not available - posts are in-memory only' }, { status: 503 });
    }

    // Only delete if the post belongs to this user (enforce data isolation)
    const deleted = await prisma.scheduledPost.deleteMany({ 
      where: { 
        id,
        userId // Critical: only delete if post belongs to authenticated user
      } 
    });
    
    if (deleted.count === 0) {
      console.log(`⚠️  Post ${id} not found or unauthorized for user ${userId}`);
      return NextResponse.json({ message: 'Post not found or unauthorized' }, { status: 404 });
    }

    console.log(`✅ Post ${id} deleted successfully for user ${userId}`);
    return NextResponse.json({ message: `Post ${id} deleted successfully` }, { status: 200 });
  } catch (error) {
    console.error('❌ DELETE /api/scheduled-posts/[id] error:', error);
    return NextResponse.json({ message: 'Error deleting post' }, { status: 500 });
  }
}
