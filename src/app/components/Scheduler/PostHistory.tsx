"use client"

import { useState } from 'react';
import { ScheduledPost } from '@/app/types';
import Image from 'next/image';

interface PostHistoryProps {
  posts: ScheduledPost[];
  onDeletePost: (id: number) => void;
  onClearAll: () => void;
}

export function PostHistory({ posts, onDeletePost, onClearAll }: PostHistoryProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

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

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleClearAll = () => {
    if (window.confirm(`Are you sure you want to delete all ${posts.length} post${posts.length !== 1 ? 's' : ''} from history? This cannot be undone.`)) {
      onClearAll();
    }
  };

  return (
    <div className="post-history-container">
      <div className="post-history-header">
        <div>
          <h3>📜 Post History</h3>
          <span className="post-count">{posts.length} post{posts.length !== 1 ? 's' : ''}</span>
        </div>
        <button 
          onClick={handleClearAll}
          className="clear-all-btn"
          title="Clear all post history"
        >
          🗑️ Clear All
        </button>
      </div>
      <div className="post-history-list">
        {posts.map(post => (
          <div 
            key={post.id} 
            className={`history-item ${expandedItems.has(post.id) ? 'expanded' : ''}`}
            onClick={() => toggleExpand(post.id)}
          >
            {post.imageUrl && (
              <div className="history-item-image">
                <Image 
                  src={post.imageUrl} 
                  alt="Post thumbnail" 
                  width={100} 
                  height={100}
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.186 3.998c-1.864 0-3.572.61-4.952 1.64-1.326 1.037-2.335 2.522-2.916 4.294l2.79.89c.456-1.391 1.232-2.496 2.22-3.207.99-.686 2.15-1.073 3.408-1.073 2.636 0 4.767 2.131 4.767 4.767 0 .702-.157 1.373-.44 1.977-.3.64-.753 1.2-1.314 1.626-.558.424-1.22.711-1.93.83v2.934c1.296-.171 2.465-.676 3.415-1.429 1.007-.797 1.805-1.857 2.317-3.078.52-1.247.79-2.63.79-4.086 0-3.9-3.17-7.07-7.07-7.07zM10.928 15.34v2.844c0 .7.566 1.266 1.266 1.266.7 0 1.266-.566 1.266-1.266V15.34h-2.532z"/>
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
            <button
              className="history-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Delete this post from history?')) {
                  onDeletePost(post.id);
                }
              }}
              title="Delete post"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
