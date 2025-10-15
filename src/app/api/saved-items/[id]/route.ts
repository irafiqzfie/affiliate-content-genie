import { NextResponse } from 'next/server';

// This is a mock in-memory store. In a real app, use a database.
let savedItems = [
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    const initialLength = savedItems.length;
    savedItems = savedItems.filter(item => item.id !== id);

    if (savedItems.length === initialLength) {
        return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: `Item ${id} deleted successfully` }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/saved-items/[id] error:', error);
    return NextResponse.json({ message: 'Error deleting item' }, { status: 500 });
  }
}
