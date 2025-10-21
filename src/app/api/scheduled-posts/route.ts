import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/authOptions'
import type { Session, NextAuthOptions } from 'next-auth'

export async function GET() {
  try {
  const session = (await getServerSession(authOptions as NextAuthOptions)) as Session | null
  if (!session) return NextResponse.json([])

  const posts = await prisma.scheduledPost.findMany({ where: { userId: session.user?.id as string }, orderBy: { scheduledTime: 'asc' } });
    return NextResponse.json(posts);
  } catch (error) {
    console.error('GET /api/scheduled-posts error:', error);
    return NextResponse.json({ message: 'Error fetching scheduled posts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
  const session = (await getServerSession(authOptions as NextAuthOptions)) as Session | null
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const body = await request.json();
    const { platform, scheduledTime, imageUrl, caption, status } = body;

    if (!platform || !scheduledTime || !imageUrl || !caption || !status) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const newPost = await prisma.scheduledPost.create({ data: {
      userId: session.user?.id as string,
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
