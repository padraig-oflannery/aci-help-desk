/**
 * KB Item Detail Page
 * 
 * View article, video, or document content.
 */

import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, Badge, Button } from '../components/ui';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Link as TiptapLink } from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Node, mergeAttributes } from '@tiptap/core';
import api from '../lib/api';
import '../components/editor/TipTapEditor.css';
import { ArrowLeft, Download, User } from 'lucide-react';

// Video extension for rendering
const Video = Node.create({
    name: 'video',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            src: { default: null },
            assetId: { default: null },
            controls: { default: true },
        };
    },

    parseHTML() {
        return [{ tag: 'video' }];
    },

    renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
        return ['video', mergeAttributes(HTMLAttributes, { controls: true })];
    },
});

export function KBDetailPage() {
    const { id } = useParams<{ id: string }>();

    const { data: item, isLoading, error } = useQuery({
        queryKey: ['content', 'item', id],
        queryFn: async () => {
            const response = await api.get(`/content/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    // Extensions matching the editor configuration
    const extensions = [
        StarterKit.configure({}),
        Image.configure({}),
        Video,
        TiptapLink.configure({}),
        Underline.configure({}),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ];

    // Generate HTML from TipTap JSON
    const articleHtml = useMemo(() => {
        if (item?.bodyJson && item.kind === 'ARTICLE') {
            try {
                return generateHTML(item.bodyJson, extensions);
            } catch (e) {
                console.error('Failed to generate HTML:', e);
                return null;
            }
        }
        return null;
    }, [item?.bodyJson, item?.kind]);

    const handleDownload = async () => {
        try {
            const response = await api.get(`/content/${id}/download`);
            window.open(response.data.url, '_blank');
        } catch (err) {
            console.error('Download failed:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <Card>
                    <CardContent className="py-12 text-center">
                        <h2 className="text-xl font-semibold text-slate-800 mb-2">Item not found</h2>
                        <p className="text-slate-500 mb-4">The requested knowledge base item could not be found.</p>
                        <Link to="/kb">
                            <Button variant="outline">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Knowledge Base
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Back link */}
            <Link to="/kb" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-6">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Knowledge Base
            </Link>

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <Badge variant={item.kind === 'VIDEO' ? 'danger' : item.kind === 'DOCUMENT' ? 'primary' : 'success'}>
                        {item.kind.charAt(0) + item.kind.slice(1).toLowerCase()}
                    </Badge>
                    {item.category && <Badge variant="outline">{item.category.name}</Badge>}
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-3">{item.title}</h1>
                {item.summary && <p className="text-slate-600">{item.summary}</p>}

                <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {new Date(item.publishedAt || item.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>

            {/* Content */}
            <Card>
                <CardContent>
                    {item.kind === 'ARTICLE' && articleHtml && (
                        <div className="tiptap-content">
                            <div
                                className="ProseMirror"
                                dangerouslySetInnerHTML={{ __html: articleHtml }}
                            />
                        </div>
                    )}

                    {item.kind === 'VIDEO' && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">🎬</span>
                            </div>
                            <h3 className="text-lg font-medium text-slate-800 mb-2">Video Content</h3>
                            <p className="text-slate-500 mb-4">Click below to download and watch this video.</p>
                            <Button onClick={handleDownload}>
                                <Download className="w-4 h-4 mr-2" />
                                Download Video
                            </Button>
                        </div>
                    )}

                    {item.kind === 'DOCUMENT' && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">📄</span>
                            </div>
                            <h3 className="text-lg font-medium text-slate-800 mb-2">Document</h3>
                            <Button onClick={handleDownload}>
                                <Download className="w-4 h-4 mr-2" />
                                Download Document
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tags */}
            {item.tags?.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-sm font-medium text-slate-500 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag: any) => (
                            <Badge key={tag.id} variant="outline">{tag.name}</Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
