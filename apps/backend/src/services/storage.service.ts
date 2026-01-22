/**
 * Storage Service
 * 
 * Business logic for managing storage objects (Cloudflare R2).
 */

import { eq, and } from 'drizzle-orm';
import { db, storageObjects } from '../db';
import type { StorageObject } from '../db/schema/storage';
import { getSignedDownloadUrl, deleteFile } from '../lib/s3';

// ============================================
// Storage Object Operations
// ============================================

export async function getStorageObjectById(id: string): Promise<StorageObject | null> {
    const [obj] = await db
        .select()
        .from(storageObjects)
        .where(eq(storageObjects.id, id))
        .limit(1);
    return obj || null;
}

export async function getStorageObjectByKey(bucket: string, objectKey: string): Promise<StorageObject | null> {
    const [obj] = await db
        .select()
        .from(storageObjects)
        .where(
            and(
                eq(storageObjects.bucket, bucket),
                eq(storageObjects.objectKey, objectKey)
            )
        )
        .limit(1);
    return obj || null;
}

export async function createStorageObject(data: {
    bucket: string;
    objectKey: string;
    mimeType: string;
    sizeBytes: number;
    sha256?: string;
    provider?: string;
}) {
    const [obj] = await db.insert(storageObjects).values(data).returning();
    return obj;
}

export async function deleteStorageObject(id: string) {
    // Get the object first to get its key
    const obj = await getStorageObjectById(id);
    if (obj) {
        // Delete from S3
        await deleteFile(obj.objectKey);
        // Delete from database
        await db.delete(storageObjects).where(eq(storageObjects.id, id));
    }
}

export async function getStorageObjectWithUrl(id: string) {
    const obj = await getStorageObjectById(id);
    if (!obj) return null;

    const url = await getSignedDownloadUrl(obj.objectKey);
    return { ...obj, url };
}

// ============================================
// Batch Operations
// ============================================

export async function createStorageObjects(objects: Array<{
    bucket: string;
    objectKey: string;
    mimeType: string;
    sizeBytes: number;
    sha256?: string;
}>) {
    return db.insert(storageObjects).values(objects).returning();
}

