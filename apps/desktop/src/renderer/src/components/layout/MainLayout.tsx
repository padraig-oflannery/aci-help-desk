/**
 * Main Layout Component
 * 
 * Layout wrapper with custom titlebar and collapsible sidebar for authenticated pages.
 */

import { useState, createContext, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TitleBar } from './TitleBar';

// Sidebar context for toggling from child components
interface SidebarContextType {
    isOpen: boolean;
    toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType>({ isOpen: true, toggle: () => { } });

export function useSidebar() {
    return useContext(SidebarContext);
}

export function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggle = () => setIsSidebarOpen(prev => !prev);

    return (
        <SidebarContext.Provider value={{ isOpen: isSidebarOpen, toggle }}>
            <div className="flex flex-col h-screen bg-slate-50">
                {/* Custom titlebar */}
                <TitleBar />

                {/* Main content area */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar - conditionally shown */}
                    <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-0'} z-50 overflow-hidden shadow-xl shadow-black/20`}>
                        <Sidebar />
                    </div>
                    <main className="flex-1 overflow-auto">
                        <Outlet />
                    </main>
                </div>
            </div>
        </SidebarContext.Provider>
    );
}
