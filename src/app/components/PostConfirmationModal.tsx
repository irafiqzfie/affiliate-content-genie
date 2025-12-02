"use client"

import { useState } from 'react';

interface PostConfirmationModalProps {
  isOpen: boolean;
  platform: 'Facebook' | 'Threads';
  onClose: () => void;
  onConfirm: (options: PostOptions) => void;
  hasImage: boolean;
  hasLongForm: boolean;
  hasHook: boolean;
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
  hasHook
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
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.has('Threads')}
                    onChange={() => togglePlatform('Threads')}
                  />
                  <span className="checkbox-label">
                    <span className="option-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.186 3.998c-1.864 0-3.572.61-4.952 1.64-1.326 1.037-2.335 2.522-2.916 4.294l2.79.89c.456-1.391 1.232-2.496 2.22-3.207.99-.686 2.15-1.073 3.408-1.073 2.636 0 4.767 2.131 4.767 4.767 0 .702-.157 1.373-.44 1.977-.3.64-.753 1.2-1.314 1.626-.558.424-1.22.711-1.93.83v2.934c1.296-.171 2.465-.676 3.415-1.429 1.007-.797 1.805-1.857 2.317-3.078.52-1.247.79-2.63.79-4.086 0-3.9-3.17-7.07-7.07-7.07zM10.928 15.34v2.844c0 .7.566 1.266 1.266 1.266.7 0 1.266-.566 1.266-1.266V15.34h-2.532z"/>
                      </svg>
                    </span>
                    <strong>Threads</strong>
                  </span>
                </label>

                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.has('Facebook')}
                    onChange={() => togglePlatform('Facebook')}
                  />
                  <span className="checkbox-label">
                    <span className="option-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
                      </svg>
                    </span>
                    <strong>Facebook</strong>
                  </span>
                </label>
              </div>
            </div>

            <div className="option-section">
              <h3>Post Type</h3>
              
              {(hasHook && hasImage) && (
                <label className={`card-option ${postType === 'short-hook-picture' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="postType"
                    value="short-hook-picture"
                    checked={postType === 'short-hook-picture'}
                    onChange={(e) => setPostType(e.target.value as typeof postType)}
                  />
                  <span className="card-content">
                    <span className="card-icon">🎯📸</span>
                    <span className="card-text">
                      <strong>Short Hook + Picture</strong>
                    </span>
                  </span>
                </label>
              )}

              {hasHook && (
                <label className={`card-option ${postType === 'short-hook-text' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="postType"
                    value="short-hook-text"
                    checked={postType === 'short-hook-text'}
                    onChange={(e) => setPostType(e.target.value as typeof postType)}
                  />
                  <span className="card-content">
                    <span className="card-icon">🎯📝</span>
                    <span className="card-text">
                      <strong>Short Hook, Text Only</strong>
                    </span>
                  </span>
                </label>
              )}

              {hasLongForm && (
                <label className={`card-option ${postType === 'long-form-text' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="postType"
                    value="long-form-text"
                    checked={postType === 'long-form-text'}
                    onChange={(e) => setPostType(e.target.value as typeof postType)}
                  />
                  <span className="card-content">
                    <span className="card-icon">📄</span>
                    <span className="card-text">
                      <strong>Long-Form, Text Only</strong>
                    </span>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.186 3.998c-1.864 0-3.572.61-4.952 1.64-1.326 1.037-2.335 2.522-2.916 4.294l2.79.89c.456-1.391 1.232-2.496 2.22-3.207.99-.686 2.15-1.073 3.408-1.073 2.636 0 4.767 2.131 4.767 4.767 0 .702-.157 1.373-.44 1.977-.3.64-.753 1.2-1.314 1.626-.558.424-1.22.711-1.93.83v2.934c1.296-.171 2.465-.676 3.415-1.429 1.007-.797 1.805-1.857 2.317-3.078.52-1.247.79-2.63.79-4.086 0-3.9-3.17-7.07-7.07-7.07zM10.928 15.34v2.844c0 .7.566 1.266 1.266 1.266.7 0 1.266-.566 1.266-1.266V15.34h-2.532z"/>
                  </svg>
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
