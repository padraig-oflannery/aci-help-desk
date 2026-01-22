/**
 * Admin Articles Page
 * 
 * Lists articles created by the current user with options to edit or create new ones.
 */

import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, Badge, Button, Input } from '../../components/ui';
import api from '../../lib/api';
import { Plus, FileText, Edit, Eye, Clock, Calendar, Search, Folder, ChevronDown, ChevronUp, X, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Article {
    id: string;
    title: string;
    summary: string | null;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    createdAt: string;
    updatedAt: string;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
}

export function AdminArticlesPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Category management state
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showCategoriesSection, setShowCategoriesSection] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categoryError, setCategoryError] = useState('');

    // Delete article state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);

    // Fetch all articles
    const { data: articlesData, isLoading } = useQuery({
        queryKey: ['admin', 'articles', { search, status: statusFilter }],
        queryFn: async () => {
            const response = await api.get('/admin/content', {
                params: {
                    kind: 'ARTICLE',
                    status: statusFilter ? statusFilter.toUpperCase() : undefined,
                },
            });
            return response.data;
        },
    });

    // Fetch categories
    const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
        queryKey: ['admin', 'content', 'categories'],
        queryFn: async () => {
            const response = await api.get('/admin/content/categories');
            return response.data;
        },
    });

    // Create category mutation
    const createCategory = useMutation({
        mutationFn: async ({ name, slug }: { name: string; slug: string }) => {
            const response = await api.post('/admin/content/categories', { name, slug });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'categories'] });
            queryClient.invalidateQueries({ queryKey: ['kb', 'categories'] });
            setNewCategoryName('');
            setShowCategoryModal(false);
            setCategoryError('');
        },
        onError: (error: any) => {
            setCategoryError(error.response?.data?.error || 'Failed to create category');
        },
    });

    // Delete category mutation
    const deleteCategory = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/admin/content/categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'categories'] });
            queryClient.invalidateQueries({ queryKey: ['kb', 'categories'] });
        },
    });

    // Delete article mutation
    const deleteArticle = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/admin/content/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'articles'] });
            queryClient.invalidateQueries({ queryKey: ['content'] });
            setShowDeleteModal(false);
            setArticleToDelete(null);
        },
    });

    const handleDeleteArticle = (article: Article) => {
        setArticleToDelete(article);
        setShowDeleteModal(true);
    };

    const confirmDeleteArticle = () => {
        if (articleToDelete) {
            deleteArticle.mutate(articleToDelete.id);
        }
    };

    const articles: Article[] = articlesData?.items || [];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Generate slug from name
    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const handleCreateCategory = () => {
        if (!newCategoryName.trim()) {
            setCategoryError('Category name is required');
            return;
        }
        const slug = generateSlug(newCategoryName);
        if (!slug) {
            setCategoryError('Invalid category name');
            return;
        }
        createCategory.mutate({ name: newCategoryName.trim(), slug });
    };

    const handleDeleteCategory = (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete the category "${name}"? Articles in this category will become uncategorized.`)) {
            deleteCategory.mutate(id);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Articles</h1>
                    <p className="text-slate-500 mt-1">
                        Create and manage knowledge base articles
                    </p>
                </div>
                <Link to="/admin/articles/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Article
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search articles..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
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

            {/* Categories Section */}
            <Card className="mb-6">
                <button
                    onClick={() => setShowCategoriesSection(!showCategoriesSection)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors rounded-lg"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Folder className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <h3 className="font-medium text-slate-800">Categories</h3>
                            <p className="text-sm text-slate-500">
                                {isLoadingCategories ? 'Loading...' : `${categories.length} categories`}
                            </p>
                        </div>
                    </div>
                    {showCategoriesSection ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                </button>

                {showCategoriesSection && (
                    <CardContent className="pt-0 pb-4 px-4 border-t border-slate-100">
                        <div className="flex flex-wrap gap-2 mt-4">
                            {categories.map((cat: Category) => (
                                <div
                                    key={cat.id}
                                    className="group flex items-center gap-2 bg-slate-100 hover:bg-slate-200 rounded-full px-3 py-1.5 transition-colors"
                                >
                                    <span className="text-sm text-slate-700">{cat.name}</span>
                                    <button
                                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                        disabled={deleteCategory.isPending}
                                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                                        title="Delete category"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => setShowCategoryModal(true)}
                                className="flex items-center gap-1.5 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Category
                            </button>
                        </div>
                        {categories.length === 0 && !isLoadingCategories && (
                            <p className="text-sm text-slate-500 mt-2">
                                No categories yet. Create one to organize your articles.
                            </p>
                        )}
                    </CardContent>
                )}
            </Card>

            {/* Add Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <Card className="w-full max-w-md mx-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-slate-800">Add New Category</h2>
                                <button
                                    onClick={() => {
                                        setShowCategoryModal(false);
                                        setNewCategoryName('');
                                        setCategoryError('');
                                    }}
                                    className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Input
                                        label="Category Name"
                                        value={newCategoryName}
                                        onChange={(e) => {
                                            setNewCategoryName(e.target.value);
                                            setCategoryError('');
                                        }}
                                        placeholder="e.g., Getting Started"
                                        error={categoryError}
                                    />
                                    {newCategoryName && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            Slug: <code className="bg-slate-100 px-1 rounded">{generateSlug(newCategoryName)}</code>
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-3 justify-end">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowCategoryModal(false);
                                            setNewCategoryName('');
                                            setCategoryError('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreateCategory}
                                        disabled={createCategory.isPending || !newCategoryName.trim()}
                                    >
                                        {createCategory.isPending ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Category'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Delete Article Modal */}
            {showDeleteModal && articleToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <Card className="w-full max-w-md mx-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-slate-800">Delete Article</h2>
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setArticleToDelete(null);
                                    }}
                                    className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <p className="text-slate-600">
                                    Are you sure you want to delete the article{' '}
                                    <span className="font-semibold">"{articleToDelete.title}"</span>?
                                </p>
                                <p className="text-sm text-red-500 mt-2">
                                    This action cannot be undone. All associated media and assets will also be deleted.
                                </p>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setArticleToDelete(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={confirmDeleteArticle}
                                    disabled={deleteArticle.isPending}
                                    className="bg-red-500 hover:bg-red-600 text-white"
                                >
                                    {deleteArticle.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Article
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Articles List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                </div>
            ) : articles.length > 0 ? (
                <div className="grid gap-4">
                    {articles.map((article) => (
                        <Card key={article.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    {/* Article Info */}
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                                            <FileText className="w-6 h-6 text-primary-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-slate-800 truncate">
                                                    {article.title}
                                                </h3>
                                                <Badge variant={article.status === 'PUBLISHED' ? 'success' : 'warning'}>
                                                    {article.status.toLowerCase()}
                                                </Badge>
                                            </div>
                                            {article.summary && (
                                                <p className="text-sm text-slate-500 line-clamp-2 mb-2">
                                                    {article.summary}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-4 text-xs text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    Created {formatDate(article.createdAt)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    Updated {formatDate(article.updatedAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Link to={`/admin/articles/${article.id}`}>
                                            <Button variant="outline" size="sm">
                                                <Edit className="w-4 h-4 mr-1" />
                                                Edit
                                            </Button>
                                        </Link>
                                        {article.status === 'PUBLISHED' && (
                                            <Link to={`/kb/${article.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    View
                                                </Button>
                                            </Link>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteArticle(article)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="py-16 text-center">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <h3 className="text-lg font-medium text-slate-700 mb-2">
                            No articles yet
                        </h3>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                            Get started by creating your first knowledge base article. Articles help users find answers to common questions.
                        </p>
                        <Link to="/admin/articles/new">
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Your First Article
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
