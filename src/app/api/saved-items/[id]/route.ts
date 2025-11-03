import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/authOptions'
import type { Session, NextAuthOptions } from 'next-auth'

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
    
    // Development fallback: allow deletion without auth in local dev
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!session && !isDev) {
      console.log('❌ DELETE /api/saved-items/[id]: Unauthorized (no session)');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session?.user?.id || 'dev-user-localhost';
    console.log(`🗑️  Attempting to delete saved item ${id} for user: ${userId}`);

    const deleted = await prisma.savedItem.deleteMany({ where: { id, userId } });
    
    if (deleted.count === 0) {
      console.log(`⚠️  Item ${id} not found or unauthorized for user ${userId}`);
      return NextResponse.json({ message: 'Item not found or unauthorized' }, { status: 404 });
    }

    console.log(`✅ Item ${id} deleted successfully`);
    return NextResponse.json({ message: `Item ${id} deleted successfully` }, { status: 200 });
  } catch (error) {
    console.error('❌ DELETE /api/saved-items/[id] error:', error);
    return NextResponse.json({ 
      message: 'Error deleting item',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
