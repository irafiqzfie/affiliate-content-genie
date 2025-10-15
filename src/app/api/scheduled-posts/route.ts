import { NextResponse } from 'next/server';

// Lightweight ScheduledPost type used by this mock API
type ScheduledPost = {
  id: number;
  platform: 'Facebook' | 'Threads';
  scheduledTime: string;
  imageUrl: string;
  caption: string;
  status: 'Scheduled';
};

// This is a mock in-memory store. In a real app, use a database.
const scheduledPosts: ScheduledPost[] = [];
let nextId = 1;

export async function GET() {
  try {
    // Return a copy to avoid mutation
    return NextResponse.json([...scheduledPosts]);
  } catch (error) {
    console.error('GET /api/scheduled-posts error:', error);
    return NextResponse.json({ message: 'Error fetching scheduled posts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { platform, scheduledTime, imageUrl, caption, status } = body;

    if (!platform || !scheduledTime || !imageUrl || !caption || !status) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    const newPost = {
      id: nextId++,
      platform,
      scheduledTime,
      imageUrl,
      caption,
      status
    };
    
    scheduledPosts.push(newPost);
    
    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('POST /api/scheduled-posts error:', error);
    return NextResponse.json({ message: 'Error scheduling post' }, { status: 500 });
  }
}
