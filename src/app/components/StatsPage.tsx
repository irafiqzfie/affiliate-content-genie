"use client";

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface StatsData {
  totalGenerated: number;
  totalPosted: number;
  postingRatio: number;
  dailyData: Array<{
    day: string;
    generated: number;
    posted: number;
    [platform: string]: string | number;
  }>;
  monthlyData: Array<{
    month: string;
    generated: number;
    posted: number;
    [platform: string]: string | number;
  }>;
  yearlyData: Array<{
    year: string;
    generated: number;
    posted: number;
    [platform: string]: string | number;
  }>;
  platformBreakdown: Record<string, number>;
  mostActiveMonth: string;
  avgPostsPerMonth: number;
  lastActivity: string | null;
  trends: {
    generated: number;
    posted: number;
    ratio: number;
  };
  streak: number;
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'7days' | '30days' | 'year'>('year');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [visibleSeries, setVisibleSeries] = useState({ generated: true, posted: true });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      setStats(data);
      console.log('📊 Stats data received:', data);
      console.log('📊 Daily data sample:', data.dailyData.slice(0, 3));
      console.log('📊 Platform breakdown:', data.platformBreakdown);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const toggleSeries = (series: 'generated' | 'posted') => {
    setVisibleSeries(prev => ({ ...prev, [series]: !prev[series] }));
  };

  const exportData = () => {
    if (!stats) return;
    
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Generated', stats.totalGenerated],
      ['Total Posted', stats.totalPosted],
      ['Posting Ratio', `${stats.postingRatio}%`],
      ['Avg Posts/Month', stats.avgPostsPerMonth],
      ['Current Streak', `${stats.streak} days`],
      [''],
      ['Date', 'Generated', 'Posted'],
      ...stats.dailyData.map(d => [d.day, d.generated, d.posted])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stats-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return '↑';
    if (trend < 0) return '↓';
    return '→';
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return '#10b981'; // green
    if (trend < 0) return '#ef4444'; // red
    return '#6b7280'; // gray
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  const formatDay = (dayStr: string) => {
    const date = new Date(dayStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getFilteredData = () => {
    if (!stats) return { data: [], label: 'month' as const };
    
    // Handle year view (monthly breakdown) - always show all 12 months of selected year
    if (timeFilter === 'year') {
      const completeMonthlyData = [];
      
      // Always generate all 12 months for selected year (Jan - Dec)
      for (let month = 1; month <= 12; month++) {
        const monthKey = `${selectedYear}-${String(month).padStart(2, '0')}`;
        const existing = stats.monthlyData.find(item => item.month === monthKey);
        
        completeMonthlyData.push({
          month: monthKey,
          generated: existing?.generated || 0,
          posted: existing?.posted || 0,
          Facebook: (existing && 'Facebook' in existing) ? (existing as Record<string, string | number>).Facebook as number : 0,
          Threads: (existing && 'Threads' in existing) ? (existing as Record<string, string | number>).Threads as number : 0,
          Instagram: (existing && 'Instagram' in existing) ? (existing as Record<string, string | number>).Instagram as number : 0,
          TikTok: (existing && 'TikTok' in existing) ? (existing as Record<string, string | number>).TikTok as number : 0,
        });
      }
      
      return { data: completeMonthlyData, label: 'month' as const };
    }
    
    // Handle daily views (7 days / 30 days)
    if (timeFilter === '7days' || timeFilter === '30days') {
      const days = timeFilter === '7days' ? 7 : 30;
      const dailyData: Array<{ day: string; generated: number; posted: number; [key: string]: string | number }> = [];
      
      // Generate complete daily range for the last N days
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().substring(0, 10); // YYYY-MM-DD
        
        // Find matching data from API
        const existing = stats.dailyData.find(item => item.day === dateStr);
        
        dailyData.push({
          day: dateStr,
          generated: existing?.generated || 0,
          posted: existing?.posted || 0,
          ...(existing ? Object.fromEntries(
            Object.entries(existing).filter(([key]) => 
              key !== 'day' && key !== 'generated' && key !== 'posted'
            )
          ) : {})
        });
      }
      
      return { data: dailyData, label: 'day' as const };
    }
    
    return { data: [], label: 'month' as const };
  };

  if (loading) {
    return (
      <div className="stats-page">
        <div className="stats-header">
          <h2>📊 Stats & Analytics</h2>
        </div>
        <div className="stats-loading">
          {/* Skeleton loaders */}
          <div className="skeleton-kpi-strip">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton-kpi skeleton-pulse"></div>
            ))}
          </div>
          <div className="skeleton-charts">
            <div className="skeleton-chart skeleton-pulse"></div>
            <div className="skeleton-chart skeleton-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="stats-page">
        <div className="stats-header">
          <h2>📊 Stats & Analytics</h2>
        </div>
        <div className="stats-error-state">
          <div className="error-icon">⚠️</div>
          <h3>Oops! Something went wrong</h3>
          <p className="error-message">{error || 'Failed to load stats'}</p>
          <button onClick={fetchStats} className="retry-button">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  // Get unique platforms for stacked bars (order matters for stacking)
  // Check which platforms have data in the filtered time period
  const allPlatformKeys = new Set<string>();
  const { data: filteredData } = getFilteredData();
  filteredData.forEach(item => {
    Object.keys(item).forEach(key => {
      if (key !== 'day' && key !== 'month' && key !== 'year' && key !== 'generated' && key !== 'posted') {
        allPlatformKeys.add(key);
      }
    });
  });
  const platforms = Array.from(allPlatformKeys).filter(p => 
    filteredData.some(d => (d[p as keyof typeof d] as number) > 0)
  );
  console.log('🔍 Platform detection:', { platforms, filteredData, allPlatformKeys: Array.from(allPlatformKeys) });
  
  const platformColors: Record<string, string> = {
    'Threads': '#2c2c2e',    // Dark charcoal for Threads
    'Facebook': '#1877f2',  // Facebook blue
    'Instagram': '#e4405f',
    'TikTok': '#000000',
  };

  // Generated content color - solid orange
  const GENERATED_COLOR = '#f97316'; // Modern muted orange
  const COLORS = ['#f97316', '#1877f2', '#ec4899', '#f59e0b'];

  return (
    <div className="stats-page">
      {/* Header with Time Filter and Export */}
      <div className="stats-header">
        <div className="stats-header-left">
          <h2>📊 Stats & Analytics</h2>
          <p className="stats-subtitle">Your content generation and posting performance</p>
        </div>
        <div className="stats-header-right">
          <div className="stats-time-filter">
            <button
              className={`filter-btn ${timeFilter === '7days' ? 'active' : ''}`}
              onClick={() => setTimeFilter('7days')}
            >
              Last 7 days
            </button>
            <button
              className={`filter-btn ${timeFilter === '30days' ? 'active' : ''}`}
              onClick={() => setTimeFilter('30days')}
            >
              30 days
            </button>
            <button
              className={`filter-btn ${timeFilter === 'year' ? 'active' : ''}`}
              onClick={() => setTimeFilter('year')}
            >
              Year
            </button>
            {timeFilter === 'year' && (
              <select 
                className="year-selector"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                style={{
                  marginLeft: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year} style={{ backgroundColor: '#0d0f1b' }}>
                    {year}
                  </option>
                ))}
              </select>
            )}
          </div>
          <button className="export-btn" onClick={exportData} title="Export data to CSV">
            📥 Export
          </button>
        </div>
      </div>

      {/* Enhanced KPI Strip with Trends and Sparklines */}
      <div className="stats-kpi-strip">
        <div className="kpi-item kpi-animated">
          <div className="kpi-icon kpi-icon-animated">✨</div>
          <div className="kpi-content">
            <div className="kpi-header">
              <div className="kpi-value">{stats.totalGenerated}</div>
              <div 
                className="kpi-trend" 
                style={{ color: getTrendColor(stats.trends.generated) }}
              >
                {getTrendIcon(stats.trends.generated)} {Math.abs(stats.trends.generated)}%
              </div>
            </div>
            <div className="kpi-label">Generated</div>
          </div>
        </div>

        <div className="kpi-item kpi-animated">
          <div className="kpi-icon kpi-icon-animated">📮</div>
          <div className="kpi-content">
            <div className="kpi-header">
              <div className="kpi-value">{stats.totalPosted}</div>
              <div 
                className="kpi-trend"
                style={{ color: getTrendColor(stats.trends.posted) }}
              >
                {getTrendIcon(stats.trends.posted)} {Math.abs(stats.trends.posted)}%
              </div>
            </div>
            <div className="kpi-label">Posted</div>
          </div>
        </div>

        <div className="kpi-item kpi-animated">
          <div className="kpi-icon kpi-icon-animated">📊</div>
          <div className="kpi-content">
            <div className="kpi-header">
              <div className="kpi-value">{stats.postingRatio}%</div>
              <div 
                className="kpi-trend"
                style={{ color: getTrendColor(stats.trends.ratio) }}
              >
                {getTrendIcon(stats.trends.ratio)} {Math.abs(stats.trends.ratio)}%
              </div>
            </div>
            <div className="kpi-label">Post Ratio</div>
          </div>
        </div>

        <div className="kpi-item kpi-animated">
          <div className="kpi-icon kpi-icon-animated">🔥</div>
          <div className="kpi-content">
            <div className="kpi-header">
              <div className="kpi-value">{stats.streak}</div>
              <div className="kpi-badge">days</div>
            </div>
            <div className="kpi-label">Current Streak</div>
          </div>
        </div>
      </div>

      {/* Two-Column Analytics Row with Enhanced Charts */}
      <div className="stats-analytics-row">
        {/* Activity Chart with Area/Gradient fills */}
        <div className="analytics-card">
          <div className="analytics-header">
            <h3 className="analytics-title">
              {timeFilter === 'year' ? '📊 Yearly Overview' : '📅 Activity Overview'}
            </h3>
            <div className="chart-legend-toggle">
              <button
                className={`legend-btn ${visibleSeries.generated ? 'active' : ''}`}
                onClick={() => toggleSeries('generated')}
              >
                <span className="legend-color" style={{ backgroundColor: '#f97316' }} />
                Generated
              </button>
              {platforms.length > 0 ? (
                platforms.map((platform, index) => {
                  // Use gradient styles for legend to match chart
                  const legendStyle = platform === 'Facebook' ? { 
                    background: 'linear-gradient(to top, #1877f2, #60a5fa)'
                  } : platform === 'Threads' ? {
                    background: 'linear-gradient(to top, #2c2c2e, #6b7280)'
                  } : platform === 'Instagram' ? {
                    background: 'linear-gradient(to top, #e4405f, #f472b6)'
                  } : {
                    backgroundColor: platformColors[platform] || COLORS[index % COLORS.length]
                  };
                  return (
                    <button
                      key={platform}
                      className={`legend-btn ${visibleSeries.posted ? 'active' : ''}`}
                      onClick={() => toggleSeries('posted')}
                    >
                      <span className="legend-color" style={legendStyle} />
                      {platform} (Posted)
                    </button>
                  );
                })
              ) : (
                <button
                  className={`legend-btn ${visibleSeries.posted ? 'active' : ''}`}
                  onClick={() => toggleSeries('posted')}
                >
                  <span className="legend-color" style={{ backgroundColor: '#10b981' }} />
                  Posted
                </button>
              )}
            </div>
          </div>
          <div className="analytics-chart">
            {(() => {
              const { data, label } = getFilteredData();
              const formatLabel = label === 'year' ? (year: string) => year : 
                                  label === 'day' ? formatDay : formatMonth;
              const dataKey = label;
              
              return data.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  {timeFilter === 'year' ? (
                    <AreaChart data={data}>
                      <defs>
                        {/* Generated: Orange gradient */}
                        <linearGradient id="colorGenerated" x1="0" y1="1" x2="0" y2="0">
                          <stop offset="0%" stopColor="#f97316" stopOpacity={0.3}/>
                          <stop offset="100%" stopColor="#fb923c" stopOpacity={0.15}/>
                        </linearGradient>
                        {/* Facebook: Blue to White gradient */}
                        <linearGradient id="colorFacebook" x1="0" y1="1" x2="0" y2="0">
                          <stop offset="0%" stopColor="#1877f2" stopOpacity={0.3}/>
                          <stop offset="100%" stopColor="#ffffff" stopOpacity={0.15}/>
                        </linearGradient>
                        {/* Threads: Dark charcoal to White gradient */}
                        <linearGradient id="colorThreads" x1="0" y1="1" x2="0" y2="0">
                          <stop offset="0%" stopColor="#2c2c2e" stopOpacity={0.3}/>
                          <stop offset="100%" stopColor="#ffffff" stopOpacity={0.12}/>
                        </linearGradient>
                        <linearGradient id="colorInstagram" x1="0" y1="1" x2="0" y2="0">
                          <stop offset="0%" stopColor="#e4405f" stopOpacity={0.3}/>
                          <stop offset="100%" stopColor="#ffffff" stopOpacity={0.15}/>
                        </linearGradient>
                        <linearGradient id="colorTikTok" x1="0" y1="1" x2="0" y2="0">
                          <stop offset="0%" stopColor="#000000" stopOpacity={0.3}/>
                          <stop offset="100%" stopColor="#ffffff" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey={dataKey}
                        tickFormatter={formatLabel}
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: '11px' }}
                        interval={0}
                        angle={-30}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.5)" 
                        style={{ fontSize: '11px' }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(13, 15, 27, 0.95)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                        labelFormatter={formatLabel}
                        formatter={(value: number, name: string) => [
                          value,
                          name === 'Generated' ? 'Generated' :
                          name === 'Facebook' ? 'Facebook' :
                          name === 'Threads' ? 'Threads' :
                          name === 'Instagram' ? 'Instagram' :
                          name === 'TikTok' ? 'TikTok' : name
                        ]}
                      />
                      {visibleSeries.generated && (
                        <Area 
                          type="monotone" 
                          dataKey="generated" 
                          stroke="#f97316" 
                          strokeWidth={2}
                          fill="url(#colorGenerated)" 
                          name="Generated" 
                          animationDuration={1000}
                        />
                      )}
                      {visibleSeries.posted && platforms.includes('Facebook') && (
                        <Area 
                          type="monotone" 
                          dataKey="Facebook" 
                          stackId="platforms"
                          stroke="#1877f2" 
                          strokeWidth={2}
                          fill="url(#colorFacebook)" 
                          name="Facebook" 
                          animationDuration={1000}
                        />
                      )}
                      {visibleSeries.posted && platforms.includes('Threads') && (
                        <Area 
                          type="monotone" 
                          dataKey="Threads" 
                          stackId="platforms"
                          stroke="#4a4a4e" 
                          strokeWidth={2}
                          fill="url(#colorThreads)" 
                          name="Threads" 
                          animationDuration={1000}
                        />
                      )}
                      {visibleSeries.posted && platforms.includes('Instagram') && (
                        <Area 
                          type="monotone" 
                          dataKey="Instagram" 
                          stackId="platforms"
                          stroke="#e4405f" 
                          strokeWidth={1.5}
                          fill="url(#colorInstagram)" 
                          name="Instagram" 
                          animationDuration={1000}
                        />
                      )}
                      {visibleSeries.posted && platforms.includes('TikTok') && (
                        <Area 
                          type="monotone" 
                          dataKey="TikTok" 
                          stackId="platforms"
                          stroke="#000000" 
                          strokeWidth={1.5}
                          fill="url(#colorTikTok)" 
                          name="TikTok" 
                          animationDuration={1000}
                        />
                      )}
                    </AreaChart>
                  ) : (
                    <BarChart data={data}>
                      <defs>
                        {/* Generated: Solid orange */}
                        <linearGradient id="barGenerated" x1="0" y1="1" x2="0" y2="0">
                          <stop offset="0%" stopColor="#f97316" stopOpacity={0.9}/>
                          <stop offset="100%" stopColor="#fb923c" stopOpacity={1}/>
                        </linearGradient>
                        {/* Facebook: Blue to White gradient */}
                        <linearGradient id="barFacebook" x1="0" y1="1" x2="0" y2="0">
                          <stop offset="0%" stopColor="#1877f2" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.85}/>
                        </linearGradient>
                        {/* Threads: Charcoal to White gradient */}
                        <linearGradient id="barThreads" x1="0" y1="1" x2="0" y2="0">
                          <stop offset="0%" stopColor="#2c2c2e" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#6b7280" stopOpacity={0.9}/>
                        </linearGradient>
                        <linearGradient id="barInstagram" x1="0" y1="1" x2="0" y2="0">
                          <stop offset="0%" stopColor="#e4405f" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#f472b6" stopOpacity={0.9}/>
                        </linearGradient>
                        <linearGradient id="barPosted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.7}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey={dataKey}
                        tickFormatter={formatLabel}
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: '11px' }}
                        interval="preserveStartEnd"
                        angle={-30}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.5)" 
                        style={{ fontSize: '11px' }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(13, 15, 27, 0.95)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                        labelFormatter={formatLabel}
                      />
                      {visibleSeries.generated && (
                        <Bar 
                          dataKey="generated" 
                          fill="url(#barGenerated)" 
                          name="Generated" 
                          radius={[6, 6, 0, 0]}
                          animationDuration={800}
                        />
                      )}
                      {visibleSeries.posted && platforms.length > 0 ? (
                        platforms.map((platform, index) => {
                          // Use gradient IDs for Facebook and Threads
                          const barFill = platform === 'Facebook' ? 'url(#barFacebook)' :
                                         platform === 'Threads' ? 'url(#barThreads)' :
                                         platform === 'Instagram' ? 'url(#barInstagram)' :
                                         platformColors[platform] || COLORS[index % COLORS.length];
                          return (
                            <Bar 
                              key={platform}
                              dataKey={platform} 
                              fill={barFill}
                              name={platform} 
                              radius={[6, 6, 0, 0]}
                              animationDuration={800}
                            />
                          );
                        })
                      ) : visibleSeries.posted && (
                        <Bar 
                          dataKey="posted" 
                          fill="url(#barPosted)" 
                          name="Posted" 
                          radius={[6, 6, 0, 0]}
                          animationDuration={800}
                        />
                      )}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty-state">
                  <div className="empty-icon">📊</div>
                  <h4>No activity data yet</h4>
                  <p>Start creating content to see your stats!</p>
                  <button className="empty-action-btn" onClick={() => window.location.href = '/'}>
                    ✨ Create Content
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Inline Metadata Info Bar */}
      <div className="stats-metadata-bar">
        <div className="metadata-item">
          <span className="metadata-icon">🏆</span>
          <span className="metadata-text">
            Best Platform: <strong>
              {stats.platformBreakdown.Threads > stats.platformBreakdown.Facebook ? 'Threads' : 
               stats.platformBreakdown.Facebook > stats.platformBreakdown.Threads ? 'Facebook' : 
               'Tied'}
            </strong>
          </span>
        </div>
        <div className="metadata-item">
          <span className="metadata-icon">⏱</span>
          <span className="metadata-text">
            Last Activity: <strong>{formatDate(stats.lastActivity)}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
