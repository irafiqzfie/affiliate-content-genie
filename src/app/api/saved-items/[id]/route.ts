import { NextResponse } from 'next/server';

type SavedItem = {
  id: number;
  title: string;
  productLink: string;
  content: {
    video: string;
    post: string;
  };
};

// This is a mock in-memory store. In a real app, use a database.
let savedItems: SavedItem[] = [
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
export async function DELETE(request: Request) {
  try {
    // Extract the id from the request URL since typing the context params can cause validator mismatches.
    const url = new URL(request.url);
    const pathnameParts = url.pathname.split('/').filter(Boolean);
    const idStr = pathnameParts[pathnameParts.length - 1];
    const id = parseInt(idStr || '', 10);
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
