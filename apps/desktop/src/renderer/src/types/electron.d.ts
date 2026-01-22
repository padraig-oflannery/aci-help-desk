/**
 * Electron API Type Declarations
 */

interface ElectronAPI {
    platform: string;

    auth: {
        storeToken: (token: string) => Promise<{ success: boolean }>;
        getToken: () => Promise<string | null>;
        clearToken: () => Promise<{ success: boolean }>;
        authSuccess: () => Promise<{ success: boolean }>;  // Transition to main window after login
        logout: () => Promise<{ success: boolean }>;       // Transition to auth window on logout
    };

    download: {
        file: (url: string, filename: string) => Promise<{ success: boolean; filePath: string; error?: string }>;
        cancel: (filename: string) => Promise<{ success: boolean }>;
        onProgress: (callback: (data: { filename: string; progress: number; downloadedSize: number; totalSize: number }) => void) => () => void;
        onComplete: (callback: (data: { filename: string; filePath: string }) => void) => () => void;
        onError: (callback: (data: { filename: string; error: string }) => void) => () => void;
    };

    system: {
        openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
        showInFolder: (filePath: string) => Promise<{ success: boolean; error?: string }>;
        getPath: (name: string) => Promise<string>;
        getAppVersion: () => Promise<string>;
    };

    window: {
        minimize: () => Promise<{ success: boolean }>;
        maximize: () => Promise<{ success: boolean; isMaximized?: boolean }>;
        close: () => Promise<{ success: boolean }>;
    };

    splash: {
        checkAuth: () => Promise<{ hasToken: boolean }>;
        complete: (isAuthenticated: boolean) => Promise<{ success: boolean }>;
    };
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

export { };
