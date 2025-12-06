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

  console.log('🔍 GET /api/auth/connections - Session:', session?.user?.id ? 'Found' : 'Not found');

  if (!session?.user?.id) {
    console.error('❌ No session or user ID');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('🔍 Fetching connections for user:', session.user.id);
    const connections = await getUserConnections(session.user.id);
    console.log('✅ Connections found:', JSON.stringify(connections, null, 2));
    return NextResponse.json(connections);
  } catch (error) {
    console.error('❌ Error fetching connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}
