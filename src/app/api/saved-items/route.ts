import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const items = await prisma.savedItem.findMany({ orderBy: { id: 'desc' } });
    return NextResponse.json(items);
  } catch (error) {
    console.error('GET /api/saved-items error:', error);
    return NextResponse.json({ message: 'Error fetching saved items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, productLink, content } = body;

    if (!title || !productLink || !content) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const newItem = await prisma.savedItem.create({ data: {
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
