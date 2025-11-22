'use client';

import React, { useState, useMemo } from 'react';
import { SavedItem } from '@/app/types';

interface SavedItemsListProps {
  savedList: SavedItem[];
  onLoadItem: (item: SavedItem) => void;
  onDeleteItem: (id: number) => void;
}

export function SavedItemsList({ savedList, onLoadItem, onDeleteItem }: SavedItemsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  const processedSavedList = useMemo(() => {
    let filtered = savedList;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.title.toLowerCase().includes(term) ||
          (item.productLink && item.productLink.toLowerCase().includes(term))
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  }, [savedList, searchTerm, sortOrder]);

  if (savedList.length === 0) {
    return (
      <div className="saved-page">
        <div className="empty-saved-page">
          <h2>No Saved Ideas Yet</h2>
          <p>Generate some content and click the &quot;💾 Save&quot; button to see your ideas here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-page">
      <div className="saved-list-container">
        <div className="saved-list-header">
          <h2>Saved Ideas</h2>
          <div className="saved-list-controls">
            <input
              type="search"
              placeholder="Search by title or link..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search saved ideas"
            />
            <select
              className="sort-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              aria-label="Sort saved ideas"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {processedSavedList.length > 0 ? (
          <ul className="saved-list">
            {processedSavedList.map(item => (
              <li key={item.id} className="saved-item">
                <div className="saved-item-info">
                  <span className="saved-item-type">🎬 Video + ✍️ Post</span>
                  <span className="saved-item-title">{item.title}</span>
                  {item.productLink && (
                    <span className="saved-item-link">{item.productLink}</span>
                  )}
                  {item.createdAt && (
                    <span className="saved-item-date">
                      {new Date(item.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
                <div className="saved-item-actions">
                  <button 
                    onClick={() => onLoadItem(item)} 
                    className="saved-item-button load-button"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      fill="currentColor" 
                      viewBox="0 0 16 16"
                    >
                      <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                      <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                    </svg>
                    Load
                  </button>
                  <button 
                    onClick={() => onDeleteItem(item.id)} 
                    className="saved-item-button delete-button" 
                    aria-label="Delete saved item"
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
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-results-message">No saved ideas match your search.</p>
        )}
      </div>
    </div>
  );
}
