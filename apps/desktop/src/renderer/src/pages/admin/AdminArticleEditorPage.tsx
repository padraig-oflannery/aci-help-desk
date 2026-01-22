/**
 * Admin Article Editor Page
 * 
 * Rich text editor for creating and editing articles.
 * Uses TipTap for the WYSIWYG experience.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, Button, Input } from '../../components/ui';
import { TipTapEditor } from '../../components/editor';
import api from '../../lib/api';
import { ArrowLeft, Save, Eye, Send, Loader2 } from 'lucide-react';

interface ArticleFormData {
    title: string;
    summary: string;
    categoryId: string;
    bodyJson: any;
    status: 'draft' | 'published';
}

export function AdminArticleEditorPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isEditing = id && id !== 'new';

    const [formData, setFormData] = useState<ArticleFormData>({
        title: '',
        summary: '',
        categoryId: '',
        bodyJson: null,
        status: 'draft',
    });
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Fetch existing article if editing
    const { data: article, isLoading: isLoadingArticle } = useQuery({
        queryKey: ['admin', 'article', id],
        queryFn: async () => {
            const response = await api.get(`/admin/content/${id}`);
            return response.data;
        },
        enabled: !!isEditing,
    });

    // Fetch categories for the dropdown
    const { data: categories } = useQuery({
        queryKey: ['admin', 'content', 'categories'],
        queryFn: async () => {
            const response = await api.get('/admin/content/categories');
            return response.data;
        },
    });

    // Populate form when article is loaded
    useEffect(() => {
        if (article) {
            setFormData({
                title: article.title || '',
                summary: article.summary || '',
                categoryId: article.categoryId || '',
                bodyJson: article.bodyJson || { type: 'doc', content: [{ type: 'paragraph' }] },
                status: article.status?.toLowerCase() || 'draft',
            });
        }
    }, [article]);

    // Create article mutation
    const createArticle = useMutation({
        mutationFn: async (data: ArticleFormData) => {
            const response = await api.post('/admin/content', {
                kind: 'ARTICLE',
                title: data.title,
                summary: data.summary || undefined,
                categoryId: data.categoryId || undefined,
                status: data.status.toUpperCase(),
                bodyJson: data.bodyJson,
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'my-articles'] });
            setHasUnsavedChanges(false);
            navigate(`/admin/articles/${data.id}`);
        },
    });

    // Update article mutation
    const updateArticle = useMutation({
        mutationFn: async (data: ArticleFormData) => {
            const response = await api.patch(`/admin/content/${id}`, {
                title: data.title,
                summary: data.summary || undefined,
                categoryId: data.categoryId || undefined,
                bodyJson: data.bodyJson,
            });
            return response.data;
        },
        onSuccess: async () => {
            // Sync assets to clean up any orphaned images
            try {
                await api.post(`/admin/content/${id}/sync-assets`);
            } catch (err) {
                console.warn('Failed to sync assets:', err);
            }

            queryClient.invalidateQueries({ queryKey: ['admin', 'my-articles'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'article', id] });
            queryClient.invalidateQueries({ queryKey: ['content', 'item', id] }); // Invalidate public view cache
            setHasUnsavedChanges(false);
        },
    });

    // Publish article mutation
    const publishArticle = useMutation({
        mutationFn: async () => {
            const response = await api.post(`/admin/content/${id}/publish`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'my-articles'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'article', id] });
            queryClient.invalidateQueries({ queryKey: ['content', 'item', id] }); // Invalidate public view cache
            setFormData(prev => ({ ...prev, status: 'published' }));
        },
    });

    // Image upload handler
    const handleImageUpload = async (file: File): Promise<{ assetId: string; url: string } | null> => {
        try {
            // Get signed upload URL
            const { data: uploadData } = await api.post('/admin/content/upload-url', {
                filename: file.name,
                contentType: file.type,
                prefix: `articles/${id || 'new'}`,
            });

            console.log('[Upload] Got signed URL:', uploadData.uploadUrl);

            // Upload file to S3
            const uploadResponse = await fetch(uploadData.uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                },
            });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                console.error('[Upload] S3 upload failed:', uploadResponse.status, errorText);
                throw new Error(`S3 upload failed: ${uploadResponse.status}`);
            }

            console.log('[Upload] S3 upload successful');

            // Create storage object record
            const { data: storageObject } = await api.post('/storage/objects', {
                storageKey: uploadData.storageKey,
                filename: file.name,
                mimeType: file.type,
                sizeBytes: file.size,
            });

            console.log('[Upload] Storage object created:', storageObject.id);

            // If we're editing an existing article, create an asset record
            if (isEditing) {
                const { data: asset } = await api.post(`/admin/content/${id}/assets`, {
                    storageObjectId: storageObject.id,
                    assetRole: 'EMBED',
                    filename: file.name,
                });

                console.log('[Upload] Asset created:', asset.id);

                return {
                    assetId: asset.id,
                    url: asset.url || storageObject.url,
                };
            }

            // For new articles, return the storage object URL
            return {
                assetId: storageObject.id,
                url: storageObject.url,
            };
        } catch (error) {
            console.error('Failed to upload image:', error);
            return null;
        }
    };

    // Video upload handler
    const handleVideoUpload = async (file: File): Promise<{ assetId: string; url: string } | null> => {
        try {
            // Get signed upload URL
            const { data: uploadData } = await api.post('/admin/content/upload-url', {
                filename: file.name,
                contentType: file.type,
                prefix: `articles/${id || 'new'}/videos`,
            });

            console.log('[Upload] Got signed URL for video:', uploadData.uploadUrl);

            // Upload file to S3
            const uploadResponse = await fetch(uploadData.uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                },
            });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                console.error('[Upload] S3 video upload failed:', uploadResponse.status, errorText);
                throw new Error(`S3 upload failed: ${uploadResponse.status}`);
            }

            console.log('[Upload] S3 video upload successful');

            // Create storage object record
            const { data: storageObject } = await api.post('/storage/objects', {
                storageKey: uploadData.storageKey,
                filename: file.name,
                mimeType: file.type,
                sizeBytes: file.size,
            });

            console.log('[Upload] Storage object created:', storageObject.id);

            // If we're editing an existing article, create an asset record
            if (isEditing) {
                const { data: asset } = await api.post(`/admin/content/${id}/assets`, {
                    storageObjectId: storageObject.id,
                    assetRole: 'EMBED',
                    filename: file.name,
                });

                console.log('[Upload] Video asset created:', asset.id);

                return {
                    assetId: asset.id,
                    url: asset.url || storageObject.url,
                };
            }

            // For new articles, return the storage object URL
            return {
                assetId: storageObject.id,
                url: storageObject.url,
            };
        } catch (error) {
            console.error('Failed to upload video:', error);
            return null;
        }
    };

    const handleInputChange = (field: keyof ArticleFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setHasUnsavedChanges(true);
    };

    const handleSave = async () => {
        if (isEditing) {
            await updateArticle.mutateAsync(formData);
        } else {
            await createArticle.mutateAsync(formData);
        }
    };

    const handlePublish = async () => {
        // Save first if there are unsaved changes
        if (hasUnsavedChanges) {
            await handleSave();
        }
        await publishArticle.mutateAsync();
    };

    const isSaving = createArticle.isPending || updateArticle.isPending;
    const isPublishing = publishArticle.isPending;

    if (isEditing && isLoadingArticle) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-slate-50">
            {/* Header Bar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Left side */}
                        <div className="flex items-center gap-4">
                            <Link
                                to="/admin/articles"
                                className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <span>Back to Articles</span>
                            </Link>
                            {hasUnsavedChanges && (
                                <span className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                    Unsaved changes
                                </span>
                            )}
                        </div>

                        {/* Right side - Actions */}
                        <div className="flex items-center gap-3">
                            {isEditing && formData.status === 'published' && (
                                <Link to={`/kb/${id}`}>
                                    <Button variant="ghost" size="sm">
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Published
                                    </Button>
                                </Link>
                            )}
                            <Button
                                variant="outline"
                                onClick={handleSave}
                                disabled={isSaving || !formData.title}
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                {isEditing ? 'Save' : 'Save Draft'}
                            </Button>
                            {isEditing && formData.status === 'draft' && (
                                <Button
                                    onClick={handlePublish}
                                    disabled={isPublishing || !formData.title}
                                >
                                    {isPublishing ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4 mr-2" />
                                    )}
                                    Publish
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Editor Content */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Title */}
                <div className="mb-6">
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Article Title"
                        className="w-full text-3xl font-bold text-slate-800 bg-transparent border-none outline-none placeholder:text-slate-300"
                    />
                </div>

                {/* Meta Info */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Category
                                </label>
                                <select
                                    value={formData.categoryId}
                                    onChange={(e) => handleInputChange('categoryId', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">No Category</option>
                                    {categories?.map((cat: any) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Input
                                    label="Summary"
                                    value={formData.summary}
                                    onChange={(e) => handleInputChange('summary', e.target.value)}
                                    placeholder="Brief description of the article"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* TipTap Editor */}
                <TipTapEditor
                    content={formData.bodyJson || { type: 'doc', content: [{ type: 'paragraph' }] }}
                    onChange={(content) => handleInputChange('bodyJson', content)}
                    onImageUpload={handleImageUpload}
                    onVideoUpload={handleVideoUpload}
                    placeholder="Start writing your article..."
                />

                {/* Help text */}
                <p className="mt-4 text-sm text-slate-500 text-center">
                    Use the toolbar above to format your article. Changes are saved when you click "Save" or "Save Draft".
                </p>
            </div>
        </div>
    );
}
