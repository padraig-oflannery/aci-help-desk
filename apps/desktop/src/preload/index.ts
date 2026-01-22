/**
 * Preload Script
 * 
 * Exposes safe Electron APIs to the renderer via contextBridge.
 */

import { contextBridge, ipcRenderer } from 'electron';

// IPC channel constants (must match main process)
const IPC_CHANNELS = {
    // Auth
    AUTH_STORE_TOKEN: 'auth:store-token',
    AUTH_GET_TOKEN: 'auth:get-token',
    AUTH_CLEAR_TOKEN: 'auth:clear-token',
    AUTH_SUCCESS: 'auth:success',
    AUTH_LOGOUT: 'auth:logout',

    // Downloads
    DOWNLOAD_FILE: 'download:file',
    DOWNLOAD_PROGRESS: 'download:progress',
    DOWNLOAD_COMPLETE: 'download:complete',
    DOWNLOAD_ERROR: 'download:error',
    DOWNLOAD_CANCEL: 'download:cancel',

    // System
    SYSTEM_OPEN_EXTERNAL: 'system:open-external',
    SYSTEM_SHOW_IN_FOLDER: 'system:show-in-folder',
    SYSTEM_GET_PATH: 'system:get-path',
    SYSTEM_GET_APP_VERSION: 'system:get-app-version',

    // Window
    WINDOW_MINIMIZE: 'window:minimize',
    WINDOW_MAXIMIZE: 'window:maximize',
    WINDOW_CLOSE: 'window:close',

    // Splash
    SPLASH_CHECK_AUTH: 'splash:check-auth',
    SPLASH_COMPLETE: 'splash:complete',

    // Updates
    UPDATE_CHECK: 'update:check',
    UPDATE_INSTALL: 'update:install',
    UPDATE_STATUS: 'update:status',
    UPDATE_PROGRESS: 'update:progress',
    UPDATE_AVAILABLE: 'update:available',
    UPDATE_DOWNLOADED: 'update:downloaded',
    UPDATE_ERROR: 'update:error',
} as const;

// Type definitions for the exposed API
export interface ElectronAPI {
    platform: string;

    auth: {
        storeToken: (token: string) => Promise<{ success: boolean }>;
        getToken: () => Promise<string | null>;
        clearToken: () => Promise<{ success: boolean }>;
        authSuccess: () => Promise<{ success: boolean }>;  // Transition to main window
        logout: () => Promise<{ success: boolean }>;       // Transition to auth window
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

    update: {
        check: () => Promise<{ success: boolean; updateAvailable?: boolean; version?: string; error?: string }>;
        install: () => Promise<{ success: boolean; error?: string }>;
        onProgress: (callback: (data: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void) => () => void;
        onAvailable: (callback: (data: { version: string; releaseDate?: string }) => void) => () => void;
        onDownloaded: (callback: (data: { version: string }) => void) => () => void;
        onError: (callback: (data: { message: string }) => void) => () => void;
    };
}

// Create the API object
const electronAPI: ElectronAPI = {
    platform: process.platform,

    auth: {
        storeToken: (token: string) =>
            ipcRenderer.invoke(IPC_CHANNELS.AUTH_STORE_TOKEN, token),
        getToken: () =>
            ipcRenderer.invoke(IPC_CHANNELS.AUTH_GET_TOKEN),
        clearToken: () =>
            ipcRenderer.invoke(IPC_CHANNELS.AUTH_CLEAR_TOKEN),
        authSuccess: () =>
            ipcRenderer.invoke(IPC_CHANNELS.AUTH_SUCCESS),
        logout: () =>
            ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGOUT),
    },

    download: {
        file: (url: string, filename: string) =>
            ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_FILE, url, filename),
        cancel: (filename: string) =>
            ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_CANCEL, filename),
        onProgress: (callback) => {
            const handler = (_event: any, data: any) => callback(data);
            ipcRenderer.on(IPC_CHANNELS.DOWNLOAD_PROGRESS, handler);
            return () => ipcRenderer.removeListener(IPC_CHANNELS.DOWNLOAD_PROGRESS, handler);
        },
        onComplete: (callback) => {
            const handler = (_event: any, data: any) => callback(data);
            ipcRenderer.on(IPC_CHANNELS.DOWNLOAD_COMPLETE, handler);
            return () => ipcRenderer.removeListener(IPC_CHANNELS.DOWNLOAD_COMPLETE, handler);
        },
        onError: (callback) => {
            const handler = (_event: any, data: any) => callback(data);
            ipcRenderer.on(IPC_CHANNELS.DOWNLOAD_ERROR, handler);
            return () => ipcRenderer.removeListener(IPC_CHANNELS.DOWNLOAD_ERROR, handler);
        },
    },

    system: {
        openExternal: (url: string) =>
            ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_OPEN_EXTERNAL, url),
        showInFolder: (filePath: string) =>
            ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_SHOW_IN_FOLDER, filePath),
        getPath: (name: string) =>
            ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_PATH, name),
        getAppVersion: () =>
            ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_APP_VERSION),
    },

    window: {
        minimize: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE),
        maximize: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MAXIMIZE),
        close: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE),
    },

    splash: {
        checkAuth: () => ipcRenderer.invoke(IPC_CHANNELS.SPLASH_CHECK_AUTH),
        complete: (isAuthenticated: boolean) => ipcRenderer.invoke(IPC_CHANNELS.SPLASH_COMPLETE, isAuthenticated),
    },

    update: {
        check: () => ipcRenderer.invoke(IPC_CHANNELS.UPDATE_CHECK),
        install: () => ipcRenderer.invoke(IPC_CHANNELS.UPDATE_INSTALL),
        onProgress: (callback) => {
            const handler = (_event: any, data: any) => callback(data);
            ipcRenderer.on(IPC_CHANNELS.UPDATE_PROGRESS, handler);
            return () => ipcRenderer.removeListener(IPC_CHANNELS.UPDATE_PROGRESS, handler);
        },
        onAvailable: (callback) => {
            const handler = (_event: any, data: any) => callback(data);
            ipcRenderer.on(IPC_CHANNELS.UPDATE_AVAILABLE, handler);
            return () => ipcRenderer.removeListener(IPC_CHANNELS.UPDATE_AVAILABLE, handler);
        },
        onDownloaded: (callback) => {
            const handler = (_event: any, data: any) => callback(data);
            ipcRenderer.on(IPC_CHANNELS.UPDATE_DOWNLOADED, handler);
            return () => ipcRenderer.removeListener(IPC_CHANNELS.UPDATE_DOWNLOADED, handler);
        },
        onError: (callback) => {
            const handler = (_event: any, data: any) => callback(data);
            ipcRenderer.on(IPC_CHANNELS.UPDATE_ERROR, handler);
            return () => ipcRenderer.removeListener(IPC_CHANNELS.UPDATE_ERROR, handler);
        },
    },
};

// Expose to renderer
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
