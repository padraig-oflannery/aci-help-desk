/**
 * TitleBar Component
 * 
 * Custom window titlebar with minimize, maximize, and close buttons.
 * Matches the primary color theme and is draggable.
 */

import { useState } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';

export function TitleBar() {
    const [isMaximized, setIsMaximized] = useState(false);

    const handleMinimize = async () => {
        try {
            await window.electronAPI?.window.minimize();
        } catch (error) {
            console.error('Failed to minimize window:', error);
        }
    };

    const handleMaximize = async () => {
        try {
            const result = await window.electronAPI?.window.maximize();
            if (result?.isMaximized !== undefined) {
                setIsMaximized(result.isMaximized);
            } else {
                setIsMaximized(prev => !prev);
            }
        } catch (error) {
            console.error('Failed to maximize window:', error);
        }
    };

    const handleClose = async () => {
        try {
            await window.electronAPI?.window.close();
        } catch (error) {
            console.error('Failed to close window:', error);
        }
    };

    return (
        <div
            className="titlebar-drag h-10 bg-primary-600 flex items-center justify-between select-none border-b border-white/10"
        >
            {/* Left side - App title */}
            <div className="flex items-center gap-2 px-4">
                <svg
                    className="w-5 h-5 text-white/90"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                </svg>
                <span className="text-white/90 text-sm font-medium">IT Helpdesk Pro</span>
            </div>

            {/* Right side - Window controls */}
            <div className="titlebar-no-drag flex items-center h-full">
                {/* Minimize button */}
                <button
                    type="button"
                    onClick={handleMinimize}
                    className="titlebar-button h-full px-4 flex items-center justify-center text-white/80 hover:bg-white/10 transition-colors"
                    title="Minimize"
                >
                    <Minus className="w-4 h-4 pointer-events-none" />
                </button>

                {/* Maximize/Restore button */}
                <button
                    type="button"
                    onClick={handleMaximize}
                    className="titlebar-button h-full px-4 flex items-center justify-center text-white/80 hover:bg-white/10 transition-colors"
                    title={isMaximized ? 'Restore' : 'Maximize'}
                >
                    {isMaximized ? (
                        <Copy className="w-3.5 h-3.5 pointer-events-none" />
                    ) : (
                        <Square className="w-3.5 h-3.5 pointer-events-none" />
                    )}
                </button>

                {/* Close button */}
                <button
                    type="button"
                    onClick={handleClose}
                    className="titlebar-button h-full px-4 flex items-center justify-center text-white/80 hover:bg-red-500 transition-colors"
                    title="Close to tray"
                >
                    <X className="w-4 h-4 pointer-events-none" />
                </button>
            </div>
        </div>
    );
}
