"use client";

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
  }>;
  monthlyData: Array<{
    month: string;
    generated: number;
    posted: number;
  }>;
  yearlyData: Array<{
    year: string;
    generated: number;
    posted: number;
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
  const [timeFilter, setTimeFilter] = useState<'7days' | '30days' | 'yearly' | 'all'>('all');
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
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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
    
    // Handle yearly view
    if (timeFilter === 'yearly') {
      // Generate complete year range
      const years = stats.yearlyData.map(item => parseInt(item.year));
      if (years.length === 0) return { data: [], label: 'year' as const };
      
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      const completeYearData = [];
      
      for (let year = minYear; year <= maxYear; year++) {
        const existing = stats.yearlyData.find(item => parseInt(item.year) === year);
        completeYearData.push({
          year: year.toString(),
          generated: existing?.generated || 0,
          posted: existing?.posted || 0,
        });
      }
      
      return { data: completeYearData, label: 'year' as const };
    }
    
    // Handle daily views (7 days / 30 days)
    if (timeFilter === '7days' || timeFilter === '30days') {
      const days = timeFilter === '7days' ? 7 : 30;
      const dailyData: Array<{ day: string; generated: number; posted: number }> = [];
      
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
        });
      }
      
      return { data: dailyData, label: 'day' as const };
    }
    
    // Handle monthly view (all time)
    // Generate complete month range
    const months = stats.monthlyData.map(item => item.month);
    if (months.length === 0) return { data: [], label: 'month' as const };
    
    const sortedMonths = months.sort();
    const firstMonth = sortedMonths[0];
    const lastMonth = sortedMonths[sortedMonths.length - 1];
    
    const [firstYear, firstMonthNum] = firstMonth.split('-').map(Number);
    const [lastYear, lastMonthNum] = lastMonth.split('-').map(Number);
    
    const completeMonthlyData = [];
    let currentYear = firstYear;
    let currentMonth = firstMonthNum;
    
    while (currentYear < lastYear || (currentYear === lastYear && currentMonth <= lastMonthNum)) {
      const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      const existing = stats.monthlyData.find(item => item.month === monthKey);
      
      completeMonthlyData.push({
        month: monthKey,
        generated: existing?.generated || 0,
        posted: existing?.posted || 0,
      });
      
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }
    
    return { data: completeMonthlyData, label: 'month' as const };
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

  // Prepare platform breakdown data for pie chart
  const platformData = Object.entries(stats.platformBreakdown).map(([platform, count]) => ({
    name: platform,
    value: count,
  }));
  
  // Get unique platforms for stacked bars
  const platforms = Object.keys(stats.platformBreakdown);
  const platformColors: Record<string, string> = {
    'Facebook': '#1877f2',
    'Threads': '#10b981',
    'Instagram': '#e4405f',
    'TikTok': '#000000',
  };

  const COLORS = ['#6366f1', '#10b981', '#ec4899', '#f59e0b'];

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
              className={`filter-btn ${timeFilter === 'yearly' ? 'active' : ''}`}
              onClick={() => setTimeFilter('yearly')}
            >
              Yearly
            </button>
            <button
              className={`filter-btn ${timeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTimeFilter('all')}
            >
              All time
            </button>
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
            {/* Mini sparkline */}
            <div className="kpi-sparkline">
              {stats.dailyData.slice(-7).map((d, i) => (
                <div 
                  key={i} 
                  className="sparkline-bar"
                  style={{ 
                    height: `${(d.generated / Math.max(...stats.dailyData.slice(-7).map(x => x.generated), 1)) * 100}%` 
                  }}
                />
              ))}
            </div>
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
            {/* Mini sparkline */}
            <div className="kpi-sparkline">
              {stats.dailyData.slice(-7).map((d, i) => (
                <div 
                  key={i} 
                  className="sparkline-bar"
                  style={{ 
                    height: `${(d.posted / Math.max(...stats.dailyData.slice(-7).map(x => x.posted), 1)) * 100}%` 
                  }}
                />
              ))}
            </div>
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
            <div className="kpi-progress-bar">
              <div 
                className="kpi-progress-fill" 
                style={{ width: `${stats.postingRatio}%` }}
              />
            </div>
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
            <div className="kpi-streak-indicator">
              {Array.from({ length: Math.min(stats.streak, 7) }).map((_, i) => (
                <span key={i} className="streak-dot">🔥</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Analytics Row with Enhanced Charts */}
      <div className="stats-analytics-row">
        {/* Activity Chart with Area/Gradient fills */}
        <div className="analytics-card">
          <div className="analytics-header">
            <h3 className="analytics-title">
              {timeFilter === 'yearly' ? '📊 Yearly Overview' : '📅 Activity Overview'}
            </h3>
            <div className="chart-legend-toggle">
              <button
                className={`legend-btn ${visibleSeries.generated ? 'active' : ''}`}
                onClick={() => toggleSeries('generated')}
              >
                <span className="legend-color" style={{ backgroundColor: '#6366f1' }} />
                Generated
              </button>
              {platforms.length > 0 ? (
                platforms.map((platform, index) => (
                  <button
                    key={platform}
                    className={`legend-btn ${visibleSeries.posted ? 'active' : ''}`}
                    onClick={() => toggleSeries('posted')}
                  >
                    <span className="legend-color" style={{ backgroundColor: platformColors[platform] || COLORS[index % COLORS.length] }} />
                    {platform}
                  </button>
                ))
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
                  {timeFilter === 'all' || timeFilter === 'yearly' ? (
                    <AreaChart data={data}>
                      <defs>
                        <linearGradient id="colorGenerated" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorPosted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey={dataKey}
                        tickFormatter={formatLabel}
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: '11px' }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '11px' }} />
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
                        <Area 
                          type="monotone" 
                          dataKey="generated" 
                          stroke="#6366f1" 
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorGenerated)" 
                          name="Generated" 
                          animationDuration={1000}
                        />
                      )}
                      {visibleSeries.posted && (
                        <Area 
                          type="monotone" 
                          dataKey="posted" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorPosted)" 
                          name="Posted" 
                          animationDuration={1000}
                        />
                      )}
                    </AreaChart>
                  ) : (
                    <BarChart data={data}>
                      <defs>
                        <linearGradient id="barGenerated" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7}/>
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
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '11px' }} />
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
                      {visibleSeries.posted && platforms.map((platform, index) => (
                        <Bar 
                          key={platform}
                          dataKey={platform} 
                          fill={platformColors[platform] || COLORS[index % COLORS.length]}
                          name={platform} 
                          stackId="posted"
                          radius={index === platforms.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                          animationDuration={800}
                        />
                      ))}
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
          <span className="metadata-icon">🔥</span>
          <span className="metadata-text">
            Most Active: <strong>{stats.mostActiveMonth ? formatMonth(stats.mostActiveMonth) : 'N/A'}</strong>
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
