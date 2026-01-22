/**
 * Ticket Detail Page
 * 
 * View ticket details and conversation.
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, Button, StatusBadge, PriorityBadge, Badge } from '../components/ui';
import api from '../lib/api';
import { ArrowLeft, Send, Paperclip, User } from 'lucide-react';

export function TicketDetailPage() {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const [newMessage, setNewMessage] = useState('');

    const { data: ticket, isLoading, error } = useQuery({
        queryKey: ['ticket', id],
        queryFn: async () => {
            const response = await api.get(`/tickets/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    const sendMessage = useMutation({
        mutationFn: async (body: string) => {
            const response = await api.post(`/tickets/${id}/messages`, { body });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ticket', id] });
            setNewMessage('');
        },
    });

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        sendMessage.mutate(newMessage);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (error || !ticket) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <Card>
                    <CardContent className="py-12 text-center">
                        <h2 className="text-xl font-semibold text-slate-800 mb-2">Ticket not found</h2>
                        <Link to="/tickets">
                            <Button variant="outline">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Tickets
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const isResolved = ['resolved', 'closed'].includes(ticket.status);

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Back link */}
            <Link to="/tickets" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-6">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Tickets
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-slate-400">#{ticket.ticketNumber}</span>
                        <StatusBadge status={ticket.status} />
                        <PriorityBadge priority={ticket.priority} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">{ticket.subject}</h1>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        <span>{ticket.category}</span>
                        <span>•</span>
                        <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                        {ticket.assignee && (
                            <>
                                <span>•</span>
                                <span>Assigned to {ticket.assignee.name}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <Card className="mb-6">
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                        {ticket.messages?.map((message: any) => (
                            <div key={message.id} className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${message.messageType === 'admin' ? 'bg-primary-100' :
                                        message.messageType === 'internal' ? 'bg-amber-100' : 'bg-slate-100'
                                        }`}>
                                        <User className={`w-4 h-4 ${message.messageType === 'admin' ? 'text-primary-600' :
                                            message.messageType === 'internal' ? 'text-amber-600' : 'text-slate-600'
                                            }`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-slate-800">{message.author?.name || 'Unknown'}</span>
                                            {message.messageType === 'admin' && (
                                                <Badge variant="primary">IT Support</Badge>
                                            )}
                                            {message.messageType === 'internal' && (
                                                <Badge variant="warning">Internal Note</Badge>
                                            )}
                                            <span className="text-xs text-slate-400">
                                                {new Date(message.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 whitespace-pre-wrap">{message.body}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Reply form */}
            {!isResolved && (
                <Card>
                    <CardContent>
                        <form onSubmit={handleSendMessage}>
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your reply..."
                                rows={3}
                                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none mb-3"
                            />
                            <div className="flex items-center justify-between">
                                <button
                                    type="button"
                                    className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700"
                                >
                                    <Paperclip className="w-4 h-4 mr-1" />
                                    Attach file
                                </button>
                                <Button type="submit" isLoading={sendMessage.isPending} disabled={!newMessage.trim()}>
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Reply
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {isResolved && (
                <Card>
                    <CardContent className="text-center py-6">
                        <p className="text-slate-500">This ticket has been {ticket.status}.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
