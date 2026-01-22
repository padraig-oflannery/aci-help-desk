/**
 * S3 Storage Service
 * 
 * Handles file uploads/downloads with S3-compatible storage (MinIO/R2).
 */

import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { env } from '../config/env';

// Get configuration from environment variables
const isR2 = !!env.R2_ACCESS_KEY_ID;

const rawEndpoint = isR2 ? env.R2_ENDPOINT : (env.S3_ENDPOINT || 'http://localhost:9000');
const accessKeyId = isR2 ? env.R2_ACCESS_KEY_ID : (env.S3_ACCESS_KEY_ID || 'minioadmin');
const secretAccessKey = isR2 ? env.R2_SECRET_ACCESS_KEY : (env.S3_SECRET_ACCESS_KEY || 'minioadmin');
const region = isR2 ? 'auto' : (env.S3_REGION || 'us-east-1');

// Parse endpoint and bucket
let endpoint = rawEndpoint || '';
let bucketName = env.S3_BUCKET_NAME || 'helpdesk-storage';

if (isR2 && rawEndpoint) {
    try {
        const url = new URL(rawEndpoint);
        if (url.pathname !== '/' && url.pathname !== '') {
            // If the endpoint contains a path, it's likely the bucket name
            bucketName = url.pathname.substring(1);
            endpoint = url.origin;
        }
    } catch (e) {
        console.warn('Invalid R2_ENDPOINT format, using as is');
    }
}

// Create S3 client
const s3Client = new S3Client({
    endpoint,
    region,
    credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
    },
    forcePathStyle: isR2 ? true : env.S3_FORCE_PATH_STYLE !== false,
});

const BUCKET_NAME = bucketName;
const URL_EXPIRY = 3600; // 1 hour

/**
 * Generate a signed URL for downloading a file
 */
export async function getSignedDownloadUrl(
    storageKey: string,
    expiresIn: number = URL_EXPIRY
): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: storageKey,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a signed URL for uploading a file
 */
export async function getSignedUploadUrl(
    storageKey: string,
    contentType: string,
    expiresIn: number = URL_EXPIRY
): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: storageKey,
        ContentType: contentType,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete a file from storage
 */
export async function deleteFile(storageKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: storageKey,
    });

    await s3Client.send(command);
}

/**
 * Generate a unique storage key
 */
export function generateStorageKey(prefix: string, filename: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = filename.split('.').pop() || '';
    return `${prefix}/${timestamp}-${random}.${ext}`;
}

// Export client for direct access if needed
export { s3Client, BUCKET_NAME };
