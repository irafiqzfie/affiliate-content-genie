import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/authOptions'
import type { Session, NextAuthOptions } from 'next-auth'

export async function GET() {
  try {
  const session = (await getServerSession(authOptions as NextAuthOptions)) as Session | null
  
  // Use authenticated user ID or null for unauthenticated users
  const userId = session?.user?.id || null;
  console.log('👤 GET User ID:', userId);

  const posts = await prisma.scheduledPost.findMany({ 
    where: userId ? { userId } : { userId: null }, 
    orderBy: { scheduledTime: 'asc' } 
  });
    return NextResponse.json(posts);
  } catch (error) {
    console.error('GET /api/scheduled-posts error:', error);
    return NextResponse.json({ message: 'Error fetching scheduled posts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('📥 POST /api/scheduled-posts - Request received');
    
    const session = (await getServerSession(authOptions as NextAuthOptions)) as Session | null
    console.log('🔐 Session:', session ? 'Authenticated' : 'Not authenticated');
    
    // Use authenticated user ID or null for unauthenticated users
    const userId = session?.user?.id || null;
    console.log('👤 User ID:', userId);

    const body = await request.json();
    console.log('📦 Request body:', { platform: body.platform, scheduledTime: body.scheduledTime, status: body.status });
    
    const { platform, scheduledTime, imageUrl, caption, status } = body;

    if (!platform || !scheduledTime || !imageUrl || !caption || !status) {
      console.log('❌ Missing required fields');
      return NextResponse.json({ message: 'Missing required fields: platform, scheduledTime, imageUrl, caption, and status are required' }, { status: 400 });
    }

    console.log('💾 Attempting to save to database...');
    const newPost = await prisma.scheduledPost.create({ data: {
      userId: userId,
      platform,
      scheduledTime: new Date(scheduledTime),
      imageUrl,
      caption,
      status
    }});

    console.log('✅ Post scheduled successfully:', newPost.id);
    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('❌ POST /api/scheduled-posts error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Error scheduling post', details: errorMessage }, { status: 500 });
  }
}
