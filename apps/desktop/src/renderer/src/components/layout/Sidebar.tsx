/**
 * Sidebar Component
 * 
 * Main navigation sidebar for the application.
 */

import { NavLink, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { APP_CONFIG } from '@helpdesk/shared';
import { useAuthStore } from '../../hooks/useAuth';
import {
    Home,
    Book,
    Ticket,
    Users,
    LogOut,
    Search,
    FileText,
} from 'lucide-react';

interface NavItem {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    to: string;
    adminOnly?: boolean;
}

const navItems: NavItem[] = [
    { icon: Home, label: 'Dashboard', to: '/dashboard' },
    { icon: Book, label: 'Knowledge Base', to: '/kb' },
    { icon: Ticket, label: 'My Tickets', to: '/tickets' },
];

const adminItems: NavItem[] = [
    { icon: Users, label: 'Users', to: '/admin/users' },
    { icon: FileText, label: 'Articles', to: '/admin/articles' },
    { icon: Book, label: 'Manage KB', to: '/admin/kb' },
    { icon: Ticket, label: 'All Tickets', to: '/admin/tickets' },
];

export function Sidebar() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isAdmin = user?.role === 'ADMIN';

    return (
        <aside className="flex flex-col bg-sidebar border-r border-slate-200 h-[calc(100vh-40px)] w-64">
            {/* Logo */}
            <div className="flex items-center h-16 px-4 border-b border-slate-200">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                    <Search className="w-4 h-4 text-primary-600" />
                </div>
                <span className="ml-3 font-semibold text-slate-800 truncate">
                    {APP_CONFIG.APP_NAME}
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 overflow-y-auto">
                <div className="px-3 mb-2">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Main
                    </span>
                </div>

                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            clsx(
                                'flex items-center h-10 mx-2 px-3 rounded-lg transition-colors',
                                isActive
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'text-slate-600 hover:bg-slate-100'
                            )
                        }
                    >
                        <item.icon className="w-5 h-5 shrink-0" />
                        <span className="ml-3">{item.label}</span>
                    </NavLink>
                ))}

                {isAdmin && (
                    <>
                        <div className="px-3 mt-6 mb-2">
                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Admin
                            </span>
                        </div>

                        {adminItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    clsx(
                                        'flex items-center h-10 mx-2 px-3 rounded-lg transition-colors',
                                        isActive
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-slate-600 hover:bg-slate-100'
                                    )
                                }
                            >
                                <item.icon className="w-5 h-5 shrink-0" />
                                <span className="ml-3">{item.label}</span>
                            </NavLink>
                        ))}
                    </>
                )}
            </nav>

            {/* User section */}
            <div className="border-t border-slate-200 p-3">
                {user && (
                    <div className="flex items-center mb-3 px-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-700">
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="ml-3 truncate">
                            <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.role}</p>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    className="flex items-center h-10 px-3 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors w-full"
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    <span className="ml-3">Logout</span>
                </button>
            </div>
        </aside>
    );
}
