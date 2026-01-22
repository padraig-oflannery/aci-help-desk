/**
 * Authentication Hooks
 * 
 * React hooks for auth state and operations.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api, { setTokens, clearTokens } from '../lib/api';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'EMPLOYEE' | 'ADMIN' | 'SUPER_ADMIN';
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    restoreSession: () => Promise<boolean>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isLoading: true,
            error: null,

            login: async (email: string, password: string, rememberMe: boolean = false) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post('/auth/login', { email, password });
                    const { accessToken, refreshToken, user } = response.data;

                    setTokens(accessToken, refreshToken);
                    set({ user, isAuthenticated: true, isLoading: false });

                    // Store refresh token securely if "Remember Me" is checked
                    if (rememberMe && window.electronAPI?.auth) {
                        await window.electronAPI.auth.storeToken(refreshToken);
                    } else if (window.electronAPI?.auth) {
                        // Clear any existing stored token if not remembering
                        await window.electronAPI.auth.clearToken();
                    }

                    return true;
                } catch (error: any) {
                    const message = error.response?.data?.error || 'Login failed';
                    set({ error: message, isLoading: false });
                    return false;
                }
            },

            logout: async () => {
                try {
                    await api.post('/auth/logout');
                } catch {
                    // Ignore errors during logout
                }
                clearTokens();
                // Clear stored token on logout
                if (window.electronAPI?.auth) {
                    await window.electronAPI.auth.clearToken();
                    // Transition to auth window (closes main window)
                    await window.electronAPI.auth.logout();
                }
                set({ user: null, isAuthenticated: false });
            },

            checkAuth: async () => {
                set({ isLoading: true });
                try {
                    const response = await api.get('/auth/me');
                    set({ user: response.data, isAuthenticated: true, isLoading: false });
                } catch {
                    clearTokens();
                    set({ user: null, isAuthenticated: false, isLoading: false });
                }
            },

            restoreSession: async () => {
                try {
                    // Get stored refresh token from secure storage
                    const storedToken = await window.electronAPI?.auth.getToken();
                    if (!storedToken) {
                        return false;
                    }

                    // Try to refresh the access token
                    const response = await api.post('/auth/refresh', { refreshToken: storedToken });
                    const { accessToken, user } = response.data;

                    // Store new access token and update state
                    setTokens(accessToken, storedToken);
                    set({ user, isAuthenticated: true, isLoading: false });
                    return true;
                } catch {
                    // Token invalid or expired, clear it
                    if (window.electronAPI?.auth) {
                        await window.electronAPI.auth.clearToken();
                    }
                    clearTokens();
                    set({ user: null, isAuthenticated: false, isLoading: false });
                    return false;
                }
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'helpdesk-auth',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
