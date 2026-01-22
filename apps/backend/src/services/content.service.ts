/**
 * Content Service
 * 
 * Business logic for unified content items, categories, and tags.
 * Replaces the previous KB service.
 */

import { eq, and, or, ilike, desc, asc, sql, inArray } from 'drizzle-orm';
import {
    db,
    contentItems,
    contentArticleBodies,
    contentItemTags,
    contentCategories,
    contentTags,
    contentAssets,
    storageObjects,
} from '../db';
import type {
    ContentItem,
    ContentCategory,
    ContentKind,
    ContentStatus,
    ContentAssetRole,
    TipTapDocument,
} from '../db/schema/content';
import { getSignedDownloadUrl } from '../lib/s3';

// ============================================
// Categories
// ============================================

export async function getCategories() {
    return db.select().from(contentCategories).orderBy(asc(contentCategories.name));
}

export async function getCategoryBySlug(slug: string): Promise<ContentCategory | null> {
    const [category] = await db.select().from(contentCategories).where(eq(contentCategories.slug, slug)).limit(1);
    return category || null;
}

export async function getCategoryById(id: string): Promise<ContentCategory | null> {
    const [category] = await db.select().from(contentCategories).where(eq(contentCategories.id, id)).limit(1);
    return category || null;
}

export async function createCategory(data: { name: string; slug: string }) {
    const [category] = await db.insert(contentCategories).values(data).returning();
    return category;
}

export async function updateCategory(id: string, data: { name?: string; slug?: string }) {
    const [category] = await db.update(contentCategories).set(data).where(eq(contentCategories.id, id)).returning();
    return category;
}

export async function deleteCategory(id: string) {
    await db.delete(contentCategories).where(eq(contentCategories.id, id));
}

// ============================================
// Tags
// ============================================

export async function getTags() {
    return db.select().from(contentTags).orderBy(asc(contentTags.name));
}

export async function getTagBySlug(slug: string) {
    const [tag] = await db.select().from(contentTags).where(eq(contentTags.slug, slug)).limit(1);
    return tag || null;
}

export async function createTag(data: { name: string; slug: string }) {
    const [tag] = await db.insert(contentTags).values(data).returning();
    return tag;
}

export async function updateTag(id: string, data: { name?: string; slug?: string }) {
    const [tag] = await db.update(contentTags).set(data).where(eq(contentTags.id, id)).returning();
    return tag;
}

export async function deleteTag(id: string) {
    await db.delete(contentTags).where(eq(contentTags.id, id));
}

// ============================================
// Content Items
// ============================================

interface ContentItemFilters {
    kind?: ContentKind;
    status?: ContentStatus;
    categoryId?: string;
    createdByUserId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}

export async function getContentItems(filters: ContentItemFilters = {}, includeUnpublished = false) {
    const { kind, status, categoryId, createdByUserId, search, page = 1, pageSize = 20 } = filters;
    const offset = (page - 1) * pageSize;

    let query = db.select().from(contentItems);
    const conditions = [];

    if (!includeUnpublished) {
        conditions.push(eq(contentItems.status, 'PUBLISHED'));
    } else if (status) {
        conditions.push(eq(contentItems.status, status));
    }

    if (kind) {
        conditions.push(eq(contentItems.kind, kind));
    }

    if (categoryId) {
        conditions.push(eq(contentItems.categoryId, categoryId));
    }

    if (createdByUserId) {
        conditions.push(eq(contentItems.createdByUserId, createdByUserId));
    }

    if (search) {
        conditions.push(
            or(
                ilike(contentItems.title, `%${search}%`),
                ilike(contentItems.summary, `%${search}%`)
            )
        );
    }

    if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
    }

    const items = await query
        .orderBy(desc(contentItems.publishedAt), desc(contentItems.createdAt))
        .limit(pageSize)
        .offset(offset);

    // Get total count
    const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(contentItems)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

    return {
        items,
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize),
    };
}

