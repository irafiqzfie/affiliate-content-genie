import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/authOptions'
import type { Session, NextAuthOptions } from 'next-auth'

export async function GET() {
  try {
  const session = (await getServerSession(authOptions as NextAuthOptions)) as Session | null
    if (!session) {
      // If the user is not authenticated, return an empty list instead of failing the request.
      return NextResponse.json([])
    }

  const items = await prisma.savedItem.findMany({ where: { userId: session.user?.id as string }, orderBy: { id: 'desc' } });
    return NextResponse.json(items);
  } catch (error) {
    console.error('GET /api/saved-items error:', error);
    return NextResponse.json({ message: 'Error fetching saved items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
  const session = (await getServerSession(authOptions as NextAuthOptions)) as Session | null
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const body = await request.json();
    const { title, productLink, content } = body;

    if (!title || !productLink || !content) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const newItem = await prisma.savedItem.create({ data: {
      userId: session.user?.id as string,
      title,
      productLink,
      video: content.video || '',
      post: content.post || ''
    }});

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('POST /api/saved-items error:', error);
    return NextResponse.json({ message: 'Error saving item' }, { status: 500 });
  }
}
