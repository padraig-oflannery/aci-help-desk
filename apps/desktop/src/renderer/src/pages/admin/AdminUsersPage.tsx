/**
 * Admin Users Page
 * 
 * User management for administrators.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, Button, Input, Badge } from '../../components/ui';
import api from '../../lib/api';
import { Plus, Search, Mail, UserCog, Check, X } from 'lucide-react';

export function AdminUsersPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);

    // Create user form state
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState('EMPLOYEE');

    const { data: users, isLoading } = useQuery({
        queryKey: ['admin', 'users', { search, role: roleFilter }],
        queryFn: async () => {
            const response = await api.get('/admin/users', {
                params: { search: search || undefined, role: roleFilter || undefined },
            });
            return response.data;
        },
    });

    const createUser = useMutation({
        mutationFn: async (data: { name: string; email: string; role: string }) => {
            const response = await api.post('/admin/users', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            setShowCreateModal(false);
            setNewName('');
            setNewEmail('');
            setNewRole('EMPLOYEE');
        },
    });

    const updateUser = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await api.patch(`/admin/users/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            setEditingUser(null);
        },
    });

    const resetPassword = useMutation({
        mutationFn: async (userId: string) => {
            const response = await api.post(`/admin/users/${userId}/reset-password`);
            return response.data;
        },
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createUser.mutate({ name: newName, email: newEmail, role: newRole });
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
                    <p className="text-slate-500 mt-1">Manage employee accounts and access</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">All Roles</option>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="ADMIN">Admin</option>
                </select>
            </div>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
                                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users?.map((user: any) => (
                                    <tr key={user.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-medium text-primary-700">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800">{user.name}</p>
                                                    <p className="text-sm text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={user.role === 'ADMIN' ? 'primary' : 'default'}>
                                                {user.role}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={user.isActive ? 'success' : 'danger'}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => resetPassword.mutate(user.id)}
                                                    title="Reset Password"
                                                >
                                                    <Mail className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setEditingUser(user)}
                                                    title="Edit User"
                                                >
                                                    <UserCog className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => updateUser.mutate({
                                                        id: user.id,
                                                        data: { isActive: !user.isActive }
                                                    })}
                                                    title={user.isActive ? 'Deactivate' : 'Activate'}
                                                >
                                                    {user.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-slate-800">Add New User</h2>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateSubmit} className="space-y-4">
                                <Input
                                    label="Name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    required
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    required
                                />
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                    <select
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                        className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="EMPLOYEE">Employee</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" isLoading={createUser.isPending}>
                                        Create User
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-slate-800">Edit User</h2>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const formData = new FormData(form);
                                updateUser.mutate({
                                    id: editingUser.id,
                                    data: {
                                        name: formData.get('name'),
                                        email: formData.get('email'),
                                        role: formData.get('role'),
                                    }
                                });
                            }} className="space-y-4">
                                <Input
                                    label="Name"
                                    name="name"
                                    defaultValue={editingUser.name}
                                    required
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    name="email"
                                    defaultValue={editingUser.email}
                                    required
                                />
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                    <select
                                        name="role"
                                        defaultValue={editingUser.role}
                                        className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="EMPLOYEE">Employee</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" isLoading={updateUser.isPending}>
                                        Save Changes
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
