import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'affiliate-content-genie';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev`;

export interface UploadConfig {
  folder: 'user-content' | 'placeholders' | 'generated';
  userId?: string;
  fileName: string;
  contentType: string;
  expiresIn?: number; // seconds, default 3600 (1 hour)
}

/**
 * Generate presigned URL for client-side upload
 */
export async function generatePresignedUploadUrl(config: UploadConfig) {
  const { folder, userId, fileName, contentType, expiresIn = 3600 } = config;
  
  // Generate unique file key
  const timestamp = Date.now();
  const uuid = uuidv4();
  const extension = fileName.split('.').pop();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  let fileKey: string;
  if (folder === 'user-content' && userId) {
    fileKey = `${folder}/${userId}/${uuid}-${timestamp}.${extension}`;
  } else {
    fileKey = `${folder}/${uuid}-${timestamp}-${sanitizedName}`;
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable', // Cache for 1 year
  });

  const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn });

  return {
    uploadUrl: presignedUrl,
    fileKey,
    publicUrl: `${PUBLIC_URL}/${fileKey}`,
  };
}

/**
 * Upload buffer directly to R2 (server-side)
 */
export async function uploadToR2(config: {
  buffer: Buffer;
  contentType: string;
  folder: 'user-content' | 'placeholders' | 'generated';
  userId?: string;
  fileName?: string;
}): Promise<{ publicUrl: string; fileKey: string }> {
  const { buffer, contentType, folder, userId, fileName } = config;
  
  const timestamp = Date.now();
  const uuid = uuidv4();
  const extension = contentType.split('/')[1];
  
  let fileKey: string;
  if (folder === 'user-content' && userId) {
    fileKey = `${folder}/${userId}/${uuid}-${timestamp}.${extension}`;
  } else if (fileName) {
    const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    fileKey = `${folder}/${uuid}-${timestamp}-${sanitized}`;
  } else {
    fileKey = `${folder}/${uuid}-${timestamp}.${extension}`;
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable', // Cache for 1 year
  });

  await r2Client.send(command);

  return {
    publicUrl: `${PUBLIC_URL}/${fileKey}`,
    fileKey,
  };
}

/**
 * Delete file from R2
 */
export async function deleteFromR2(fileKey: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  });

  await r2Client.send(command);
}

/**
 * Check if file exists
 */
export async function fileExists(fileKey: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });
    await r2Client.send(command);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get public URL for a file key
 */
export function getPublicUrl(fileKey: string): string {
  return `${PUBLIC_URL}/${fileKey}`;
}

/**
 * Extract file key from R2 URL
 */
export function extractFileKey(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1); // Remove leading slash
  } catch {
    return null;
  }
}

/**
 * Check if URL is from R2
 */
export function isR2Url(url: string): boolean {
  return url.includes('.r2.dev') || url.includes('cdn.inabiz.online') || url.includes('.r2.cloudflarestorage.com');
}

/**
 * Check if URL is from Vercel Blob (backward compatibility)
 */
export function isVercelBlobUrl(url: string): boolean {
  return url.includes('blob.vercel-storage.com') || url.includes('public.blob.vercel-storage.com');
}
