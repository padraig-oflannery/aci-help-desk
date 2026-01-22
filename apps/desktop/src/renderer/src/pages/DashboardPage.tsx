/**
 * Dashboard Page
 * 
 * Main dashboard with greeting, search, and quick actions.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../hooks/useAuth';
import { useSidebar } from '../components/layout/MainLayout';
import { Card, CardContent, StatusBadge, PriorityBadge } from '../components/ui';
import api from '../lib/api';
import { Search, Plus, BookOpen, Menu, User, Ticket, GraduationCap, ArrowRight } from 'lucide-react';

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

export function DashboardPage() {
    const { user } = useAuthStore();
    const { toggle } = useSidebar();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch user's active tickets
    const { data: ticketsData } = useQuery({
        queryKey: ['tickets', 'active'],
        queryFn: async () => {
            const response = await api.get('/tickets', {
                params: { status: 'OPEN,IN_PROGRESS', pageSize: 5 }
            });
            return response.data;
        },
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/kb?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <div className="min-h-full">
            {/* Banner Background */}
            <div className="relative bg-primary-600 pt-4 pb-40 px-6">
                {/* Header Controls */}
                <div className="flex items-center justify-between mb-8 relative z-10">
                    {/* Menu Toggle Button */}
                    <button
                        onClick={toggle}
                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        title="Toggle menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* User Settings Button */}
                    <Link
                        to="/settings"
                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        title="User settings"
                    >
                        <User className="w-5 h-5" />
                    </Link>
                </div>

                <div className="flex flex-col items-center relative z-10">
                    {/* Centered Greeting */}
                    <h1 className="text-5xl font-bold text-white mb-12">
                        {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}
                    </h1>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="w-full max-w-4xl">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for help, articles, or tickets..."
                                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-full text-slate-800 placeholder-slate-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                            />
                        </div>
                    </form>

                    {/* Popular Searches */}
                    <div className="flex items-center gap-3 mt-5 flex-wrap justify-center">
                        <span className="text-white/70 text-sm">Popular searches:</span>
                        {['Password reset', 'VPN setup', 'Email', 'Printer', 'Software install'].map((term) => (
                            <button
                                key={term}
                                onClick={() => {
                                    setSearchQuery(term);
                                    navigate(`/kb?q=${encodeURIComponent(term)}`);
                                }}
                                className="px-4 py-1.5 text-sm text-white border border-white/40 rounded-full bg-transparent hover:bg-white/10 transition-colors"
                            >
                                {term}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Curved bottom edge */}
                <svg
                    className="absolute bottom-0 left-0 w-full h-16"
                    viewBox="0 0 1440 64"
                    preserveAspectRatio="none"
                    fill="none"
                >
                    <path
                        d="M0 64L1440 64L1440 0C1440 0 1080 64 720 64C360 64 0 0 0 0L0 64Z"
                        fill="#f8fafc"
                    />
                </svg>
            </div>

            {/* Action Buttons - Overlapping the banner */}
            <div className="px-6 -mt-12 relative z-20">
                <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Create Ticket Button */}
                    <Link
                        to="/tickets/new"
                        className="group flex items-center gap-4 py-7 px-6 bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all"
                    >
                        <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                            <Plus className="w-7 h-7 text-primary-500" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-slate-800 text-lg">Create Ticket</h3>
                            <p className="text-sm text-slate-500">Report an issue or request a service</p>
                        </div>
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center opacity-30 group-hover:opacity-60 transition-opacity">
                            <Plus className="w-6 h-6 text-primary-500" />
                        </div>
                    </Link>

                    {/* Browse Knowledge Base Button */}
                    <Link
                        to="/kb"
                        className="group flex items-center gap-4 py-7 px-6 bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all"
                    >
                        <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                            <BookOpen className="w-7 h-7 text-purple-500" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-slate-800 text-lg">Browse Knowledge Base</h3>
                            <p className="text-sm text-slate-500">Find answers and documentation</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center opacity-30 group-hover:opacity-60 transition-opacity">
                            <BookOpen className="w-6 h-6 text-purple-500" />
                        </div>
                    </Link>
                </div>
            </div>

            {/* Content Grid */}
            <div className="px-6 mt-8 pb-8">
                <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Active Tickets */}
                    <Card>
                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Ticket className="w-4 h-4 text-primary-500" />
                                Active Tickets
                            </h2>
                            <Link
                                to="/tickets"
                                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                            >
                                View all <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <CardContent className="p-0">
                            {ticketsData?.items?.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {ticketsData.items.slice(0, 5).map((ticket: any) => (
                                        <Link
                                            key={ticket.id}
                                            to={`/tickets/${ticket.id}`}
                                            className="block px-5 py-3 hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-slate-800 truncate">
                                                        {ticket.subject}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        #{ticket.ticketNumber}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <PriorityBadge priority={ticket.priority} />
                                                    <StatusBadge status={ticket.status} />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center text-slate-500">
                                    <Ticket className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                    <p className="text-sm">No active tickets</p>
                                    <Link to="/tickets/new" className="text-sm text-primary-600 hover:underline mt-1 inline-block">
                                        Create your first ticket
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Required Training */}
                    <Card>
                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-amber-500" />
                                Required Training
                            </h2>
                        </div>
                        <CardContent className="p-0">
                            <div className="py-10 text-center text-slate-500">
                                <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">No training assigned</p>
                                <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}


