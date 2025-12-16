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
    const dailyGenerated: Record<string, number> = {};
    const dailyPosted: Record<string, number> = {};
    const dailyPlatforms: Record<string, Record<string, number>> = {}; // day -> platform -> count
    const monthlyGenerated: Record<string, number> = {};
    const monthlyPosted: Record<string, number> = {};
    const monthlyPlatforms: Record<string, Record<string, number>> = {}; // month -> platform -> count
    const yearlyGenerated: Record<string, number> = {};
    const yearlyPosted: Record<string, number> = {};
    const yearlyPlatforms: Record<string, Record<string, number>> = {}; // year -> platform -> count
    const platformBreakdown: Record<string, number> = {};

    let totalGenerated = 0;
    let totalPosted = 0;
    let lastActivity: Date | null = null;

    events.forEach((event: { eventType: string; platform: string | null; timestamp: Date; monthKey: string; yearKey: string }) => {
      const dayKey = event.timestamp.toISOString().substring(0, 10); // YYYY-MM-DD
      
      if (event.eventType === 'content_generated') {
        totalGenerated++;
        dailyGenerated[dayKey] = (dailyGenerated[dayKey] || 0) + 1;
        monthlyGenerated[event.monthKey] = (monthlyGenerated[event.monthKey] || 0) + 1;
        yearlyGenerated[event.yearKey] = (yearlyGenerated[event.yearKey] || 0) + 1;
      } else if (event.eventType === 'content_posted') {
        totalPosted++;
        dailyPosted[dayKey] = (dailyPosted[dayKey] || 0) + 1;
        monthlyPosted[event.monthKey] = (monthlyPosted[event.monthKey] || 0) + 1;
        yearlyPosted[event.yearKey] = (yearlyPosted[event.yearKey] || 0) + 1;
        
        if (event.platform) {
          platformBreakdown[event.platform] = (platformBreakdown[event.platform] || 0) + 1;
          
          // Track platform per day
          if (!dailyPlatforms[dayKey]) dailyPlatforms[dayKey] = {};
          dailyPlatforms[dayKey][event.platform] = (dailyPlatforms[dayKey][event.platform] || 0) + 1;
          
          // Track platform per month
          if (!monthlyPlatforms[event.monthKey]) monthlyPlatforms[event.monthKey] = {};
          monthlyPlatforms[event.monthKey][event.platform] = (monthlyPlatforms[event.monthKey][event.platform] || 0) + 1;
          
          // Track platform per year
          if (!yearlyPlatforms[event.yearKey]) yearlyPlatforms[event.yearKey] = {};
          yearlyPlatforms[event.yearKey][event.platform] = (yearlyPlatforms[event.yearKey][event.platform] || 0) + 1;
        }
      }

      // Track last activity
      if (!lastActivity || event.timestamp > lastActivity) {
        lastActivity = event.timestamp;
      }
    });

    // Get all unique days and sort them
    const allDays = Array.from(
      new Set([...Object.keys(dailyGenerated), ...Object.keys(dailyPosted)])
    ).sort();

    // Build daily comparison data
    const dailyData = allDays.map(day => ({
      day,
      generated: dailyGenerated[day] || 0,
      posted: dailyPosted[day] || 0,
      ...(dailyPlatforms[day] || {})
    }));

    // Get all unique months and sort them
    const allMonths = Array.from(
      new Set([...Object.keys(monthlyGenerated), ...Object.keys(monthlyPosted)])
    ).sort();

    // Build monthly comparison data
    const monthlyData = allMonths.map(month => ({
      month,
      generated: monthlyGenerated[month] || 0,
      posted: monthlyPosted[month] || 0,
      ...(monthlyPlatforms[month] || {})
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
      ...(yearlyPlatforms[year] || {})
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

    // Calculate trend indicators (compare last 30 days vs previous 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    let recentGenerated = 0;
    let recentPosted = 0;
    let previousGenerated = 0;
    let previousPosted = 0;

    events.forEach((event: { eventType: string; platform: string | null; timestamp: Date; monthKey: string; yearKey: string }) => {
      const eventDate = new Date(event.timestamp);
      
      if (eventDate >= thirtyDaysAgo) {
        if (event.eventType === 'content_generated') recentGenerated++;
        else if (event.eventType === 'content_posted') recentPosted++;
      } else if (eventDate >= sixtyDaysAgo) {
        if (event.eventType === 'content_generated') previousGenerated++;
        else if (event.eventType === 'content_posted') previousPosted++;
      }
    });

    const generatedTrend = previousGenerated > 0 
      ? Math.round(((recentGenerated - previousGenerated) / previousGenerated) * 100)
      : (recentGenerated > 0 ? 100 : 0);

    const postedTrend = previousPosted > 0
      ? Math.round(((recentPosted - previousPosted) / previousPosted) * 100)
      : (recentPosted > 0 ? 100 : 0);

    const ratioTrend = previousGenerated > 0 && recentGenerated > 0
      ? Math.round(((recentPosted / recentGenerated) - (previousPosted / previousGenerated)) * 100)
      : 0;

    // Calculate streak
    let currentStreak = 0;
    if (events.length > 0) {
      const sortedDays = allDays.sort().reverse();
      const todayStr = today.toISOString().substring(0, 10);
      
      for (const day of sortedDays) {
        if (day > todayStr) continue;
        const dayDate = new Date(day);
        const expectedDay = new Date(today);
        expectedDay.setDate(expectedDay.getDate() - currentStreak);
        const expectedStr = expectedDay.toISOString().substring(0, 10);
        
        if (day === expectedStr) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    const stats = {
      totalGenerated,
      totalPosted,
      postingRatio,
      dailyData,
      monthlyData,
      yearlyData,
      platformBreakdown,
      mostActiveMonth,
      avgPostsPerMonth,
      lastActivity,
      trends: {
        generated: generatedTrend,
        posted: postedTrend,
        ratio: ratioTrend,
      },
      streak: currentStreak,
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
