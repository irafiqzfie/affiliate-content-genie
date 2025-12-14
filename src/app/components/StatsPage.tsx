"use client";

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
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
  monthlyData: Array<{
    month: string;
    generated: number;
    posted: number;
  }>;
  platformBreakdown: Record<string, number>;
  mostActiveMonth: string;
  avgPostsPerMonth: number;
  lastActivity: string | null;
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="stats-page">
        <div className="stats-header">
          <h2>📊 Stats & Analytics</h2>
        </div>
        <div className="stats-loading">
          <div className="spinner"></div>
          <p>Loading your analytics...</p>
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
        <div className="stats-error">
          <p>{error || 'Failed to load stats'}</p>
          <button onClick={fetchStats} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  // Prepare platform breakdown data for pie chart
  const platformData = Object.entries(stats.platformBreakdown).map(([platform, count]) => ({
    name: platform,
    value: count,
  }));

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h2>📊 Stats & Analytics</h2>
        <p className="stats-subtitle">Your content generation and posting performance</p>
      </div>

      {/* Metric Cards */}
      <div className="stats-metrics-grid">
        <div className="stat-card">
          <div className="stat-icon">✨</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.totalGenerated}</h3>
            <p className="stat-label">Content Generated</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📮</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.totalPosted}</h3>
            <p className="stat-label">Content Posted</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.postingRatio}%</h3>
            <p className="stat-label">Posting Ratio</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.avgPostsPerMonth}</h3>
            <p className="stat-label">Avg Posts/Month</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="stats-charts-grid">
        {/* Monthly Activity Chart */}
        <div className="stats-chart-card">
          <h3 className="chart-title">📅 Monthly Activity</h3>
          <div className="chart-container">
            {stats.monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={formatMonth}
                    stroke="rgba(255,255,255,0.5)"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(13, 15, 27, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    labelFormatter={formatMonth}
                  />
                  <Legend wrapperStyle={{ color: '#fff' }} />
                  <Bar dataKey="generated" fill="#6366f1" name="Generated" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="posted" fill="#8b5cf6" name="Posted" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">
                <p>No activity data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="stats-chart-card">
          <h3 className="chart-title">🌐 Platform Breakdown</h3>
          <div className="chart-container">
            {platformData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={platformData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: { name?: string; percent?: number }) => {
                      const name = props.name || '';
                      const percent = props.percent || 0;
                      return `${name}: ${(percent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(13, 15, 27, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">
                <p>No posts yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="stats-info-grid">
        <div className="info-card">
          <h4>🔥 Most Active Month</h4>
          <p className="info-value">
            {stats.mostActiveMonth ? formatMonth(stats.mostActiveMonth) : 'N/A'}
          </p>
        </div>

        <div className="info-card">
          <h4>🕐 Last Activity</h4>
          <p className="info-value">{formatDate(stats.lastActivity)}</p>
        </div>
      </div>
    </div>
  );
}
