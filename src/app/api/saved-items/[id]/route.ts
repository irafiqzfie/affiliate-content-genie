import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const pathnameParts = url.pathname.split('/').filter(Boolean);
    const idStr = pathnameParts[pathnameParts.length - 1];
    const id = parseInt(idStr || '', 10);

    const deleted = await prisma.savedItem.deleteMany({ where: { id } });
    if (deleted.count === 0) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: `Item ${id} deleted successfully` }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/saved-items/[id] error:', error);
    return NextResponse.json({ message: 'Error deleting item' }, { status: 500 });
  }
}
