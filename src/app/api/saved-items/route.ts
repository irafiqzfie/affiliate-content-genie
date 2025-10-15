import { NextResponse } from 'next/server';

// This is a mock in-memory store. In a real app, use a database.
const savedItems = [
    {
        id: 1,
        title: "Sample Saved Idea: Smart Mug",
        productLink: "https://shopee.com.my/sample-product-1",
        content: {
            video: "---VIDEO START---\n🎬 Title:\n1. Your Coffee Will Never Be Cold Again!\n---VIDEO END---",
            post: "---POST START---\n✍️ Hook:\n1. I hate cold coffee, so I bought this.\n---POST END---"
        }
    }
];
let nextId = 2;

export async function GET() {
  try {
    // Return a copy to avoid mutation
    return NextResponse.json([...savedItems]);
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
    
    const newItem = {
      id: nextId++,
      title,
      productLink,
      content,
    };
    
    savedItems.push(newItem);
    
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('POST /api/saved-items error:', error);
    return NextResponse.json({ message: 'Error saving item' }, { status: 500 });
  }
}
