import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/authOptions'
import type { Session, NextAuthOptions } from 'next-auth'

export async function GET() {
  try {
    const session = (await getServerSession(authOptions as NextAuthOptions)) as Session | null
  
    // Require authentication
    if (!session?.user?.id) {
      console.log('❌ GET /api/scheduled-posts: Unauthorized (no user ID)');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('👤 GET User ID:', userId);

    // Check if Prisma is available
    if (!prisma) {
      console.warn('⚠️ Prisma not available - returning empty array');
      return NextResponse.json([]);
    }

    // Only return posts belonging to this user
    const posts = await prisma.scheduledPost.findMany({ 
      where: { userId }, 
      orderBy: { scheduledTime: 'asc' } 
    });
    console.log(`✅ Retrieved ${posts.length} scheduled posts for user ${userId}`);
    return NextResponse.json(posts);
  } catch (error) {
    console.error('GET /api/scheduled-posts error:', error);
    // Return empty array instead of error when Prisma is unavailable
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    console.log('📥 POST /api/scheduled-posts - Request received');
    
    const session = (await getServerSession(authOptions as NextAuthOptions)) as Session | null
    console.log('🔐 Session:', session ? 'Authenticated' : 'Not authenticated');
    
    // Require authentication
    if (!session?.user?.id) {
      console.log('❌ POST /api/scheduled-posts: Unauthorized (no user ID)');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('👤 User ID:', userId);

    const body = await request.json();
    console.log('📦 Request body:', { platform: body.platform, scheduledTime: body.scheduledTime, status: body.status, hasAffiliateLink: !!body.affiliateLink, hasImage: !!body.imageUrl });
    
    const { platform, scheduledTime, imageUrl, caption, affiliateLink, status } = body;

    if (!platform || !scheduledTime || !caption || !status) {
      console.log('❌ Missing required fields');
      return NextResponse.json({ message: 'Missing required fields: platform, scheduledTime, caption, and status are required' }, { status: 400 });
    }

    console.log('💾 Attempting to save to database...');
    
    // Check if Prisma is available
    if (!prisma) {
      console.warn('⚠️ Prisma not available - cannot schedule post');
      return NextResponse.json({ 
        message: 'Database temporarily unavailable. Please try again later.' 
      }, { status: 503 });
    }
    
    // Build data object with user ID (required for per-user isolation)
    const postData: {
      platform: string;
      scheduledTime: Date;
      caption: string;
      status: string;
      userId: string;
      imageUrl?: string;
      affiliateLink?: string;
    } = {
      platform,
      scheduledTime: new Date(scheduledTime),
      caption,
      status,
      userId // Always include userId for per-user data isolation
    };

    // Only add imageUrl if it exists and is not null
    if (imageUrl && imageUrl !== null) {
      postData.imageUrl = imageUrl;
    }

    // Only add affiliateLink if it exists
    if (affiliateLink) {
      postData.affiliateLink = affiliateLink;
    }

    const newPost = await prisma.scheduledPost.create({ data: postData });

    // Log analytics event (immutable, append-only)
    const now = new Date();
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventType: 'content_posted',
        platform, // The platform where content is posted
        timestamp: now,
        monthKey: now.toISOString().substring(0, 7), // YYYY-MM
        yearKey: now.toISOString().substring(0, 4),   // YYYY
      },
    });

    console.log('✅ Post scheduled successfully:', newPost.id);
    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('❌ POST /api/scheduled-posts error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Error scheduling post', details: errorMessage }, { status: 500 });
  }
}