export async function getContentItemById(id: string): Promise<ContentItem | null> {
    const [item] = await db.select().from(contentItems).where(eq(contentItems.id, id)).limit(1);
    return item || null;
}

export async function getContentItemWithDetails(id: string, resolveAssetUrls = false) {
    const item = await getContentItemById(id);
    if (!item) return null;

    let body = null;
    let bodyJson = null;

    if (item.kind === 'ARTICLE') {
        const [articleBody] = await db.select().from(contentArticleBodies).where(eq(contentArticleBodies.contentItemId, id)).limit(1);
        body = articleBody?.bodyMarkdown;
        bodyJson = articleBody?.bodyJson;
    }

    // Get category
    let category = null;
    if (item.categoryId) {
        category = await getCategoryById(item.categoryId);
    }

    // Get tags
    const itemTags = await db
        .select({ tag: contentTags })
        .from(contentItemTags)
        .innerJoin(contentTags, eq(contentItemTags.tagId, contentTags.id))
        .where(eq(contentItemTags.contentItemId, id));

    // Get assets with storage object info
    const assets = await db
        .select({
            id: contentAssets.id,
            contentItemId: contentAssets.contentItemId,
            storageObjectId: contentAssets.storageObjectId,
            assetRole: contentAssets.assetRole,
            filename: contentAssets.filename,
            altText: contentAssets.altText,
            caption: contentAssets.caption,
            createdAt: contentAssets.createdAt,
            storageKey: storageObjects.objectKey,
            mimeType: storageObjects.mimeType,
            sizeBytes: storageObjects.sizeBytes,
        })
        .from(contentAssets)
        .innerJoin(storageObjects, eq(contentAssets.storageObjectId, storageObjects.id))
        .where(eq(contentAssets.contentItemId, id));

    // Resolve asset URLs if requested
    let resolvedAssets = assets;
    if (resolveAssetUrls) {
        resolvedAssets = await Promise.all(
            assets.map(async (asset) => ({
                ...asset,
                url: await getSignedDownloadUrl(asset.storageKey),
            }))
        );
    }

    return {
        ...item,
        body,
        bodyJson,
        category,
        tags: itemTags.map(t => t.tag),
        assets: resolvedAssets,
    };
}

/**
 * Convert TipTap JSON to plaintext for search indexing
 */
function tipTapToPlaintext(doc: TipTapDocument | null): string {
    if (!doc || !doc.content) return '';

    const extractText = (nodes: any[]): string => {
        return nodes.map(node => {
            if (node.text) return node.text;
            if (node.content) return extractText(node.content);
            return '';
        }).join(' ');
    };

    return extractText(doc.content).replace(/\s+/g, ' ').trim();
}

/**
 * Convert TipTap JSON to basic markdown for export/fallback
 */
function tipTapToMarkdown(doc: TipTapDocument | null): string {
    if (!doc || !doc.content) return '';

    const convertNode = (node: any): string => {
        switch (node.type) {
            case 'paragraph':
                return node.content ? node.content.map(convertNode).join('') + '\n\n' : '\n\n';
            case 'heading':
                const level = node.attrs?.level || 1;
                const headingText = node.content ? node.content.map(convertNode).join('') : '';
                return '#'.repeat(level) + ' ' + headingText + '\n\n';
            case 'text':
                let text = node.text || '';
                if (node.marks) {
                    node.marks.forEach((mark: any) => {
                        switch (mark.type) {
                            case 'bold': text = `**${text}**`; break;
                            case 'italic': text = `*${text}*`; break;
                            case 'code': text = `\`${text}\``; break;
                            case 'link': text = `[${text}](${mark.attrs?.href || ''})`; break;
                        }
                    });
                }
                return text;
            case 'bulletList':
                return node.content ? node.content.map((item: any) => '- ' + convertNode(item)).join('') : '';
            case 'orderedList':
                return node.content ? node.content.map((item: any, i: number) => `${i + 1}. ` + convertNode(item)).join('') : '';
            case 'listItem':
                return node.content ? node.content.map(convertNode).join('').trim() + '\n' : '';
            case 'codeBlock':
                const code = node.content ? node.content.map(convertNode).join('') : '';
                return '```\n' + code + '\n```\n\n';
            case 'blockquote':
                const quote = node.content ? node.content.map(convertNode).join('') : '';
                return quote.split('\n').map((line: string) => '> ' + line).join('\n') + '\n\n';
            case 'image':
                return `![${node.attrs?.alt || ''}](asset:${node.attrs?.assetId || ''})\n\n`;
            case 'video':
                return `[Video: ${node.attrs?.assetId || ''}]\n\n`;
            default:
                return node.content ? node.content.map(convertNode).join('') : '';
        }
    };

    return doc.content.map(convertNode).join('').trim();
}

