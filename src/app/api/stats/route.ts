import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/authOptions';
import type { Session, NextAuthOptions } from 'next-auth';

export async function GET() {
  try {
    const session = (await getServerSession(authOptions as NextAuthOptions)) as Session | null;
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    if (!prisma) {
      return NextResponse.json({ message: 'Database unavailable' }, { status: 503 });
    }

    // Fetch all analytics events for this user (immutable, append-only)
    const events = await prisma.analyticsEvent.findMany({
      where: { userId },
      select: {
        eventType: true,
        platform: true,
        timestamp: true,
        monthKey: true,
        yearKey: true,
      },
      orderBy: { timestamp: 'asc' },
    });

    // Aggregate by month and event type
    const monthlyGenerated: Record<string, number> = {};
    const monthlyPosted: Record<string, number> = {};
    const yearlyGenerated: Record<string, number> = {};
    const yearlyPosted: Record<string, number> = {};
    const platformBreakdown: Record<string, number> = {};

    let totalGenerated = 0;
    let totalPosted = 0;
    let lastActivity: Date | null = null;

    events.forEach((event: { eventType: string; platform: string | null; timestamp: Date; monthKey: string; yearKey: string }) => {
      if (event.eventType === 'content_generated') {
        totalGenerated++;
        monthlyGenerated[event.monthKey] = (monthlyGenerated[event.monthKey] || 0) + 1;
        yearlyGenerated[event.yearKey] = (yearlyGenerated[event.yearKey] || 0) + 1;
      } else if (event.eventType === 'content_posted') {
        totalPosted++;
        monthlyPosted[event.monthKey] = (monthlyPosted[event.monthKey] || 0) + 1;
        yearlyPosted[event.yearKey] = (yearlyPosted[event.yearKey] || 0) + 1;
        
        if (event.platform) {
          platformBreakdown[event.platform] = (platformBreakdown[event.platform] || 0) + 1;
        }
      }

      // Track last activity
      if (!lastActivity || event.timestamp > lastActivity) {
        lastActivity = event.timestamp;
      }
    });

    // Get all unique months and sort them
    const allMonths = Array.from(
      new Set([...Object.keys(monthlyGenerated), ...Object.keys(monthlyPosted)])
    ).sort();

    // Build monthly comparison data
    const monthlyData = allMonths.map(month => ({
      month,
      generated: monthlyGenerated[month] || 0,
      posted: monthlyPosted[month] || 0,
    }));

    // Get all unique years and sort them
    const allYears = Array.from(
      new Set([...Object.keys(yearlyGenerated), ...Object.keys(yearlyPosted)])
    ).sort();

    // Build yearly comparison data
    const yearlyData = allYears.map(year => ({
      year,
      generated: yearlyGenerated[year] || 0,
      posted: yearlyPosted[year] || 0,
    }));

    // Calculate additional metrics
    const postingRatio = totalGenerated > 0 
      ? Math.round((totalPosted / totalGenerated) * 100) 
      : 0;

    // Find most active month
    let mostActiveMonth = '';
    let maxActivity = 0;
    monthlyData.forEach(data => {
      const totalActivity = data.generated + data.posted;
      if (totalActivity > maxActivity) {
        maxActivity = totalActivity;
        mostActiveMonth = data.month;
      }
    });

    // Average posts per month (only counting months with activity)
    const activeMonths = monthlyData.filter(m => m.posted > 0).length;
    const avgPostsPerMonth = activeMonths > 0 
      ? Math.round(totalPosted / activeMonths) 
      : 0;

    const stats = {
      totalGenerated,
      totalPosted,
      postingRatio,
      monthlyData,
      yearlyData,
      platformBreakdown,
      mostActiveMonth,
      avgPostsPerMonth,
      lastActivity,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { message: 'Error fetching stats', error: String(error) },
      { status: 500 }
    );
  }
}
