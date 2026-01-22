/**
 * Splash Page
 * 
 * Shows initialization progress and checks auth status before transitioning.
 */

import { useState, useEffect } from 'react';
import { APP_CONFIG } from '@helpdesk/shared';
import { X, Check, Shield, RotateCcw } from 'lucide-react';
import { useAuthStore } from '../hooks/useAuth';

type StepStatus = 'pending' | 'active' | 'complete' | 'error';

interface InitStep {
    id: string;
    label: string;
    description: string;
    status: StepStatus;
}

const initialSteps: InitStep[] = [
    { id: 'auth', label: 'User Authentication', description: 'Checking credentials...', status: 'pending' },
    { id: 'policy', label: 'Device Policy Check', description: 'Verifying policies...', status: 'pending' },
    { id: 'modules', label: 'Loading Modules', description: 'Fetching configuration...', status: 'pending' },
    { id: 'ui', label: 'Finalizing UI', description: 'Preparing interface...', status: 'pending' },
];

export function SplashPage() {
    const { restoreSession } = useAuthStore();
    const [steps, setSteps] = useState<InitStep[]>(initialSteps);
    const [headerText, setHeaderText] = useState('Initializing...');
    const [subText, setSubText] = useState('Preparing your workspace');
    const [hasError, setHasError] = useState(false);
    const [appVersion, setAppVersion] = useState('v1.0.0');



    const handleRetry = () => {
        setHasError(false);
        setSteps(initialSteps);
        runInitialization();
    };

    const updateStep = (stepId: string, status: StepStatus, description?: string) => {
        setSteps(prev => prev.map(step =>
            step.id === stepId
                ? { ...step, status, description: description || step.description }
                : step
        ));
    };

    const simulateStep = (stepId: string, duration: number, description: string, completeDescription: string): Promise<void> => {
        return new Promise((resolve) => {
            updateStep(stepId, 'active', description);
            setTimeout(() => {
                updateStep(stepId, 'complete', completeDescription);
                resolve();
            }, duration);
        });
    };

    const runInitialization = async () => {
        try {
            console.log('Starting initialization...');
            // Check if electronAPI is available
            if (!window.electronAPI) {
                console.warn('window.electronAPI is missing! Some features will be disabled.');
            }

            // Get app version
            const version = await window.electronAPI?.system.getAppVersion();
            if (version) setAppVersion(`v${version}`);

            // Step 1: Check authentication - validate with backend
            updateStep('auth', 'active', 'Checking credentials...');
            const authResult = await window.electronAPI?.splash.checkAuth();
            let isAuthenticated = false;

            if (authResult?.hasToken) {
                // Try to restore session from stored token
                isAuthenticated = await restoreSession();
                if (isAuthenticated) {
                    updateStep('auth', 'complete', 'Session restored');
                } else {
                    updateStep('auth', 'complete', 'Session expired');
                }
            } else {
                await new Promise(resolve => setTimeout(resolve, 400));
                updateStep('auth', 'complete', 'No stored session');
            }

            // Step 2: Device policy check
            await simulateStep('policy', 600, 'Verifying policies...', 'Policies updated');

            // Step 3: Loading modules
            await simulateStep('modules', 700, 'Fetching dashboard config...', 'Modules loaded');

            // Step 4: Finalizing UI
            await simulateStep('ui', 500, 'Preparing interface...', 'Ready');

            setHeaderText('Ready!');
            setSubText('Launching application...');

            // Small delay before transitioning
            setTimeout(async () => {
                console.log('[Splash] Starting window transition, isAuthenticated:', isAuthenticated);

                if (!window.electronAPI) {
                    console.error('[Splash] window.electronAPI is missing!');
                    setHasError(true);
                    setHeaderText('System Error');
                    setSubText('Desktop integration missing');
                    return;
                }

                try {
                    console.log('[Splash] Calling splash.complete...');
                    const result = await window.electronAPI.splash.complete(isAuthenticated);
                    console.log('[Splash] splash.complete result:', result);
                } catch (err) {
                    console.error('[Splash] Failed to complete splash:', err);
                    setHasError(true);
                    setHeaderText('Launch Error');
                    setSubText('Failed to transition window');
                }
            }, 400);

        } catch (error) {
            console.error('Initialization error:', error);
            setHasError(true);
            setHeaderText('Error');
            setSubText('Initialization failed');
        }
    };

    useEffect(() => {
        runInitialization();
    }, []);

    const getStepIcon = (status: StepStatus) => {
        switch (status) {
            case 'complete':
                return (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                    </div>
                );
            case 'active':
                return (
                    <div className="w-6 h-6 rounded-full bg-blue-500 animate-pulse flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                );
            case 'error':
                return (
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                        <X className="w-4 h-4 text-white" />
                    </div>
                );
            default:
                return (
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-slate-400" />
                    </div>
                );
        }
    };

    return (
        <div className="flex min-h-screen bg-white relative select-none">
            {/* Draggable title bar region */}
            <div
                className="absolute top-0 left-0 right-0 h-10 z-40"
                style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
            />

            {/* Left side - Branding */}
            <div className="w-1/2 bg-slate-50 flex flex-col items-center justify-center p-12 border-r border-slate-100">
                {/* Logo */}
                <div className="w-24 h-24 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mb-8">
                    <svg
                        className="w-12 h-12 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                    </svg>
                </div>

                {/* App name */}
                <h1 className="text-2xl font-bold text-slate-800 mb-2">
                    {APP_CONFIG.APP_NAME}
                </h1>
                <p className="text-slate-500 mb-8">
                    Enterprise Management Suite
                </p>

                {/* Secure connection indicator */}
                <div className="flex items-center gap-2 text-green-600">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Secure Connection</span>
                </div>
            </div>

            {/* Right side - Initialization steps */}
            <div className="w-1/2 flex flex-col p-12">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-slate-800 mb-1">
                        {headerText}
                    </h2>
                    <p className="text-slate-500 text-sm">{subText}</p>
                </div>

                {/* Steps */}
                <div className="flex-1 space-y-6">
                    {steps.map((step) => (
                        <div key={step.id} className="flex items-start gap-4">
                            {getStepIcon(step.status)}
                            <div className="flex-1">
                                <h3 className={`font-medium ${step.status === 'pending'
                                    ? 'text-slate-400'
                                    : step.status === 'error'
                                        ? 'text-red-600'
                                        : 'text-slate-700'
                                    }`}>
                                    {step.label}
                                </h3>
                                {step.status !== 'pending' && (
                                    <p className={`text-sm ${step.status === 'error' ? 'text-red-500' : 'text-slate-400'
                                        }`}>
                                        {step.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                    <span className="text-sm text-slate-400">
                        {appVersion}
                    </span>
                    {hasError && (
                        <button
                            onClick={handleRetry}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Retry
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