export async function createContentItem(data: {
    kind: ContentKind;
    title: string;
    summary?: string;
    categoryId?: string;
    status?: ContentStatus;
    visibility?: 'ALL_EMPLOYEES' | 'ADMINS_ONLY';
    createdByUserId: string;
    bodyMarkdown?: string;
    bodyJson?: TipTapDocument;
    tagIds?: string[];
}) {
    const { bodyMarkdown, bodyJson, tagIds, ...itemData } = data;

    // Create content item
    const [item] = await db.insert(contentItems).values({
        ...itemData,
        publishedAt: itemData.status === 'PUBLISHED' ? new Date() : null,
    }).returning();

    // Create article body if article
    if (data.kind === 'ARTICLE') {
        // If bodyJson is provided, use it as source of truth
        if (bodyJson) {
            await db.insert(contentArticleBodies).values({
                contentItemId: item.id,
                bodyJson: bodyJson as unknown as Record<string, unknown>,
                bodyMarkdown: tipTapToMarkdown(bodyJson),
                bodyPlaintext: tipTapToPlaintext(bodyJson),
                schemaVersion: 1,
            });
        } else if (bodyMarkdown) {
            // Fallback to markdown only
            await db.insert(contentArticleBodies).values({
                contentItemId: item.id,
                bodyMarkdown,
                bodyPlaintext: bodyMarkdown.replace(/[#*_`~\[\]()]/g, ' ').replace(/\s+/g, ' ').trim(),
                schemaVersion: 1,
            });
        }
    }

    // Add tags
    if (tagIds && tagIds.length > 0) {
        await db.insert(contentItemTags).values(
            tagIds.map(tagId => ({ contentItemId: item.id, tagId }))
        );
    }

    return item;
}

export async function updateContentItem(id: string, data: {
    title?: string;
    summary?: string;
    categoryId?: string | null;
    status?: ContentStatus;
    visibility?: 'ALL_EMPLOYEES' | 'ADMINS_ONLY';
    updatedByUserId?: string;
    bodyMarkdown?: string;
    bodyJson?: TipTapDocument;
    tagIds?: string[];
}) {
    const { bodyMarkdown, bodyJson, tagIds, ...itemData } = data;

    // Get current item
    const current = await getContentItemById(id);
    if (!current) return null;

    // Handle publishing
    const updateData: Record<string, unknown> = {
        ...itemData,
        updatedAt: new Date(),
    };

    if (data.status === 'PUBLISHED' && current.status !== 'PUBLISHED') {
        updateData.publishedAt = new Date();
    }

    // Update item
    const [item] = await db.update(contentItems).set(updateData).where(eq(contentItems.id, id)).returning();

    // Update article body
    if (current.kind === 'ARTICLE' && (bodyJson !== undefined || bodyMarkdown !== undefined)) {
        const bodyData: Record<string, unknown> = {};

        if (bodyJson !== undefined) {
            bodyData.bodyJson = bodyJson as unknown as Record<string, unknown>;
            bodyData.bodyMarkdown = tipTapToMarkdown(bodyJson);
            bodyData.bodyPlaintext = tipTapToPlaintext(bodyJson);
        } else if (bodyMarkdown !== undefined) {
            bodyData.bodyMarkdown = bodyMarkdown;
            bodyData.bodyPlaintext = bodyMarkdown.replace(/[#*_`~\[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
        }

        await db
            .insert(contentArticleBodies)
            .values({
                contentItemId: id,
                bodyMarkdown: bodyData.bodyMarkdown as string || '',
                bodyPlaintext: bodyData.bodyPlaintext as string,
                bodyJson: bodyData.bodyJson as Record<string, unknown>,
                schemaVersion: 1,
            })
            .onConflictDoUpdate({
                target: contentArticleBodies.contentItemId,
                set: bodyData,
            });
    }

    // Update tags
    if (tagIds !== undefined) {
        await db.delete(contentItemTags).where(eq(contentItemTags.contentItemId, id));
        if (tagIds.length > 0) {
            await db.insert(contentItemTags).values(
                tagIds.map(tagId => ({ contentItemId: id, tagId }))
            );
        }
    }

    return item;
}

export async function deleteContentItem(id: string) {
    await db.delete(contentItems).where(eq(contentItems.id, id));
}

// ============================================
// Content Assets
// ============================================

export async function addContentAsset(data: {
    contentItemId: string;
    storageObjectId: string;
    assetRole: ContentAssetRole;
    filename: string;
    altText?: string;
    caption?: string;
}) {
    const [asset] = await db.insert(contentAssets).values(data).returning();
    return asset;
}

export async function updateContentAsset(id: string, data: {
    altText?: string;
    caption?: string;
}) {
    const [asset] = await db.update(contentAssets).set(data).where(eq(contentAssets.id, id)).returning();
    return asset;
}

export async function getContentAssets(contentItemId: string) {
    return db
        .select({
            id: contentAssets.id,
            contentItemId: contentAssets.contentItemId,
            storageObjectId: contentAssets.storageObjectId,
            assetRole: contentAssets.assetRole,
            filename: contentAssets.filename,
            altText: contentAssets.altText,
            caption: contentAssets.caption,
            createdAt: contentAssets.createdAt,
            storageKey: storageObjects.objectKey,
            mimeType: storageObjects.mimeType,
            sizeBytes: storageObjects.sizeBytes,
        })
        .from(contentAssets)
        .innerJoin(storageObjects, eq(contentAssets.storageObjectId, storageObjects.id))
        .where(eq(contentAssets.contentItemId, contentItemId));
}

export async function getContentAssetsWithUrls(contentItemId: string) {
    const assets = await getContentAssets(contentItemId);

    return Promise.all(
        assets.map(async (asset) => ({
            ...asset,
            url: await getSignedDownloadUrl(asset.storageKey),
        }))
    );
}

export async function getContentAssetById(assetId: string) {
    const [asset] = await db
        .select({
            id: contentAssets.id,
            contentItemId: contentAssets.contentItemId,
            storageObjectId: contentAssets.storageObjectId,
            assetRole: contentAssets.assetRole,
            filename: contentAssets.filename,
            altText: contentAssets.altText,
            caption: contentAssets.caption,
            createdAt: contentAssets.createdAt,
            storageKey: storageObjects.objectKey,
            mimeType: storageObjects.mimeType,
            sizeBytes: storageObjects.sizeBytes,
        })
        .from(contentAssets)
        .innerJoin(storageObjects, eq(contentAssets.storageObjectId, storageObjects.id))
        .where(eq(contentAssets.id, assetId))
        .limit(1);

    return asset || null;
}

export async function getContentAssetWithUrl(assetId: string) {
    const asset = await getContentAssetById(assetId);
    if (!asset) return null;

    const url = await getSignedDownloadUrl(asset.storageKey);
    return { ...asset, url };
}

export async function deleteContentAsset(id: string) {
    await db.delete(contentAssets).where(eq(contentAssets.id, id));
}

/**
 * Delete a content asset and its associated storage object and S3 file.
 * Use this for full cleanup when an image is removed from content.
 */
export async function deleteContentAssetWithStorage(assetId: string) {
    // Get the asset with storage info
    const asset = await getContentAssetById(assetId);
    if (!asset) return;

    // Delete asset record
    await db.delete(contentAssets).where(eq(contentAssets.id, assetId));

    // Delete storage object and S3 file
    // Import here to avoid circular dependency
    const { deleteStorageObject } = await import('./storage.service');
    await deleteStorageObject(asset.storageObjectId);
}

/**
 * Extract all asset IDs referenced in a TipTap document.
 */
function extractAssetIdsFromTipTap(doc: TipTapDocument | null): Set<string> {
    const assetIds = new Set<string>();
    if (!doc || !doc.content) return assetIds;

    const traverse = (nodes: any[]) => {
        for (const node of nodes) {
            // Check for image nodes with assetId
            if (node.type === 'image' && node.attrs?.assetId) {
                assetIds.add(node.attrs.assetId);
            }
            // Check for image nodes using src with asset reference
            if (node.type === 'image' && node.attrs?.['data-asset-id']) {
                assetIds.add(node.attrs['data-asset-id']);
            }
            // Check for video nodes
            if (node.type === 'video' && node.attrs?.assetId) {
                assetIds.add(node.attrs.assetId);
            }
            // Traverse children
            if (node.content) {
                traverse(node.content);
            }
        }
    };

    traverse(doc.content);
    return assetIds;
}

/**
 * Sync content assets with the body JSON to remove orphaned assets.
 * Returns array of deleted asset IDs.
 */
export async function syncContentAssets(contentItemId: string, bodyJson: TipTapDocument | null): Promise<string[]> {
    // Get all current assets for this content
    const assets = await getContentAssets(contentItemId);

    // Get asset IDs referenced in the body
    const referencedAssetIds = extractAssetIdsFromTipTap(bodyJson);

    // Find orphaned assets (EMBED role only - don't delete PRIMARY, THUMBNAIL, etc.)
    const orphanedAssets = assets.filter(
        asset => asset.assetRole === 'EMBED' && !referencedAssetIds.has(asset.id)
    );

    // Delete orphaned assets with their storage objects
    const deletedIds: string[] = [];
    for (const asset of orphanedAssets) {
        await deleteContentAssetWithStorage(asset.id);
        deletedIds.push(asset.id);
    }

    return deletedIds;
}

/**
 * Resolve asset URLs in a TipTap document.
 * Replaces assetId references with actual signed URLs.
 */
export async function resolveAssetUrlsInTipTap(
    contentItemId: string,
    doc: TipTapDocument | null
): Promise<TipTapDocument | null> {
    if (!doc || !doc.content) return doc;

    // Get all assets for this content with URLs
    const assets = await getContentAssetsWithUrls(contentItemId);
    const assetMap = new Map(assets.map(a => [a.id, a]));

    // Deep clone the document to avoid mutation
    const result = JSON.parse(JSON.stringify(doc)) as TipTapDocument;

    const resolveInNodes = (nodes: any[]) => {
        for (const node of nodes) {
            // Resolve image URLs
            if (node.type === 'image') {
                const assetId = node.attrs?.assetId || node.attrs?.['data-asset-id'];
                if (assetId) {
                    const asset = assetMap.get(assetId);
                    if (asset) {
                        node.attrs = {
                            ...node.attrs,
                            src: asset.url,
                            alt: node.attrs?.alt || asset.altText || asset.filename,
                        };
                    }
                }
            }
            // Resolve video URLs
            if (node.type === 'video') {
                const assetId = node.attrs?.assetId;
                if (assetId) {
                    const asset = assetMap.get(assetId);
                    if (asset) {
                        node.attrs = {
                            ...node.attrs,
                            src: asset.url,
                        };
                    }
                }
            }
            // Traverse children
            if (node.content) {
                resolveInNodes(node.content);
            }
        }
    };

    resolveInNodes(result.content);
    return result;
}

// ============================================
// Bulk Operations
// ============================================

export async function getContentItemsByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return db.select().from(contentItems).where(inArray(contentItems.id, ids));
}

