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
    
    const session = (await getServerSession(authOptions as NextAuthOptions)) as Session | null
    
    // For development: use test user ID if not authenticated
    const userId = session?.user?.id || 'dev-user-localhost';
    
    if (!session && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const deleted = await prisma.scheduledPost.deleteMany({ where: { id, userId: userId } });
    if (deleted.count === 0) {
      return NextResponse.json({ message: 'Post not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: `Post ${id} deleted successfully` }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/scheduled-posts/[id] error:', error);
    return NextResponse.json({ message: 'Error deleting post' }, { status: 500 });
  }
}
