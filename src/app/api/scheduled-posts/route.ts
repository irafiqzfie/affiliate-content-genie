import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/authOptions'
import type { Session, NextAuthOptions } from 'next-auth'

export async function GET() {
  try {
    const session = (await getServerSession(authOptions as NextAuthOptions)) as Session | null
  
    // For JWT-only sessions, all posts have null userId
    const userId = null;
    console.log('👤 GET User ID (JWT mode):', userId);

    // Check if Prisma is available
    if (!prisma) {
      console.warn('⚠️ Prisma not available - returning empty array');
      return NextResponse.json([]);
    }

    // Get all posts with null userId (JWT mode posts)
    const posts = await prisma.scheduledPost.findMany({ 
      where: { userId: null }, 
      orderBy: { scheduledTime: 'asc' } 
    });
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
    
    // For JWT-only sessions, userId doesn't exist in database, so set to null
    const userId = null;
    console.log('👤 User ID (JWT mode):', userId);

    const body = await request.json();
    console.log('📦 Request body:', { platform: body.platform, scheduledTime: body.scheduledTime, status: body.status, hasAffiliateLink: !!body.affiliateLink });
    
    const { platform, scheduledTime, imageUrl, caption, affiliateLink, status } = body;

    if (!platform || !scheduledTime || !imageUrl || !caption || !status) {
      console.log('❌ Missing required fields');
      return NextResponse.json({ message: 'Missing required fields: platform, scheduledTime, imageUrl, caption, and status are required' }, { status: 400 });
    }

    console.log('💾 Attempting to save to database...');
    
    // Check if Prisma is available
    if (!prisma) {
      console.warn('⚠️ Prisma not available - cannot schedule post');
      return NextResponse.json({ 
        message: 'Database temporarily unavailable. Please try again later.' 
      }, { status: 503 });
    }
    
    const newPost = await prisma.scheduledPost.create({ data: {
      platform,
      scheduledTime: new Date(scheduledTime),
      imageUrl,
      caption,
      affiliateLink: affiliateLink || null,
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
