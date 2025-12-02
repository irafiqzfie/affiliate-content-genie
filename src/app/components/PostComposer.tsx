'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface FacebookPage {
  id: string;
  pageId: string;
  pageName: string;
}

interface PostFormData {
  text: string;
  imageUrl: string;
}

export default function PostComposer() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<PostFormData>({
    text: '',
    imageUrl: '',
  });
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);
  const [hasThreads, setHasThreads] = useState(false);
  const [posting, setPosting] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    partial?: boolean;
    error?: string;
    results?: Array<{
      platform: string;
      success: boolean;
      postId?: string;
      error?: string;
      pageId?: string;
      pageName?: string;
    }>;
  } | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchConnections();
    }
  }, [session]);

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/auth/connections');
      if (response.ok) {
        const data = await response.json();
        setHasThreads(!!data.threads);
        setFacebookPages(data.facebook || []);
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    }
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const togglePage = (pageId: string) => {
    setSelectedPages(prev =>
      prev.includes(pageId)
        ? prev.filter(p => p !== pageId)
        : [...prev, pageId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.text.trim()) {
      alert('Please enter post text');
      return;
    }

    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }

    if (selectedPlatforms.includes('facebook') && selectedPages.length === 0) {
      alert('Please select at least one Facebook Page');
      return;
    }

    setPosting(true);
    setResult(null);

    try {
      const response = await fetch('/api/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: selectedPlatforms,
          content: {
            text: formData.text,
            imageUrl: formData.imageUrl || undefined,
          },
          facebookPageIds: selectedPages.length > 0 ? selectedPages : undefined,
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // Clear form on success
        setFormData({ text: '', imageUrl: '' });
        setSelectedPlatforms([]);
        setSelectedPages([]);
      }
    } catch (error) {
      console.error('Post error:', error);
      setResult({ error: 'Failed to create post' });
    } finally {
      setPosting(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="post-composer">
        <p>Please sign in to create posts.</p>
      </div>
    );
  }

  return (
    <div className="post-composer">
      <h2>Create Post</h2>

      <form onSubmit={handleSubmit}>
        {/* Post Content */}
        <div className="form-section">
          <label htmlFor="text">Post Text *</label>
          <textarea
            id="text"
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            placeholder="What's on your mind?"
            rows={6}
            required
          />
          <span className="char-count">{formData.text.length} characters</span>
        </div>

        {/* Image URL */}
        <div className="form-section">
          <label htmlFor="imageUrl">Image URL (optional)</label>
          <input
            type="url"
            id="imageUrl"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            placeholder="https://example.com/image.jpg"
          />
          {formData.imageUrl && (
            <div className="image-preview">
              <img src={formData.imageUrl} alt="Preview" />
            </div>
          )}
        </div>

        {/* Platform Selection */}
        <div className="form-section">
          <label>Select Platforms *</label>
          
          <div className="platform-options">
            {/* Threads */}
            <label className={`platform-option ${!hasThreads ? 'disabled' : ''}`}>
              <input
                type="checkbox"
                checked={selectedPlatforms.includes('threads')}
                onChange={() => togglePlatform('threads')}
                disabled={!hasThreads}
              />
              <span className="platform-name">🧵 Threads</span>
              {!hasThreads && (
                <span className="platform-status">Not connected</span>
              )}
            </label>

            {/* Facebook */}
            <label className={`platform-option ${facebookPages.length === 0 ? 'disabled' : ''}`}>
              <input
                type="checkbox"
                checked={selectedPlatforms.includes('facebook')}
                onChange={() => togglePlatform('facebook')}
                disabled={facebookPages.length === 0}
              />
              <span className="platform-name">📘 Facebook Pages</span>
              {facebookPages.length === 0 && (
                <span className="platform-status">Not connected</span>
              )}
            </label>
          </div>
        </div>

        {/* Facebook Page Selection */}
        {selectedPlatforms.includes('facebook') && facebookPages.length > 0 && (
          <div className="form-section">
            <label>Select Facebook Pages *</label>
            <div className="page-options">
              {facebookPages.map((page) => (
                <label key={page.id} className="page-option">
                  <input
                    type="checkbox"
                    checked={selectedPages.includes(page.pageId || '')}
                    onChange={() => togglePage(page.pageId || '')}
                  />
                  <span>{page.pageName}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={posting || selectedPlatforms.length === 0}
          className="submit-button"
        >
          {posting ? 'Posting...' : 'Publish Post'}
        </button>
      </form>

      {/* Result Display */}
      {result && (
        <div className={`result ${result.success ? 'success' : result.partial ? 'partial' : 'error'}`}>
          <h3>
            {result.success ? '✅ Success!' : result.partial ? '⚠️ Partial Success' : '❌ Failed'}
          </h3>
          
          {result.results && (
            <div className="result-details">
              {result.results.map((r, i: number) => (
                <div key={i} className={`result-item ${r.success ? 'success' : 'error'}`}>
                  <div className="result-platform">
                    {r.platform === 'threads' ? '🧵 Threads' : '📘 Facebook'}
                    {r.pageName && ` - ${r.pageName}`}
                  </div>
                  {r.success ? (
                    <div className="result-message">
                      ✅ Posted successfully
                      {r.postId && <span className="post-id">ID: {r.postId}</span>}
                    </div>
                  ) : (
                    <div className="result-error">
                      ❌ {r.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {result.error && !result.results && (
            <p className="error-message">{result.error}</p>
          )}
        </div>
      )}

      {/* Connection Prompt */}
      {(!hasThreads || facebookPages.length === 0) && (
        <div className="connection-prompt">
          <p>
            {!hasThreads && !facebookPages.length ? (
              <>No platforms connected. Please connect Threads and/or Facebook Pages to start posting.</>
            ) : !hasThreads ? (
              <>Threads not connected. Connect it to post to Threads.</>
            ) : (
              <>No Facebook Pages connected. Connect them to post to Facebook.</>
            )}
          </p>
          <a href="#connections" className="connect-link">
            → Go to Connections
          </a>
        </div>
      )}

      <style jsx>{`
        .post-composer {
          max-width: 800px;
          margin: 2rem auto;
          padding: 0 1rem;
        }

        h2 {
          font-size: 2rem;
          margin-bottom: 2rem;
        }

        form {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 2rem;
        }

        .form-section {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #333;
        }

        textarea, input[type="url"] {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-family: inherit;
          font-size: 1rem;
          resize: vertical;
        }

        textarea:focus, input:focus {
          outline: none;
          border-color: #1976d2;
        }

        .char-count {
          display: block;
          text-align: right;
          font-size: 0.875rem;
          color: #999;
          margin-top: 0.25rem;
        }

        .image-preview {
          margin-top: 1rem;
          border-radius: 8px;
          overflow: hidden;
          max-width: 400px;
        }

        .image-preview img {
          width: 100%;
          height: auto;
          display: block;
        }

        .platform-options, .page-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .platform-option, .page-option {
          display: flex;
          align-items: center;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .platform-option:hover:not(.disabled),
        .page-option:hover {
          background: #e9ecef;
        }

        .platform-option.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .platform-option input,
        .page-option input {
          margin-right: 0.75rem;
          cursor: pointer;
        }

        .platform-name {
          font-weight: 600;
          flex: 1;
        }

        .platform-status {
          font-size: 0.875rem;
          color: #f57c00;
        }

        .submit-button {
          width: 100%;
          padding: 1rem;
          background: #1976d2;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .submit-button:hover:not(:disabled) {
          background: #1565c0;
        }

        .submit-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .result {
          margin-top: 2rem;
          padding: 1.5rem;
          border-radius: 12px;
          border: 2px solid;
        }

        .result.success {
          background: #e8f5e9;
          border-color: #4caf50;
        }

        .result.partial {
          background: #fff3e0;
          border-color: #ff9800;
        }

        .result.error {
          background: #ffebee;
          border-color: #f44336;
        }

        .result h3 {
          margin: 0 0 1rem 0;
        }

        .result-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .result-item {
          padding: 1rem;
          border-radius: 8px;
        }

        .result-item.success {
          background: white;
          border: 1px solid #4caf50;
        }

        .result-item.error {
          background: white;
          border: 1px solid #f44336;
        }

        .result-platform {
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .result-message, .result-error {
          font-size: 0.875rem;
        }

        .post-id {
          display: block;
          font-size: 0.75rem;
          color: #666;
          margin-top: 0.25rem;
        }

        .error-message {
          margin: 0;
          color: #d32f2f;
        }

        .connection-prompt {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #fff3e0;
          border: 1px solid #ff9800;
          border-radius: 12px;
          text-align: center;
        }

        .connection-prompt p {
          margin: 0 0 1rem 0;
        }

        .connect-link {
          color: #1976d2;
          font-weight: 600;
          text-decoration: none;
        }

        .connect-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          form {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
