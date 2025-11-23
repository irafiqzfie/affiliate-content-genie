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
  includeImage: boolean;
  textOnly: boolean;
  useLongForm: boolean;
  useHook: boolean;
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
  const [includeImage, setIncludeImage] = useState(hasImage);
  const [textOnly, setTextOnly] = useState(false);
  const [useLongForm, setUseLongForm] = useState(hasLongForm && !hasHook);
  const [useHook, setUseHook] = useState(hasHook);

  if (!isOpen) return null;

  const handleTextOnlyChange = (checked: boolean) => {
    setTextOnly(checked);
    if (checked) {
      setIncludeImage(false);
    }
  };

  const handleIncludeImageChange = (checked: boolean) => {
    setIncludeImage(checked);
    if (checked) {
      setTextOnly(false);
    }
  };

  const handleLongFormChange = (checked: boolean) => {
    setUseLongForm(checked);
    if (checked) {
      setUseHook(false);
    }
  };

  const handleHookChange = (checked: boolean) => {
    setUseHook(checked);
    if (checked) {
      setUseLongForm(false);
    }
  };

  const handleSubmit = () => {
    // Validate at least one text option is selected
    if (!useLongForm && !useHook) {
      alert('Please select at least one text format (Long-form or Hook)');
      return;
    }

    onConfirm({
      includeImage: includeImage && !textOnly,
      textOnly,
      useLongForm,
      useHook
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content post-confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📤 Confirm Post to {platform}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Select what you want to include in your {platform} post:
          </p>

          <div className="post-options-grid">
            <div className="option-section">
              <h3>Post Format</h3>
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={textOnly}
                  onChange={(e) => handleTextOnlyChange(e.target.checked)}
                />
                <span className="checkbox-label">
                  <span className="option-icon">📝</span>
                  <span className="option-text">
                    <strong>Post text only</strong>
                    <small>No image will be included</small>
                  </span>
                </span>
              </label>

              <label className={`checkbox-option ${!hasImage ? 'disabled' : ''}`}>
                <input
                  type="checkbox"
                  checked={includeImage && !textOnly}
                  onChange={(e) => handleIncludeImageChange(e.target.checked)}
                  disabled={!hasImage || textOnly}
                />
                <span className="checkbox-label">
                  <span className="option-icon">🖼️</span>
                  <span className="option-text">
                    <strong>Post with picture</strong>
                    <small>{hasImage ? 'Include generated image' : 'No image available'}</small>
                  </span>
                </span>
              </label>
            </div>

            <div className="option-section">
              <h3>Text Content</h3>
              <label className={`checkbox-option ${!hasLongForm ? 'disabled' : ''}`}>
                <input
                  type="checkbox"
                  checked={useLongForm}
                  onChange={(e) => handleLongFormChange(e.target.checked)}
                  disabled={!hasLongForm}
                />
                <span className="checkbox-label">
                  <span className="option-icon">📄</span>
                  <span className="option-text">
                    <strong>Use long-form copywriting</strong>
                    <small>{hasLongForm ? 'Detailed, comprehensive content' : 'Not available'}</small>
                  </span>
                </span>
              </label>

              <label className={`checkbox-option ${!hasHook ? 'disabled' : ''}`}>
                <input
                  type="checkbox"
                  checked={useHook}
                  onChange={(e) => handleHookChange(e.target.checked)}
                  disabled={!hasHook}
                />
                <span className="checkbox-label">
                  <span className="option-icon">🎯</span>
                  <span className="option-text">
                    <strong>Use short-form hook</strong>
                    <small>{hasHook ? 'Punchy, attention-grabbing' : 'Not available'}</small>
                  </span>
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="modal-btn primary" onClick={handleSubmit}>
            {platform === 'Facebook' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 192 192">
                <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6866C105.707 61.7589 111.932 64.1498 116.137 68.848C118.675 71.6555 120.342 75.0943 121.142 79.1583C115.316 76.9103 108.644 75.7828 101.337 75.7828C74.0963 75.7828 58.7056 88.9788 58.7056 108.159C58.7056 117.207 62.1986 125.202 68.5695 130.45C74.5103 135.331 82.5887 137.827 91.9257 137.827C108.593 137.827 119.69 130.242 125.556 115.693C129.445 125.418 136.331 132.224 146.212 135.965L154.193 120.276C147.347 117.801 143.132 113.536 141.537 108.221C139.455 101.333 139.455 92.4562 141.537 88.9883ZM97.4576 121.866C86.8339 121.866 80.8128 117.498 80.8128 108.159C80.8128 98.8205 86.8339 94.4524 97.4576 94.4524C103.42 94.4524 109.022 95.4805 113.783 97.4524C113.783 116.632 106.668 121.866 97.4576 121.866Z"/>
              </svg>
            )}
            Confirm & Post
          </button>
        </div>
      </div>
    </div>
  );
}
