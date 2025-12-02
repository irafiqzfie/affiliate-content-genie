/**
 * GET /api/auth/connections
 * 
 * Returns all connected OAuth accounts for the current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { getUserConnections } from '@/lib/oauth-helpers';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const connections = await getUserConnections(session.user.id);
    return NextResponse.json(connections);
  } catch (error) {
    console.error('❌ Error fetching connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}
