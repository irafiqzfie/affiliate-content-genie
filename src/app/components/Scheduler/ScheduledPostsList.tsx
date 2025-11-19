'use client';

import React from 'react';
import Image from 'next/image';
import { ScheduledPost } from '@/app/types';

interface ScheduledPostsListProps {
  scheduledPosts: ScheduledPost[];
  onDeletePost: (id: number) => void;
  onPostNow: (post: ScheduledPost) => void;
}

export function ScheduledPostsList({ scheduledPosts, onDeletePost, onPostNow }: ScheduledPostsListProps) {
  if (scheduledPosts.length === 0) {
    return (
      <div className="scheduler-page">
        <div className="empty-scheduler-page">
          <h2>No Scheduled Posts</h2>
          <p>Use the &quot;🗓️ Schedule&quot; button to plan your content in advance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="scheduler-page">
      <div className="scheduled-list-container">
        <div className="scheduled-list-header">
          <h2>Scheduled Posts</h2>
        </div>
        <ul className="scheduled-list">
          {scheduledPosts.map(post => (
            <li key={post.id} className="scheduled-item">
              <div className="scheduled-item-preview">
                <Image 
                  src={post.imageUrl} 
                  alt="Scheduled post preview" 
                  width={120} 
                  height={80} 
                  unoptimized 
                />
              </div>
              <div className="scheduled-item-details">
                <div className="scheduled-item-header">
                  <span className={`platform-tag ${post.platform.toLowerCase()}`}>
                    {post.platform}
                  </span>
                  <span className="scheduled-time">
                    {new Date(post.scheduledTime).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>
                <p className="scheduled-item-caption">{post.caption}</p>
              </div>
              <div className="scheduled-item-actions">
                <button 
                  onClick={() => onPostNow(post)} 
                  className="scheduled-item-button post-now-button" 
                  aria-label="Post now to Threads"
                  title="Post to Threads immediately"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    fill="currentColor" 
                    viewBox="0 0 16 16"
                  >
                    <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
                  </svg>
                  <span>Post Now</span>
                </button>
                <button 
                  onClick={() => onDeletePost(post.id)} 
                  className="scheduled-item-button cancel-button" 
                  aria-label="Cancel scheduled post"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    fill="currentColor" 
                    viewBox="0 0 16 16"
                  >
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                  </svg>
                  <span>Cancel</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
