import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/authOptions';
import type { Session, NextAuthOptions } from 'next-auth';

/**
 * Backfill analytics events from existing SavedItem and ScheduledPost records
 * This is a one-time migration endpoint to populate AnalyticsEvent table
 * with historical data from before the event tracking system was implemented.
 */
export async function POST() {
  try {
    const session = (await getServerSession(authOptions as NextAuthOptions)) as Session | null;
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    if (!prisma) {
      return NextResponse.json({ message: 'Database unavailable' }, { status: 503 });
    }

    // Check if events already exist for this user
    const existingEvents = await prisma.analyticsEvent.count({
      where: { userId },
    });

    if (existingEvents > 0) {
      return NextResponse.json({ 
        message: 'Events already exist. Backfill not needed.',
        existingCount: existingEvents 
      });
    }

    // Backfill from SavedItem
    const savedItems = await prisma.savedItem.findMany({
      where: { userId },
      select: {
        createdAt: true,
      },
    });

    const generatedEvents = savedItems.map((item: { createdAt: Date }) => ({
      userId,
      eventType: 'content_generated',
      platform: null,
      timestamp: item.createdAt,
      monthKey: item.createdAt.toISOString().substring(0, 7),
      yearKey: item.createdAt.toISOString().substring(0, 4),
    }));

    // Backfill from ScheduledPost
    const scheduledPosts = await prisma.scheduledPost.findMany({
      where: { userId },
      select: {
        platform: true,
        createdAt: true,
      },
    });

    const postedEvents = scheduledPosts.map((post: { platform: string; createdAt: Date }) => ({
      userId,
      eventType: 'content_posted',
      platform: post.platform,
      timestamp: post.createdAt,
      monthKey: post.createdAt.toISOString().substring(0, 7),
      yearKey: post.createdAt.toISOString().substring(0, 4),
    }));

    // Insert all events in batch
    const allEvents = [...generatedEvents, ...postedEvents];
    
    if (allEvents.length > 0) {
      await prisma.analyticsEvent.createMany({
        data: allEvents,
      });
    }

    return NextResponse.json({ 
      message: 'Backfill completed successfully',
      generatedCount: generatedEvents.length,
      postedCount: postedEvents.length,
      totalEvents: allEvents.length,
    });

  } catch (error) {
    console.error('Backfill events error:', error);
    return NextResponse.json(
      { message: 'Error backfilling events', error: String(error) },
      { status: 500 }
    );
  }
}
