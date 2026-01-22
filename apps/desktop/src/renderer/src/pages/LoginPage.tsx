/**
 * Login Page
 * 
 * Split-screen login with branding on the left, form on the right.
 * Features a frameless window with custom close button.
 */

import { useState } from 'react';
import { APP_CONFIG } from '@helpdesk/shared';
import { Button, Input } from '../components/ui';
import { useAuthStore } from '../hooks/useAuth';
import { X } from 'lucide-react';

export function LoginPage() {
    const { login, error, clearError } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleClose = () => {
        window.electronAPI?.window.close();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setIsSubmitting(true);

        const success = await login(email, password, rememberMe);
        setIsSubmitting(false);

        if (success) {
            // Transition to main window after successful login
            await window.electronAPI?.auth.authSuccess();
        }
    };

    return (
        <div className="flex min-h-screen relative">
            {/* Draggable title bar region for frameless window */}
            <div
                className="absolute top-0 left-0 right-0 h-8 z-50"
            // style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
            />

            {/* Close button in top right corner */}
            <button
                onClick={handleClose}
                className="absolute top-2 right-2 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-red-500 hover:text-white text-slate-400 transition-colors"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                title="Close"
            >
                <X className="w-4 h-4" />
            </button>

            {/* Left side - Branding */}
            <div className="hidden md:flex md:w-1/2 bg-slate-50 p-12 flex-col justify-between gap-6 text-center select-none">
                <div className='w-full flex flex-col gap-2 items-center justify-center'>
                    <div className="mb-6 w-32 h-32 bg-white rounded-xl flex items-center justify-center shadow-[3px_3px_18px_0px] shadow-primary-400">
                        <svg
                            className="w-24 h-24 text-primary-400 animate-pulse"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                        </svg>
                    </div>
                    <div className='w-full flex flex-col items-center justify-center'>
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">
                            {APP_CONFIG.APP_NAME}
                        </h1>
                        <p className="text-xl text-slate-500">
                            {APP_CONFIG.APP_TAGLINE}
                        </p>
                    </div>
                </div>

                <p className="text-sm text-slate-400">
                    © 2026 {APP_CONFIG.APP_NAME}.
                </p>
            </div>

            {/* Right side - Login form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-white border-l border-l-black/10">
                <div className="w-full max-w-md">
                    {/* <div className="text-center mb-8 lg:hidden">
                        <h1 className="text-2xl font-bold text-slate-800">
                            {APP_CONFIG.APP_NAME}
                        </h1>
                        <p className="text-slate-500 mt-1">{APP_CONFIG.APP_TAGLINE}</p>
                    </div> */}

                    <h2 className="text-3xl font-bold text-slate-800 mb-2">
                        Welcome back
                    </h2>
                    <p className="text-slate-500 mb-8">
                        Sign in with your company email to continue
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
                                {error}
                            </div>
                        )}

                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-slate-600">Remember me</span>
                            </label>

                            <a
                                href="/forgot-password"
                                className="text-sm text-primary-600 hover:text-primary-700"
                            >
                                Forgot password?
                            </a>
                        </div>
                        <div className='w-full flex items-center justify-end'>
                            <Button
                                type="submit"
                                className=""
                                size="lg"
                                isLoading={isSubmitting}
                            >
                                Sign In
                            </Button>
                        </div>

                    </form>

                    {/* <p className="mt-8 text-center text-sm text-slate-500">
                        Having trouble? Contact your IT administrator for assistance.
                    </p> */}
                </div>
            </div>
        </div>
    );
}
