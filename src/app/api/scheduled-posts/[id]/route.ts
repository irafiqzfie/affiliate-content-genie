import { NextResponse } from 'next/server';

// Reuse ScheduledPost type for clarity
type ScheduledPost = {
  id: number;
  platform: 'Facebook' | 'Threads';
  scheduledTime: string;
  imageUrl: string;
  caption: string;
  status: 'Scheduled';
};

// This is a mock in-memory store. In a real app, use a database.
let scheduledPosts: ScheduledPost[] = [];

export async function DELETE(request: Request) {
  try {
    // Parse id from the request URL to avoid typing mismatches with Next's validator.
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const idStr = parts[parts.length - 1];
    const id = parseInt(idStr || '', 10);
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
