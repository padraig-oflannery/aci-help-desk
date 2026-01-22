/**
 * Settings Page
 * 
 * User account settings and preferences.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, Button, Input } from '../components/ui';
import { useAuthStore } from '../hooks/useAuth';
import api from '../lib/api';
import { User, Lock, Monitor, LogOut, ArrowLeft } from 'lucide-react';

export function SettingsPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    // Profile form
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');

    // Password form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // Fetch sessions
    const { data: sessions } = useQuery({
        queryKey: ['auth', 'sessions'],
        queryFn: async () => {
            const response = await api.get('/auth/sessions');
            return response.data;
        },
    });

    // Update profile mutation
    const updateProfile = useMutation({
        mutationFn: async (data: { name?: string; email?: string }) => {
            const response = await api.patch('/auth/me', data);
            return response.data;
        },
        onSuccess: () => {
            setProfileSuccess('Profile updated successfully');
            setProfileError('');
            queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        },
        onError: (err: any) => {
            setProfileError(err.response?.data?.error || 'Failed to update profile');
            setProfileSuccess('');
        },
    });

    // Change password mutation
    const changePassword = useMutation({
        mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
            const response = await api.post('/auth/change-password', data);
            return response.data;
        },
        onSuccess: () => {
            setPasswordSuccess('Password changed successfully');
            setPasswordError('');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        },
        onError: (err: any) => {
            setPasswordError(err.response?.data?.error || 'Failed to change password');
            setPasswordSuccess('');
        },
    });

    // Revoke session mutation
    const revokeSession = useMutation({
        mutationFn: async (sessionId: string) => {
            await api.delete(`/auth/sessions/${sessionId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] });
        },
    });

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfile.mutate({ name, email });
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }
        changePassword.mutate({ currentPassword, newPassword });
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 mb-4 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
            </button>
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Account Settings</h1>

            {/* Profile Section */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-slate-600" />
                        <h2 className="font-semibold text-slate-800">Profile Information</h2>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        {profileError && (
                            <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
                                {profileError}
                            </div>
                        )}
                        {profileSuccess && (
                            <div className="p-3 bg-success-50 border border-success-200 rounded-lg text-success-700 text-sm">
                                {profileSuccess}
                            </div>
                        )}
                        <Input
                            label="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={user?.role === 'EMPLOYEE'}
                            helperText={user?.role === 'EMPLOYEE' ? 'This is managed by your IT department' : undefined}
                        />
                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={user?.role === 'EMPLOYEE'}
                            helperText={user?.role === 'EMPLOYEE' ? 'This is managed by your IT department' : undefined}
                        />
                        {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                            <Button type="submit" isLoading={updateProfile.isPending}>
                                Save Changes
                            </Button>
                        )}
                    </form>
                </CardContent>
            </Card>

            {/* Password Section */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-slate-600" />
                        <h2 className="font-semibold text-slate-800">Change Password</h2>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        {passwordError && (
                            <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
                                {passwordError}
                            </div>
                        )}
                        {passwordSuccess && (
                            <div className="p-3 bg-success-50 border border-success-200 rounded-lg text-success-700 text-sm">
                                {passwordSuccess}
                            </div>
                        )}
                        <Input
                            label="Current Password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <Input
                            label="New Password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            helperText="At least 8 characters with uppercase, lowercase, and numbers"
                        />
                        <Input
                            label="Confirm New Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <Button type="submit" isLoading={changePassword.isPending}>
                            Change Password
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Sessions Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-slate-600" />
                        <h2 className="font-semibold text-slate-800">Active Sessions</h2>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                        {sessions?.map((session: any) => (
                            <div key={session.id} className="flex items-center justify-between px-6 py-3">
                                <div>
                                    <p className="text-sm font-medium text-slate-800">
                                        {session.deviceLabel || 'Unknown Device'}
                                        {session.isCurrent && (
                                            <span className="ml-2 text-xs text-primary-600">(Current)</span>
                                        )}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Last active: {new Date(session.lastActiveAt).toLocaleString()}
                                    </p>
                                </div>
                                {!session.isCurrent && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => revokeSession.mutate(session.id)}
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
