'use client';

import { useState } from 'react';

export default function BlobManagementPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [blobList, setBlobList] = useState<any[]>([]);
  const [showList, setShowList] = useState(false);

  const listBlobs = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/blob/delete-all');
      const data = await response.json();
      
      if (response.ok) {
        setBlobList(data.blobs);
        setShowList(true);
        setMessage(`Found ${data.count} blobs`);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteAllBlobs = async () => {
    if (!confirm('Are you sure you want to delete ALL blobs? This cannot be undone!')) {
      return;
    }

    setLoading(true);
    setMessage('Deleting all blobs...');
    try {
      const response = await fetch('/api/blob/delete-all', {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        setShowList(false);
        setBlobList([]);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1>Vercel Blob Management</h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>
        Manage your Vercel Blob storage. Use this when you hit the 2,000 request limit.
      </p>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        <button
          onClick={listBlobs}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          {loading ? 'Loading...' : 'List All Blobs'}
        </button>

        <button
          onClick={deleteAllBlobs}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          {loading ? 'Deleting...' : 'Delete All Blobs'}
        </button>
      </div>

      {message && (
        <div style={{
          padding: '16px',
          backgroundColor: message.includes('Error') ? '#fee' : '#efe',
          border: `1px solid ${message.includes('Error') ? '#fcc' : '#cfc'}`,
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          {message}
        </div>
      )}

      {showList && blobList.length > 0 && (
        <div>
          <h2>Stored Blobs ({blobList.length})</h2>
          <div style={{
            backgroundColor: '#f5f5f5',
            padding: '16px',
            borderRadius: '8px',
            maxHeight: '400px',
            overflow: 'auto'
          }}>
            {blobList.map((blob, index) => (
              <div
                key={index}
                style={{
                  padding: '12px',
                  backgroundColor: 'white',
                  marginBottom: '8px',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {blob.pathname}
                </div>
                <div style={{ color: '#666', fontSize: '12px' }}>
                  Size: {(blob.size / 1024).toFixed(2)} KB | 
                  Uploaded: {new Date(blob.uploadedAt).toLocaleString()}
                </div>
                <div style={{ 
                  color: '#0070f3', 
                  fontSize: '12px',
                  wordBreak: 'break-all',
                  marginTop: '4px'
                }}>
                  {blob.url}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        marginTop: '48px',
        padding: '24px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginTop: 0 }}>📝 How to Create a New Blob Store:</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li>Go to your Vercel project dashboard</li>
          <li>Navigate to <strong>Storage</strong> tab</li>
          <li>Click <strong>Create Database</strong></li>
          <li>Select <strong>Blob</strong></li>
          <li>Click <strong>Continue</strong></li>
          <li>The new <code>BLOB_READ_WRITE_TOKEN</code> will be automatically added to your environment variables</li>
          <li>Redeploy your application</li>
        </ol>
        <p style={{ marginBottom: 0, color: '#856404' }}>
          <strong>Note:</strong> After creating a new blob store, delete all blobs from the old store first, then update to the new token.
        </p>
      </div>
    </div>
  );
}
