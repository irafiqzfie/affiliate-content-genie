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

    // Fetch user's saved items (generated content)
    const savedItems = await prisma.savedItem.findMany({
      where: { userId },
      select: {
        id: true,
        createdAt: true,
      },
    });

    // Fetch user's scheduled posts (posted content)
    const scheduledPosts = await prisma.scheduledPost.findMany({
      where: { userId },
      select: {
        id: true,
        platform: true,
        status: true,
        createdAt: true,
        scheduledTime: true,
      },
    });

    // Calculate monthly data for generated content
    const monthlyGenerated: Record<string, number> = {};
    savedItems.forEach(item => {
      const month = item.createdAt.toISOString().substring(0, 7); // YYYY-MM
      monthlyGenerated[month] = (monthlyGenerated[month] || 0) + 1;
    });

    // Calculate monthly data for posted content
    const monthlyPosted: Record<string, number> = {};
    const platformBreakdown: Record<string, number> = {};
    
    scheduledPosts.forEach(post => {
      const month = post.createdAt.toISOString().substring(0, 7); // YYYY-MM
      monthlyPosted[month] = (monthlyPosted[month] || 0) + 1;
      
      // Track platform breakdown
      platformBreakdown[post.platform] = (platformBreakdown[post.platform] || 0) + 1;
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

    // Calculate additional metrics
    const totalGenerated = savedItems.length;
    const totalPosted = scheduledPosts.length;
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

    // Last activity date
    const lastActivity = [...savedItems, ...scheduledPosts]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.createdAt
      || null;

    const stats = {
      totalGenerated,
      totalPosted,
      postingRatio,
      monthlyData,
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
