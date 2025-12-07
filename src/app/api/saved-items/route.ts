import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/authOptions'
import type { Session, NextAuthOptions } from 'next-auth'

export async function GET() {
  try {
    const session = (await getServerSession(authOptions as NextAuthOptions)) as Session | null
    
    // In JWT mode, we don't store users in the database, so always use null
    const userId = null;
    console.log('👤 GET User ID (JWT mode):', userId);

    // Check if Prisma is available
    if (!prisma) {
      console.warn('⚠️ Prisma not available - returning empty array');
      return NextResponse.json([]);
    }

    const items = await prisma.savedItem.findMany({ 
      where: userId ? { userId } : { userId: null }, 
      orderBy: { id: 'desc' } 
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('GET /api/saved-items error:', error);
    // Return empty array instead of error when Prisma is unavailable
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    console.log('📥 POST /api/saved-items - Request received');
    
    const session = (await getServerSession(authOptions as NextAuthOptions)) as Session | null
    console.log('🔐 Session:', session ? 'Authenticated' : 'Not authenticated');
    
    // In JWT mode, we don't store users in the database, so always use null
    const userId = null;
    console.log('👤 User ID (JWT mode):', userId);

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json({ message: 'Invalid JSON in request body' }, { status: 400 });
    }

    console.log('📦 Request body:', { title: body.title, hasContent: !!body.content, hasImageUrl: !!body.imageUrl });
    console.log('📦 Full request body:', JSON.stringify(body, null, 2));
    
    const { title, content, imageUrl } = body;

    if (!title || !content) {
      console.log('❌ Missing required fields:', { title: !!title, content: !!content });
      return NextResponse.json({ message: 'Missing required fields: title and content are required' }, { status: 400 });
    }

    if (typeof title !== 'string') {
      console.log('❌ Invalid field types');
      return NextResponse.json({ message: 'Invalid field types: title must be a string' }, { status: 400 });
    }

    if (typeof content !== 'object' || !('video' in content) || !('post' in content) || !('info' in content)) {
      console.log('❌ Invalid content structure:', { contentType: typeof content, hasVideo: 'video' in (content || {}), hasPost: 'post' in (content || {}), hasInfo: 'info' in (content || {}) });
      return NextResponse.json({ message: 'Invalid content structure: content must have video, post, and info properties' }, { status: 400 });
    }

    console.log('💾 Attempting to save to database...');
    
    // Check if Prisma is available
    if (!prisma) {
      console.warn('⚠️ Prisma not available - cannot save item');
      return NextResponse.json({ 
        message: 'Database temporarily unavailable. Please try again later.' 
      }, { status: 503 });
    }
    
    // Build data object conditionally
    const dataToCreate: {
      title: string;
      video: string;
      post: string;
      info: string;
      imageUrl?: string | null;
      userId?: string | null;
    } = {
      title,
      video: content.video || '',
      post: content.post || '',
      info: content.info || ''
    };
    
    // Include imageUrl if provided
    if (imageUrl && imageUrl.trim() !== '') {
      dataToCreate.imageUrl = imageUrl;
    }
    
    if (userId !== null) {
      dataToCreate.userId = userId;
    }
    
    const newItem = await prisma.savedItem.create({ 
      data: dataToCreate
    });

    console.log('✅ Item saved successfully:', newItem.id);
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('❌ POST /api/saved-items error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error saving item';
    return NextResponse.json({ message: errorMessage, details: String(error) }, { status: 500 });
  }
}
