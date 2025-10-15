import { NextResponse } from 'next/server';

// This is a mock in-memory store. In a real app, use a database.
let scheduledPosts: any[] = [];

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    const initialLength = scheduledPosts.length;
    scheduledPosts = scheduledPosts.filter(post => post.id !== id);

    if (scheduledPosts.length === initialLength) {
        return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ message: `Post ${id} deleted successfully` }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/scheduled-posts/[id] error:', error);
    return NextResponse.json({ message: 'Error deleting post' }, { status: 500 });
  }
}
