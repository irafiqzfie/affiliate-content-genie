"use client"

import { ScheduledPost } from '@/app/types';
import Image from 'next/image';

interface PostHistoryProps {
  posts: ScheduledPost[];
}

export function PostHistory({ posts }: PostHistoryProps) {
  if (posts.length === 0) {
    return (
      <div className="post-history-empty">
        <div className="empty-state-icon">📜</div>
        <p>No published posts yet</p>
        <p className="empty-subtitle">Your post history will appear here</p>
      </div>
    );
  }

  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    const stripped = stripHtml(text);
    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="post-history-container">
      <div className="post-history-header">
        <h3>📜 Post History</h3>
        <span className="post-count">{posts.length} post{posts.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="post-history-list">
        {posts.map(post => (
          <div key={post.id} className="history-item">
            {post.imageUrl && (
              <div className="history-item-image">
                <Image 
                  src={post.imageUrl} 
                  alt="Post thumbnail" 
                  width={80} 
                  height={80}
                  style={{ objectFit: 'cover', borderRadius: '8px' }}
                />
              </div>
            )}
            <div className="history-item-content">
              <div className="history-item-header">
                <div className="history-platform-badge">
                  {post.platform === 'Facebook' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 192 192">
                      <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6866C105.707 61.7589 111.932 64.1498 116.137 68.848C118.675 71.6555 120.342 75.0943 121.142 79.1583C115.316 76.9103 108.644 75.7828 101.337 75.7828C74.0963 75.7828 58.7056 88.9788 58.7056 108.159C58.7056 117.207 62.1986 125.202 68.5695 130.45C74.5103 135.331 82.5887 137.827 91.9257 137.827C108.593 137.827 119.69 130.242 125.556 115.693C129.445 125.418 136.331 132.224 146.212 135.965L154.193 120.276C147.347 117.801 143.132 113.536 141.537 108.221C139.455 101.333 139.455 92.4562 141.537 88.9883ZM97.4576 121.866C86.8339 121.866 80.8128 117.498 80.8128 108.159C80.8128 98.8205 86.8339 94.4524 97.4576 94.4524C103.42 94.4524 109.022 95.4805 113.783 97.4524C113.783 116.632 106.668 121.866 97.4576 121.866Z"/>
                    </svg>
                  )}
                  <span>{post.platform}</span>
                </div>
                <span className="history-timestamp">{formatDate(post.createdAt || post.scheduledTime)}</span>
              </div>
              <p className="history-caption">{truncateText(post.caption)}</p>
              {post.affiliateLink && (
                <a 
                  href={post.affiliateLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="history-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  🔗 View Product
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
