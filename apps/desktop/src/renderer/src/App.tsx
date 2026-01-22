/**
 * App Component
 * 
 * Main application with routing and auth guards.
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './hooks/useAuth';
import { MainLayout } from './components/layout';
import {
    LoginPage,
    ForgotPasswordPage,
    DashboardPage,
    KnowledgeBasePage,
    KBDetailPage,
    TicketsPage,
    NewTicketPage,
    TicketDetailPage,
    SettingsPage,
    AdminUsersPage,
    AdminKBPage,
    AdminTicketsPage,
    AdminArticlesPage,
    AdminArticleEditorPage,
    SplashPage,
} from './pages';

// Protected route wrapper
function ProtectedRoute() {
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}

// Admin route wrapper
function AdminRoute() {
    const { user } = useAuthStore();

    if (user?.role !== 'ADMIN') {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}

// Public route wrapper (redirect to dashboard if already logged in)
// function PublicRoute() {
//     const { isAuthenticated, isLoading } = useAuthStore();

//     if (isLoading) {
//         return (
//             <div className="flex items-center justify-center min-h-screen bg-slate-50">
//                 <div className="text-center">
//                     <div className="animate-spin w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
//                     <p className="text-slate-500">Loading...</p>
//                 </div>
//             </div>
//         );
//     }

//     if (isAuthenticated) {
//         return <Navigate to="/dashboard" replace />;
//     }

//     return <Outlet />;
// }

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Splash screen - no auth check needed */}
                <Route path="/splash" element={<SplashPage />} />

                {/* Auth pages - no wrapper needed, splash handles auth check */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* Protected routes with MainLayout */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<MainLayout />}>
                        {/* Main pages */}
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/kb" element={<KnowledgeBasePage />} />
                        <Route path="/kb/:id" element={<KBDetailPage />} />
                        <Route path="/tickets" element={<TicketsPage />} />
                        <Route path="/tickets/new" element={<NewTicketPage />} />
                        <Route path="/tickets/:id" element={<TicketDetailPage />} />
                        <Route path="/settings" element={<SettingsPage />} />

                        {/* Admin routes */}
                        <Route element={<AdminRoute />}>
                            <Route path="/admin/users" element={<AdminUsersPage />} />
                            <Route path="/admin/articles" element={<AdminArticlesPage />} />
                            <Route path="/admin/articles/:id" element={<AdminArticleEditorPage />} />
                            <Route path="/admin/kb" element={<AdminKBPage />} />
                            <Route path="/admin/tickets" element={<AdminTicketsPage />} />
                        </Route>
                    </Route>
                </Route>

                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/splash" replace />} />
                <Route path="*" element={<Navigate to="/splash" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
