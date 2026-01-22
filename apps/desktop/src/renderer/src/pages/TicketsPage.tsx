/**
 * Tickets Page
 * 
 * List and manage user's tickets.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, Button, StatusBadge, PriorityBadge } from '../components/ui';
import api from '../lib/api';
import { Plus, Ticket } from 'lucide-react';

export function TicketsPage() {
    const navigate = useNavigate();
    const [status, setStatus] = useState<string>('');

    const { data, isLoading } = useQuery({
        queryKey: ['tickets', { status }],
        queryFn: async () => {
            const response = await api.get('/tickets', {
                params: { status: status || undefined },
            });
            return response.data;
        },
    });

    const statusOptions = [
        { value: '', label: 'All Tickets' },
        { value: 'open', label: 'Open' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'waiting_on_employee', label: 'Waiting on Me' },
        { value: 'resolved', label: 'Resolved' },
        { value: 'closed', label: 'Closed' },
    ];

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">My Tickets</h1>
                    <p className="text-slate-500 mt-1">View and manage your IT support requests</p>
                </div>
                <Button onClick={() => navigate('/tickets/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Ticket
                </Button>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {statusOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setStatus(option.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${status === option.value
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {/* Tickets List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                </div>
            ) : data?.items?.length > 0 ? (
                <div className="space-y-3">
                    {data.items.map((ticket: any) => (
                        <Link key={ticket.id} to={`/tickets/${ticket.id}`}>
                            <Card hoverable className="transition-shadow">
                                <CardContent className="flex items-center justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-sm font-medium text-slate-400">
                                                #{ticket.ticketNumber}
                                            </span>
                                            <h3 className="font-medium text-slate-800 truncate">
                                                {ticket.subject}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-500">
                                            <span>{ticket.category}</span>
                                            <span>•</span>
                                            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <PriorityBadge priority={ticket.priority} />
                                        <StatusBadge status={ticket.status} />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Ticket className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <h3 className="text-lg font-medium text-slate-800 mb-2">No tickets found</h3>
                        <p className="text-slate-500 mb-4">
                            {status ? 'No tickets match this filter' : "You haven't created any tickets yet"}
                        </p>
                        <Button onClick={() => navigate('/tickets/new')}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Ticket
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
