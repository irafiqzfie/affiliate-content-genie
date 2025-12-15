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
      console.log('❌ GET /api/saved-items: Unauthorized (no user ID)');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('👤 GET User ID:', userId);

    // Check if Prisma is available
    if (!prisma) {
      console.warn('⚠️ Prisma not available - returning empty array');
      return NextResponse.json([]);
    }

    // Only return items belonging to this user
    const items = await prisma.savedItem.findMany({ 
      where: { userId }, 
      orderBy: { id: 'desc' } 
    });
    console.log(`✅ Retrieved ${items.length} saved items for user ${userId}`);
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
    
    // Require authentication
    if (!session?.user?.id) {
      console.log('❌ POST /api/saved-items: Unauthorized (no user ID)');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('👤 User ID:', userId);

    // Check if Prisma is available first
    if (!prisma) {
      console.warn('⚠️ Prisma not available - cannot save item');
      return NextResponse.json({ 
        message: 'Database temporarily unavailable. Please try again later.' 
      }, { status: 503 });
    }

    // Verify the user exists in the database
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!userExists) {
      console.error('❌ User not found in database:', userId);
      return NextResponse.json({ 
        message: 'User session is invalid. Please sign out and sign in again.',
        details: 'User ID from session does not exist in database'
      }, { status: 401 });
    }

    console.log('✅ User verified in database');

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
    
    // Build data object with user ID (required for per-user isolation)
    const dataToCreate: {
      title: string;
      video: string;
      post: string;
      info: string;
      imageUrl?: string | null;
      userId: string;
    } = {
      title,
      video: content.video || '',
      post: content.post || '',
      info: content.info || '',
      userId // Always include userId for per-user data isolation
    };
    
    // Include imageUrl if provided
    if (imageUrl && imageUrl.trim() !== '') {
      dataToCreate.imageUrl = imageUrl;
    }
    
    try {
      const newItem = await prisma.savedItem.create({ 
        data: dataToCreate
      });

      // Log analytics event (immutable, append-only)
      const now = new Date();
      await prisma.analyticsEvent.create({
        data: {
          userId,
          eventType: 'content_generated',
          platform: null, // Generated content has no platform yet
          timestamp: now,
          monthKey: now.toISOString().substring(0, 7), // YYYY-MM
          yearKey: now.toISOString().substring(0, 4),   // YYYY
        },
      });

      console.log('✅ Item saved successfully:', newItem.id);
      return NextResponse.json(newItem, { status: 201 });
    } catch (dbError: any) {
      console.error('❌ Database operation failed:', dbError);
      
      // Handle specific Prisma errors
      if (dbError.code === 'P2003') {
        // Foreign key constraint failed
        console.error('Foreign key constraint error - userId:', userId);
        return NextResponse.json({ 
          message: 'Authentication error. Please sign out and sign in again.',
          details: 'User session is no longer valid'
        }, { status: 401 });
      }
      
      throw dbError; // Re-throw for outer catch
    }
  } catch (error) {
    console.error('❌ POST /api/saved-items error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error saving item';
    return NextResponse.json({ message: errorMessage, details: String(error) }, { status: 500 });
  }
}
