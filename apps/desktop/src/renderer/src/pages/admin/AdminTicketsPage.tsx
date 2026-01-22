/**
 * Admin Tickets Page
 * 
 * Ticket management for administrators.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, Button, StatusBadge, PriorityBadge } from '../../components/ui';
import api from '../../lib/api';
import { User, MessageSquare } from 'lucide-react';

export function AdminTicketsPage() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [assignedFilter, setAssignedFilter] = useState('');
    const [selectedTicket, setSelectedTicket] = useState<any>(null);

    const { data: tickets, isLoading } = useQuery({
        queryKey: ['admin', 'tickets', { status: statusFilter, priority: priorityFilter, assignedTo: assignedFilter }],
        queryFn: async () => {
            const response = await api.get('/admin/tickets', {
                params: {
                    status: statusFilter || undefined,
                    priority: priorityFilter || undefined,
                    assignedTo: assignedFilter || undefined,
                },
            });
            return response.data;
        },
    });

    const { data: stats } = useQuery({
        queryKey: ['admin', 'tickets', 'stats'],
        queryFn: async () => {
            const response = await api.get('/admin/tickets/stats');
            return response.data;
        },
    });

    const { data: users } = useQuery({
        queryKey: ['admin', 'users'],
        queryFn: async () => {
            const response = await api.get('/admin/users', { params: { role: 'ADMIN' } });
            return response.data;
        },
    });

    const updateTicket = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await api.patch(`/admin/tickets/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'tickets'] });
            setSelectedTicket(null);
        },
    });

    const addInternalNote = useMutation({
        mutationFn: async ({ id, body }: { id: string; body: string }) => {
            const response = await api.post(`/admin/tickets/${id}/internal-note`, { body });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'tickets'] });
        },
    });

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Ticket Queue</h1>
                <p className="text-slate-500 mt-1">Manage and respond to support tickets</p>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <Card>
                        <CardContent className="py-3 text-center">
                            <p className="text-2xl font-bold text-slate-800">{stats.open}</p>
                            <p className="text-sm text-slate-500">Open</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="py-3 text-center">
                            <p className="text-2xl font-bold text-amber-600">{stats.inProgress}</p>
                            <p className="text-sm text-slate-500">In Progress</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="py-3 text-center">
                            <p className="text-2xl font-bold text-orange-600">{stats.waitingOnEmployee}</p>
                            <p className="text-sm text-slate-500">Waiting</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="py-3 text-center">
                            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                            <p className="text-sm text-slate-500">Resolved</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="py-3 text-center">
                            <p className="text-2xl font-bold text-primary-600">{stats.createdToday}</p>
                            <p className="text-sm text-slate-500">Today</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_on_employee">Waiting on Employee</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                </select>
                <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">All Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                </select>
                <select
                    value={assignedFilter}
                    onChange={(e) => setAssignedFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">All Assignees</option>
                    <option value="unassigned">Unassigned</option>
                    {users?.map((user: any) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                </select>
            </div>

            {/* Tickets Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                        </div>
                    ) : tickets?.items?.length > 0 ? (
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Ticket</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned To</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
                                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tickets.items.map((ticket: any) => (
                                    <tr key={ticket.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <Link to={`/tickets/${ticket.id}`} className="hover:underline">
                                                <p className="font-medium text-slate-800">#{ticket.ticketNumber}</p>
                                                <p className="text-sm text-slate-500 truncate max-w-xs">{ticket.subject}</p>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={ticket.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <PriorityBadge priority={ticket.priority} />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {ticket.assignedTo ? (
                                                <span className="flex items-center gap-1">
                                                    <User className="w-4 h-4" />
                                                    Assigned
                                                </span>
                                            ) : (
                                                <span className="text-amber-600">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(ticket.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedTicket(ticket)}
                                            >
                                                Manage
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-12 text-center text-slate-500">
                            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No tickets found</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Manage Ticket Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-800">
                                Manage Ticket #{selectedTicket.ticketNumber}
                            </h2>
                        </div>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    defaultValue={selectedTicket.status}
                                    onChange={(e) => updateTicket.mutate({
                                        id: selectedTicket.id,
                                        data: { status: e.target.value }
                                    })}
                                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="waiting_on_employee">Waiting on Employee</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                                <select
                                    defaultValue={selectedTicket.priority}
                                    onChange={(e) => updateTicket.mutate({
                                        id: selectedTicket.id,
                                        data: { priority: e.target.value }
                                    })}
                                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
                                <select
                                    defaultValue={selectedTicket.assignedTo || ''}
                                    onChange={(e) => updateTicket.mutate({
                                        id: selectedTicket.id,
                                        data: { assignedTo: e.target.value || null }
                                    })}
                                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">Unassigned</option>
                                    {users?.map((user: any) => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const note = (form.elements.namedItem('note') as HTMLTextAreaElement).value;
                                if (note.trim()) {
                                    addInternalNote.mutate({ id: selectedTicket.id, body: note });
                                    form.reset();
                                }
                            }}>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Internal Note</label>
                                <textarea
                                    name="note"
                                    rows={3}
                                    placeholder="Add an internal note (not visible to employee)..."
                                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                />
                                <Button type="submit" size="sm" className="mt-2">
                                    Add Note
                                </Button>
                            </form>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                                <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                                    Close
                                </Button>
                                <Link to={`/tickets/${selectedTicket.id}`}>
                                    <Button>View Full Ticket</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
