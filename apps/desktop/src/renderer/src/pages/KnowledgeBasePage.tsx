/**
 * Knowledge Base Page
 * 
 * Browse and search knowledge base items.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, Badge } from '../components/ui';
import api from '../lib/api';
import { Search, Book, Video, FileText } from 'lucide-react';

type ContentType = 'all' | 'ARTICLE' | 'VIDEO' | 'DOCUMENT';

export function KnowledgeBasePage() {
    const [search, setSearch] = useState('');
    const [type, setType] = useState<ContentType>('all');
    const [categoryId, setCategoryId] = useState<string>('');

    // Fetch categories
    const { data: categories } = useQuery({
        queryKey: ['content', 'categories'],
        queryFn: async () => {
            const response = await api.get('/content/categories');
            return response.data;
        },
    });

    // Fetch content items
    const { data, isLoading } = useQuery({
        queryKey: ['content', 'items', { search, type, categoryId }],
        queryFn: async () => {
            const response = await api.get('/content', {
                params: {
                    q: search || undefined,
                    kind: type !== 'all' ? type : undefined,
                    categoryId: categoryId || undefined,
                },
            });
            return response.data;
        },
    });

    const typeIcon = (itemKind: string) => {
        switch (itemKind) {
            case 'VIDEO': return <Video className="w-5 h-5" />;
            case 'DOCUMENT': return <FileText className="w-5 h-5" />;
            default: return <Book className="w-5 h-5" />;
        }
    };

    const typeLabel = (itemKind: string) => {
        switch (itemKind) {
            case 'VIDEO': return 'Video';
            case 'DOCUMENT': return 'Document';
            default: return 'Article';
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Knowledge Base</h1>
                <p className="text-slate-500 mt-1">
                    Find guides, tutorials, and documentation to help you
                </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search articles, videos, and documents..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>

                <div className="flex gap-2">
                    {/* Type filter */}
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as ContentType)}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">All Types</option>
                        <option value="ARTICLE">Articles</option>
                        <option value="VIDEO">Videos</option>
                        <option value="DOCUMENT">Documents</option>
                    </select>

                    {/* Category filter */}
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="">All Categories</option>
                        {categories?.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Results count */}
            {data && (
                <p className="text-sm text-slate-500 mb-4">
                    {data.total} {data.total === 1 ? 'result' : 'results'} found
                </p>
            )}

            {/* Items Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                </div>
            ) : data?.items?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.items.map((item: any) => (
                        <Link key={item.id} to={`/kb/${item.id}`}>
                            <Card hoverable className="h-full">
                                <CardContent>
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.kind === 'VIDEO' ? 'bg-red-100 text-red-600' :
                                            item.kind === 'DOCUMENT' ? 'bg-blue-100 text-blue-600' :
                                                'bg-green-100 text-green-600'
                                            }`}>
                                            {typeIcon(item.kind)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline">{typeLabel(item.kind)}</Badge>
                                            </div>
                                            <h3 className="font-medium text-slate-800 line-clamp-2 mb-2">
                                                {item.title}
                                            </h3>
                                            {item.summary && (
                                                <p className="text-sm text-slate-500 line-clamp-2">
                                                    {item.summary}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                                                <span>{new Date(item.publishedAt || item.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Book className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <h3 className="text-lg font-medium text-slate-800 mb-2">No items found</h3>
                        <p className="text-slate-500">
                            {search || categoryId || type !== 'all'
                                ? 'Try adjusting your filters or search terms'
                                : 'The knowledge base is empty'}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
