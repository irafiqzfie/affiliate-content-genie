import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const posts = await prisma.scheduledPost.findMany({ orderBy: { scheduledTime: 'asc' } });
    return NextResponse.json(posts);
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

    const newPost = await prisma.scheduledPost.create({ data: {
      platform,
      scheduledTime: new Date(scheduledTime),
      imageUrl,
      caption,
      status
    }});

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('POST /api/scheduled-posts error:', error);
    return NextResponse.json({ message: 'Error scheduling post' }, { status: 500 });
  }
}
