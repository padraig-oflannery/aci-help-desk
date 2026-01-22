/**
 * New Ticket Page
 * 
 * Form to create a new support ticket.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, Button, Input } from '../components/ui';
import api from '../lib/api';
import { ArrowLeft, Send } from 'lucide-react';

export function NewTicketPage() {
    const navigate = useNavigate();
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('Software');
    const [priority, setPriority] = useState('medium');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    const createTicket = useMutation({
        mutationFn: async (data: { subject: string; category: string; priority: string; description: string }) => {
            const response = await api.post('/tickets', data);
            return response.data;
        },
        onSuccess: (ticket) => {
            navigate(`/tickets/${ticket.id}`);
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || 'Failed to create ticket');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!subject.trim() || !description.trim()) {
            setError('Please fill in all required fields');
            return;
        }

        createTicket.mutate({ subject, category, priority, description });
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            {/* Back link */}
            <Link to="/tickets" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-6">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Tickets
            </Link>

            <h1 className="text-2xl font-bold text-slate-800 mb-2">Submit a Ticket</h1>
            <p className="text-slate-500 mb-6">Describe your issue and our IT team will assist you.</p>

            <Card>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
                                {error}
                            </div>
                        )}

                        <Input
                            label="Subject *"
                            placeholder="Brief description of your issue"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="Hardware">Hardware</option>
                                    <option value="Software">Software</option>
                                    <option value="Access">Access</option>
                                    <option value="Network">Network</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="low">Low - Can wait</option>
                                    <option value="medium">Medium - Affects work</option>
                                    <option value="high">High - Urgent</option>
                                    <option value="urgent">Urgent - Critical</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce, and what you've already tried."
                                rows={6}
                                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => navigate('/tickets')}>
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={createTicket.isPending}>
                                <Send className="w-4 h-4 mr-2" />
                                Submit Ticket
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
