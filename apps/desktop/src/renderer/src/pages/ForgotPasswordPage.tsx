/**
 * Forgot Password Page
 * 
 * Password reset request form with frameless window support.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { APP_CONFIG } from '@helpdesk/shared';
import { Button, Input, Card, CardContent } from '../components/ui';
import api from '../lib/api';
import { ArrowLeft, Mail, Check, X } from 'lucide-react';

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleClose = () => {
        window.electronAPI?.window.close();
    };

    const requestReset = useMutation({
        mutationFn: async (email: string) => {
            const response = await api.post('/auth/forgot-password', { email });
            return response.data;
        },
        onSuccess: () => {
            setSubmitted(true);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        requestReset.mutate(email);
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative">
                {/* Draggable title bar region for frameless window */}
                <div
                    className="absolute top-0 left-0 right-0 h-8 z-50"
                    style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
                />

                {/* Close button in top right corner */}
                <button
                    onClick={handleClose}
                    className="absolute top-2 right-2 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-red-500 hover:text-white text-slate-500 transition-colors"
                    style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                    title="Close"
                >
                    <X className="w-4 h-4" />
                </button>

                <Card className="w-full max-w-md">
                    <CardContent className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-800 mb-2">Check Your Email</h2>
                        <p className="text-slate-500 mb-6">
                            If an account exists for {email}, you will receive a password reset link shortly.
                        </p>
                        <Link to="/login">
                            <Button variant="outline">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Login
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative">
            {/* Draggable title bar region for frameless window */}
            <div
                className="absolute top-0 left-0 right-0 h-8 z-50"
                style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
            />

            {/* Close button in top right corner */}
            <button
                onClick={handleClose}
                className="absolute top-2 right-2 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-red-500 hover:text-white text-slate-500 transition-colors"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                title="Close"
            >
                <X className="w-4 h-4" />
            </button>

            <Card className="w-full max-w-md">
                <CardContent className="py-8">
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-6 h-6 text-primary-600" />
                        </div>
                        <h1 className="text-xl font-semibold text-slate-800 mb-2">Forgot Password?</h1>
                        <p className="text-slate-500">
                            Enter your email and we'll send you a reset link
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                        />

                        <Button type="submit" className="w-full" isLoading={requestReset.isPending}>
                            Send Reset Link
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700">
                            <ArrowLeft className="w-4 h-4 inline mr-1" />
                            Back to Login
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <p className="fixed bottom-6 text-center text-sm text-slate-400 w-full">
                © 2024 {APP_CONFIG.APP_NAME}
            </p>
        </div>
    );
}
