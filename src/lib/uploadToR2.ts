interface UploadResult {
  success: boolean;
  publicUrl?: string;
  fileKey?: string;
  error?: string;
}

/**
 * Upload image to R2 (client-side)
 * 1. Get presigned URL from API
 * 2. Upload directly to R2
 * 3. Return public URL
 */
export async function uploadImageToR2(file: File): Promise<UploadResult> {
  try {
    // Step 1: Get presigned upload URL
    const response = await fetch('/api/r2/upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        folder: 'user-content',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get upload URL');
    }

    const { uploadUrl, publicUrl, fileKey } = await response.json();

    // Step 2: Upload directly to R2 using presigned URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload to R2');
    }

    console.log('✅ Uploaded to R2:', publicUrl);

    return {
      success: true,
      publicUrl,
      fileKey,
    };
  } catch (error) {
    console.error('❌ Upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Upload base64 image to R2 (for existing flows)
 */
export async function uploadBase64ToR2(dataUrl: string): Promise<UploadResult> {
  try {
    // Use existing upload-image endpoint with R2 enabled
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData: dataUrl,
        useR2: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload');
    }

    const { url, fileKey } = await response.json();

    return {
      success: true,
      publicUrl: url,
      fileKey,
    };
  } catch (error) {
    console.error('❌ Upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}
