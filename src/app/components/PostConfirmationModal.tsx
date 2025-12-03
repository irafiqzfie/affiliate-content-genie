"use client"

import { useState } from 'react';
import { ThreadsIcon } from './ThreadsIcon';

interface PostConfirmationModalProps {
  isOpen: boolean;
  platform: 'Facebook' | 'Threads';
  onClose: () => void;
  onConfirm: (options: PostOptions) => void;
  hasImage: boolean;
  hasLongForm: boolean;
  hasHook: boolean;
  connectedPlatforms: { threads: boolean; facebook: boolean };
}

export interface PostOptions {
  postType: 'short-hook-picture' | 'short-hook-text' | 'long-form-text';
  selectedPlatforms: Array<'Facebook' | 'Threads'>;
  affiliateLink?: string;
}

export default function PostConfirmationModal({
  isOpen,
  platform,
  onClose,
  onConfirm,
  hasImage,
  hasLongForm,
  hasHook,
  connectedPlatforms
}: PostConfirmationModalProps) {
  const [postType, setPostType] = useState<'short-hook-picture' | 'short-hook-text' | 'long-form-text'>(
    hasImage && hasHook ? 'short-hook-picture' : (hasHook ? 'short-hook-text' : 'long-form-text')
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<'Facebook' | 'Threads'>>(new Set(['Threads']));
  const [affiliateLink, setAffiliateLink] = useState('');

  if (!isOpen) return null;

  const togglePlatform = (plat: 'Facebook' | 'Threads') => {
    const newPlatforms = new Set(selectedPlatforms);
    if (newPlatforms.has(plat)) {
      newPlatforms.delete(plat);
    } else {
      newPlatforms.add(plat);
    }
    setSelectedPlatforms(newPlatforms);
  };

  const handleSubmit = () => {
    // Validate platform selection
    if (selectedPlatforms.size === 0) {
      alert('Please select at least one platform');
      return;
    }

    const typeMap = {
      'short-hook-picture': { useHook: true, includeImage: true, textOnly: false, useLongForm: false },
      'short-hook-text': { useHook: true, includeImage: false, textOnly: true, useLongForm: false },
      'long-form-text': { useHook: false, includeImage: false, textOnly: true, useLongForm: true }
    };

    const typeConfig = typeMap[postType];

    onConfirm({
      postType,
      selectedPlatforms: Array.from(selectedPlatforms),
      affiliateLink: affiliateLink.trim() || undefined
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content post-confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📤 Confirm Post</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Select platforms and configure your post:
          </p>

          <div className="post-options-grid">
            <div className="option-section">
              <h3>Post to Platforms</h3>
              <div className="platforms-container">
                <label className={`checkbox-option ${!connectedPlatforms.threads ? 'disabled' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.has('Threads')}
                    onChange={() => togglePlatform('Threads')}
                    disabled={!connectedPlatforms.threads}
                  />
                  <span className="checkbox-label">
                    <span className="option-icon">
                      <ThreadsIcon size={20} />
                    </span>
                    <strong>Threads</strong>
                    {!connectedPlatforms.threads && <span style={{ color: '#f59e0b', fontSize: '0.75rem', marginLeft: '0.5rem' }}>⚠️ Not connected</span>}
                  </span>
                </label>

                <label className={`checkbox-option ${!connectedPlatforms.facebook ? 'disabled' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.has('Facebook')}
                    onChange={() => togglePlatform('Facebook')}
                    disabled={!connectedPlatforms.facebook}
                  />
                  <span className="checkbox-label">
                    <span className="option-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
                      </svg>
                    </span>
                    <strong>Facebook</strong>
                    {!connectedPlatforms.facebook && <span style={{ color: '#f59e0b', fontSize: '0.75rem', marginLeft: '0.5rem' }}>⚠️ Not connected</span>}
                  </span>
                </label>
              </div>
            </div>

            <div className="option-section">
              <h3>Post Type</h3>
              <p className="section-description">Choose how your content will appear on social media</p>
              
              {(hasHook && hasImage) && (
                <label className={`card-option-compact ${postType === 'short-hook-picture' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="postType"
                    value="short-hook-picture"
                    checked={postType === 'short-hook-picture'}
                    onChange={(e) => setPostType(e.target.value as typeof postType)}
                  />
                  <span className="compact-icon">🎯📸</span>
                  <span className="compact-content">
                    <strong>Short Hook + Picture</strong>
                    <small>1-2 lines plus attached image. Great for fast scroll.</small>
                  </span>
                </label>
              )}

              {hasHook && (
                <label className={`card-option-compact ${postType === 'short-hook-text' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="postType"
                    value="short-hook-text"
                    checked={postType === 'short-hook-text'}
                    onChange={(e) => setPostType(e.target.value as typeof postType)}
                  />
                  <span className="compact-icon">🎯📝</span>
                  <span className="compact-content">
                    <strong>Short Hook, Text Only</strong>
                    <small>Quick attention-grabber without media attachment.</small>
                  </span>
                </label>
              )}

              {hasLongForm && (
                <label className={`card-option-compact ${postType === 'long-form-text' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="postType"
                    value="long-form-text"
                    checked={postType === 'long-form-text'}
                    onChange={(e) => setPostType(e.target.value as typeof postType)}
                  />
                  <span className="compact-icon">📄</span>
                  <span className="compact-content">
                    <strong>Long-Form, Text Only</strong>
                    <small>Full detailed post with storytelling and depth.</small>
                  </span>
                </label>
              )}
            </div>

            <div className="option-section">
              <h3>Affiliate Link (Optional)</h3>
              <div className="input-field-wrapper">
                <input
                  type="url"
                  className="affiliate-link-input"
                  placeholder="https://example.com/affiliate-link"
                  value={affiliateLink}
                  onChange={(e) => setAffiliateLink(e.target.value)}
                />
                <small className="input-hint">Will be posted as a comment after the main post</small>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="modal-btn primary" onClick={handleSubmit}>
            {selectedPlatforms.size === 0 ? (
              '⚠️ Select Platform'
            ) : selectedPlatforms.size === 1 ? (
              <>
                {selectedPlatforms.has('Facebook') && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
                  </svg>
                )}
                {selectedPlatforms.has('Threads') && (
                  <ThreadsIcon size={16} />
                )}
                Post to {Array.from(selectedPlatforms)[0]}
              </>
            ) : (
              `📤 Post to ${selectedPlatforms.size} Platforms`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
