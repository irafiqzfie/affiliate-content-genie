import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const idStr = parts[parts.length - 1];
    const id = parseInt(idStr || '', 10);

    const deleted = await prisma.scheduledPost.deleteMany({ where: { id } });
    if (deleted.count === 0) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ message: `Post ${id} deleted successfully` }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/scheduled-posts/[id] error:', error);
    return NextResponse.json({ message: 'Error deleting post' }, { status: 500 });
  }
}
