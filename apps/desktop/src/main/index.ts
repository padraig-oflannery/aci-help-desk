/**
 * IT Helpdesk Pro - Electron Main Process
 * 
 * Handles window creation, IPC, and application lifecycle.
 */

import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { join } from 'path';
import * as fs from 'fs';
import { registerAllIPCHandlers } from './ipc';
import { IPC_CHANNELS } from './ipc/channels';
import { createTray, hasTray } from './tray';
import { initAutoUpdater, registerUpdateHandlers, checkForUpdates } from './updater';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// Note: electron-squirrel-startup is handled by electron-builder's NSIS installer

let splashWindow: BrowserWindow | null = null;
let authWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;
let isQuitting = false;
let isTransitioning = false; // Prevent duplicate window transitions

// Token file path - computed lazily after app is ready
let tokenFilePath: string | null = null;

function getTokenFilePath(): string {
    if (!tokenFilePath) {
        tokenFilePath = join(app.getPath('userData'), 'auth.enc');
    }
    return tokenFilePath;
}

function hasAuthToken(): boolean {
    try {
        const TOKEN_FILE = getTokenFilePath();
        return fs.existsSync(TOKEN_FILE);
    } catch {
        return false;
    }
}

function createSplashWindow() {
    // Create frameless splash window
    splashWindow = new BrowserWindow({
        width: 900,
        height: 520,
        frame: false,
        resizable: false,
        minimizable: false,
        maximizable: false,
        title: 'IT Helpdesk Pro',
        icon: join(__dirname, '../../resources/icon.png'),
        webPreferences: {
            preload: join(__dirname, '../preload/index.mjs'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
        },
        show: false,
        backgroundColor: '#ffffff',
    });

    splashWindow.once('ready-to-show', () => {
        splashWindow?.show();
    });

    splashWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:') || url.startsWith('http:')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    // Load splash page
    const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
    if (VITE_DEV_SERVER_URL) {
        splashWindow.loadURL(VITE_DEV_SERVER_URL + 'splash');
        // splashWindow.webContents.openDevTools();
    } else {
        splashWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }

    splashWindow.on('closed', () => {
        splashWindow = null;
    });
}

function createAuthWindow() {
    // Create frameless auth window
    authWindow = new BrowserWindow({
        width: 900,
        height: 600,
        maxWidth: 900,
        maxHeight: 600,
        frame: false,
        resizable: false,
        minimizable: false,
        maximizable: false,
        title: 'IT Helpdesk Pro - Login',
        icon: join(__dirname, '../../resources/icon.png'),
        webPreferences: {
            preload: join(__dirname, '../preload/index.mjs'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
        },
        show: false,
        backgroundColor: '#f8fafc',
    });

    authWindow.once('ready-to-show', () => {
        authWindow?.show();
    });

    authWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:') || url.startsWith('http:')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    // Load login page
    const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
    if (VITE_DEV_SERVER_URL) {
        authWindow.loadURL(VITE_DEV_SERVER_URL + 'login');
        // authWindow.webContents.openDevTools();
    } else {
        authWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }

    authWindow.on('closed', () => {
        authWindow = null;
    });
}

function createMainWindow() {
    // Create the main browser window (frameless for custom titlebar)
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 700,
        frame: false,
        title: 'IT Helpdesk Pro',
        icon: join(__dirname, '../../resources/icon.png'),
        webPreferences: {
            preload: join(__dirname, '../preload/index.mjs'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
        },
        show: false,
        backgroundColor: '#f8fafc',
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:') || url.startsWith('http:')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    // Load dashboard
    const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
    if (VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(VITE_DEV_SERVER_URL + 'dashboard');
        // mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }

    // Hide to tray instead of closing
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow?.hide();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Create tray icon with enhanced functionality
    createTray({
        onShowWindow: () => {
            mainWindow?.show();
            mainWindow?.focus();
        },
        onQuit: () => {
            isQuitting = true;
            app.quit();
        },
        onNewTicket: () => {
            // Navigate to new ticket page
            mainWindow?.show();
            mainWindow?.focus();
            mainWindow?.webContents.send('navigate', '/tickets/new');
        },
        onOpenSettings: () => {
            mainWindow?.show();
            mainWindow?.focus();
            mainWindow?.webContents.send('navigate', '/settings');
        },
        onStatusChange: (status) => {
            // Notify renderer of status change
            mainWindow?.webContents.send('tray-status-changed', status);
        },
        onCheckForUpdates: () => {
            // Trigger update check from tray menu
            checkForUpdates();
        },
    });

    // Initialize auto-updater with main window
    initAutoUpdater(mainWindow);
}

// Register splash and window transition handlers
function registerWindowTransitionHandlers() {
    // Check if auth token exists
    ipcMain.handle(IPC_CHANNELS.SPLASH_CHECK_AUTH, async () => {
        return { hasToken: hasAuthToken() };
    });

    // Splash complete - transition to next window
    ipcMain.handle(IPC_CHANNELS.SPLASH_COMPLETE, async (_event, isAuthenticated: boolean) => {
        console.log('[Main] SPLASH_COMPLETE handler called, isAuthenticated:', isAuthenticated);

        // Prevent duplicate transitions (can happen with React StrictMode)
        if (isTransitioning) {
            console.log('[Main] Already transitioning, ignoring duplicate call');
            return { success: true };
        }
        isTransitioning = true;

        try {
            // Close splash window and wait for it to fully close
            if (splashWindow) {
                console.log('[Main] Closing splash window...');
                await new Promise<void>((resolve) => {
                    splashWindow!.once('closed', () => {
                        console.log('[Main] Splash window closed');
                        resolve();
                    });
                    splashWindow!.close();
                });
                splashWindow = null;
            }

            // Open appropriate window (only if not already created)
            if (isAuthenticated) {
                if (!mainWindow) {
                    console.log('[Main] Creating main window...');
                    createMainWindow();
                } else {
                    console.log('[Main] Main window already exists, showing it');
                    mainWindow.show();
                }
            } else {
                if (!authWindow) {
                    console.log('[Main] Creating auth window...');
                    createAuthWindow();
                } else {
                    console.log('[Main] Auth window already exists, showing it');
                    authWindow.show();
                }
            }

            console.log('[Main] Window transition complete');
            return { success: true };
        } catch (error) {
            console.error('[Main] Error in SPLASH_COMPLETE handler:', error);
            throw error;
        } finally {
            isTransitioning = false;
        }
    });

    // Auth success - transition from auth to main window
    ipcMain.handle(IPC_CHANNELS.AUTH_SUCCESS, async () => {
        console.log('[Main] AUTH_SUCCESS handler called');

        // Check if we have an auth window to close
        if (!authWindow) {
            console.log('[Main] No auth window to close, checking if main window exists');
            if (mainWindow) {
                console.log('[Main] Main window already exists, just showing it');
                mainWindow.show();
                mainWindow.focus();
                return { success: true };
            }
        }

        // Prevent duplicate transitions
        if (isTransitioning) {
            console.log('[Main] Already transitioning, ignoring duplicate call');
            return { success: true };
        }
        isTransitioning = true;

        try {
            if (authWindow) {
                // Wait for window to actually close before proceeding
                await new Promise<void>((resolve) => {
                    authWindow!.once('closed', () => {
                        console.log('[Main] Auth window closed');
                        resolve();
                    });
                    authWindow!.close();
                });
                authWindow = null;
            }

            if (!mainWindow) {
                console.log('[Main] Creating main window after auth success');
                createMainWindow();
            } else {
                console.log('[Main] Main window already exists, showing it');
                mainWindow.show();
                mainWindow.focus();
            }

            return { success: true };
        } finally {
            isTransitioning = false;
        }
    });

    // Logout - transition from main window to auth window
    ipcMain.handle(IPC_CHANNELS.AUTH_LOGOUT, async () => {
        console.log('[Main] AUTH_LOGOUT handler called');

        // Prevent duplicate transitions
        if (isTransitioning) {
            console.log('[Main] Already transitioning, ignoring duplicate call');
            return { success: true };
        }
        isTransitioning = true;

        try {
            // Close main window and wait for it to fully close
            if (mainWindow) {
                console.log('[Main] Closing main window for logout...');
                // Temporarily set isQuitting to true to allow the window to actually close
                isQuitting = true;
                await new Promise<void>((resolve) => {
                    mainWindow!.once('closed', () => {
                        console.log('[Main] Main window closed');
                        resolve();
                    });
                    mainWindow!.destroy(); // Use destroy to bypass the close handler
                });
                mainWindow = null;
                isQuitting = false;
            }

            // Create auth window
            if (!authWindow) {
                console.log('[Main] Creating auth window for logout...');
                createAuthWindow();
            } else {
                console.log('[Main] Auth window already exists, showing it');
                authWindow.show();
                authWindow.focus();
            }

            return { success: true };
        } finally {
            isTransitioning = false;
        }
    });
}

// Register all IPC handlers before creating window
app.whenReady().then(() => {
    registerAllIPCHandlers();
    registerUpdateHandlers();
    registerWindowTransitionHandlers();
    createSplashWindow();
});

// Set quitting flag when app is about to quit
app.on('before-quit', () => {
    isQuitting = true;
});

// Quit when all windows are closed (unless minimized to tray)
app.on('window-all-closed', () => {
    // Don't quit if we have a tray icon (app is running in background)
    if (!hasTray() && process.platform !== 'darwin') {
        app.quit();
    }
});

// macOS: recreate window when dock icon is clicked
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        if (!splashWindow && !authWindow && !mainWindow) {
            createSplashWindow();
        }
    }
});

// Security: prevent navigation to external URLs
app.on('web-contents-created', (_, contents) => {
    contents.on('will-navigate', (event, url) => {
        const parsedUrl = new URL(url);
        const isLocalhost = parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';
        if (!isLocalhost && !url.startsWith('file://')) {
            event.preventDefault();
        }
    });
});
