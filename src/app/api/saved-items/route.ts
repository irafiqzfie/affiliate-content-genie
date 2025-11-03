import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/authOptions'
import type { Session, NextAuthOptions } from 'next-auth'

export async function GET() {
  try {
  const session = (await getServerSession(authOptions as NextAuthOptions)) as Session | null
    
    // Use authenticated user ID or fallback to guest user
    const userId = session?.user?.id || 'guest-user';
    console.log('👤 GET User ID:', userId);

  const items = await prisma.savedItem.findMany({ where: { userId: userId }, orderBy: { id: 'desc' } });
    return NextResponse.json(items);
  } catch (error) {
    console.error('GET /api/saved-items error:', error);
    return NextResponse.json({ message: 'Error fetching saved items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('📥 POST /api/saved-items - Request received');
    
    const session = (await getServerSession(authOptions as NextAuthOptions)) as Session | null
    console.log('🔐 Session:', session ? 'Authenticated' : 'Not authenticated');
    
    // Use authenticated user ID or fallback to guest user
    const userId = session?.user?.id || 'guest-user';
    console.log('👤 User ID:', userId);

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json({ message: 'Invalid JSON in request body' }, { status: 400 });
    }

    console.log('📦 Request body:', { title: body.title, productLink: body.productLink, hasContent: !!body.content });
    console.log('📦 Full request body:', JSON.stringify(body, null, 2));
    
    const { title, productLink, content } = body;

    if (!title || !productLink || !content) {
      console.log('❌ Missing required fields:', { title: !!title, productLink: !!productLink, content: !!content });
      return NextResponse.json({ message: 'Missing required fields: title, productLink, and content are required' }, { status: 400 });
    }

    if (typeof title !== 'string' || typeof productLink !== 'string') {
      console.log('❌ Invalid field types');
      return NextResponse.json({ message: 'Invalid field types: title and productLink must be strings' }, { status: 400 });
    }

    if (typeof content !== 'object' || !content.video || !content.post) {
      console.log('❌ Invalid content structure:', { contentType: typeof content, hasVideo: content?.video, hasPost: content?.post });
      return NextResponse.json({ message: 'Invalid content structure: content must have video and post properties' }, { status: 400 });
    }

    console.log('💾 Attempting to save to database...');
    const newItem = await prisma.savedItem.create({ data: {
      userId: userId,
      title,
      productLink,
      video: content.video || '',
      post: content.post || ''
    }});

    console.log('✅ Item saved successfully:', newItem.id);
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('❌ POST /api/saved-items error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error saving item';
    return NextResponse.json({ message: errorMessage, details: String(error) }, { status: 500 });
  }
}
