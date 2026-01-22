/**
 * Admin KB Page
 * 
 * Knowledge Base content management for administrators.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, Button, Input, Badge } from '../../components/ui';
import api from '../../lib/api';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Book, Video, FileText } from 'lucide-react';

export function AdminKBPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Create item form state
    const [formData, setFormData] = useState({
        type: 'article',
        title: '',
        summary: '',
        categoryId: '',
        bodyHtml: '',
        status: 'draft',
    });

    const { data: items, isLoading } = useQuery({
        queryKey: ['admin', 'kb', { search, type: typeFilter, status: statusFilter }],
        queryFn: async () => {
            const response = await api.get('/admin/kb/items', {
                params: {
                    q: search || undefined,
                    type: typeFilter || undefined,
                    status: statusFilter || undefined,
                },
            });
            return response.data;
        },
    });

    const { data: categories } = useQuery({
        queryKey: ['kb', 'categories'],
        queryFn: async () => {
            const response = await api.get('/kb/categories');
            return response.data;
        },
    });

    const createItem = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post('/admin/kb/items', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'kb'] });
            setShowCreateModal(false);
            setFormData({ type: 'article', title: '', summary: '', categoryId: '', bodyHtml: '', status: 'draft' });
        },
    });

    const updateItem = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await api.patch(`/admin/kb/items/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'kb'] });
            setEditingItem(null);
        },
    });

    const deleteItem = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/admin/kb/items/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'kb'] });
        },
    });

    const publishItem = useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post(`/admin/kb/items/${id}/publish`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'kb'] });
        },
    });

    const typeIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="w-5 h-5" />;
            case 'document': return <FileText className="w-5 h-5" />;
            default: return <Book className="w-5 h-5" />;
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Content Manager</h1>
                    <p className="text-slate-500 mt-1">Manage knowledge base articles, videos, and documents</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Content
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search content..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">All Types</option>
                    <option value="article">Articles</option>
                    <option value="video">Videos</option>
                    <option value="document">Documents</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                </select>
            </div>

            {/* Content Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                        </div>
                    ) : items?.items?.length > 0 ? (
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Content</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Views</th>
                                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.items.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.type === 'video' ? 'bg-red-100 text-red-600' :
                                                        item.type === 'document' ? 'bg-blue-100 text-blue-600' :
                                                            'bg-green-100 text-green-600'
                                                    }`}>
                                                    {typeIcon(item.type)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800">{item.title}</p>
                                                    {item.summary && (
                                                        <p className="text-sm text-slate-500 truncate max-w-md">{item.summary}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline">{item.type}</Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={item.status === 'published' ? 'success' : 'warning'}>
                                                {item.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {item.viewCount}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {item.status === 'draft' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => publishItem.mutate(item.id)}
                                                        title="Publish"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {item.status === 'published' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => updateItem.mutate({ id: item.id, data: { status: 'draft' } })}
                                                        title="Unpublish"
                                                    >
                                                        <EyeOff className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setEditingItem(item)}
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to delete this item?')) {
                                                            deleteItem.mutate(item.id);
                                                        }
                                                    }}
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4 text-danger-600" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-12 text-center text-slate-500">
                            <Book className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No content found</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Modal */}
            {(showCreateModal || editingItem) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-slate-800">
                                {editingItem ? 'Edit Content' : 'Add New Content'}
                            </h2>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                if (editingItem) {
                                    updateItem.mutate({ id: editingItem.id, data: formData });
                                } else {
                                    createItem.mutate(formData);
                                }
                            }} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                        <select
                                            value={editingItem?.type || formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            disabled={!!editingItem}
                                            className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100"
                                        >
                                            <option value="article">Article</option>
                                            <option value="video">Video</option>
                                            <option value="document">Document</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                        <select
                                            value={editingItem?.categoryId || formData.categoryId}
                                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                            className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="">No Category</option>
                                            {categories?.map((cat: any) => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <Input
                                    label="Title"
                                    value={editingItem?.title !== undefined ? editingItem.title : formData.title}
                                    onChange={(e) => {
                                        if (editingItem) {
                                            setEditingItem({ ...editingItem, title: e.target.value });
                                        } else {
                                            setFormData({ ...formData, title: e.target.value });
                                        }
                                    }}
                                    required
                                />

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Summary</label>
                                    <textarea
                                        value={editingItem?.summary !== undefined ? editingItem.summary : formData.summary}
                                        onChange={(e) => {
                                            if (editingItem) {
                                                setEditingItem({ ...editingItem, summary: e.target.value });
                                            } else {
                                                setFormData({ ...formData, summary: e.target.value });
                                            }
                                        }}
                                        rows={2}
                                        className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                    />
                                </div>

                                {(editingItem?.type || formData.type) === 'article' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Content (HTML)</label>
                                        <textarea
                                            value={editingItem?.bodyHtml !== undefined ? editingItem.bodyHtml : formData.bodyHtml}
                                            onChange={(e) => {
                                                if (editingItem) {
                                                    setEditingItem({ ...editingItem, bodyHtml: e.target.value });
                                                } else {
                                                    setFormData({ ...formData, bodyHtml: e.target.value });
                                                }
                                            }}
                                            rows={10}
                                            placeholder="<p>Your article content here...</p>"
                                            className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none font-mono text-sm"
                                        />
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            setEditingItem(null);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" isLoading={createItem.isPending || updateItem.isPending}>
                                        {editingItem ? 'Save Changes' : 'Create Content'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
