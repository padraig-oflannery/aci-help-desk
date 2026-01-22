/**
 * Auto-Updater Module
 * 
 * Handles checking for updates and downloading them using electron-updater.
 */

import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import { BrowserWindow, ipcMain } from 'electron';
import { IPC_CHANNELS } from './ipc/channels';

// Configure auto-updater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Track update state
let updateAvailable = false;
let updateDownloaded = false;
let mainWindow: BrowserWindow | null = null;

/**
 * Send update status to renderer
 */
function sendStatusToWindow(channel: string, data?: unknown) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel, data);
    }
}

/**
 * Initialize the auto-updater with window reference
 */
export function initAutoUpdater(window: BrowserWindow) {
    mainWindow = window;

    // Set up event handlers
    autoUpdater.on('checking-for-update', () => {
        sendStatusToWindow(IPC_CHANNELS.UPDATE_STATUS, { status: 'checking' });
    });

    autoUpdater.on('update-available', (info: UpdateInfo) => {
        updateAvailable = true;
        sendStatusToWindow(IPC_CHANNELS.UPDATE_AVAILABLE, {
            version: info.version,
            releaseDate: info.releaseDate,
            releaseNotes: info.releaseNotes,
        });
    });

    autoUpdater.on('update-not-available', () => {
        sendStatusToWindow(IPC_CHANNELS.UPDATE_STATUS, { status: 'up-to-date' });
    });

    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
        sendStatusToWindow(IPC_CHANNELS.UPDATE_PROGRESS, {
            percent: progress.percent,
            bytesPerSecond: progress.bytesPerSecond,
            transferred: progress.transferred,
            total: progress.total,
        });
    });

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
        updateDownloaded = true;
        sendStatusToWindow(IPC_CHANNELS.UPDATE_DOWNLOADED, {
            version: info.version,
        });
    });

    autoUpdater.on('error', (error: Error) => {
        sendStatusToWindow(IPC_CHANNELS.UPDATE_ERROR, {
            message: error.message,
        });
    });
}

/**
 * Register update IPC handlers
 */
export function registerUpdateHandlers() {
    // Check for updates
    ipcMain.handle(IPC_CHANNELS.UPDATE_CHECK, async () => {
        try {
            const result = await autoUpdater.checkForUpdates();
            return {
                success: true,
                updateAvailable: !!result?.updateInfo,
                version: result?.updateInfo?.version,
            };
        } catch (error) {
            console.error('Update check failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Update check failed',
            };
        }
    });

    // Quit and install update
    ipcMain.handle(IPC_CHANNELS.UPDATE_INSTALL, async () => {
        if (updateDownloaded) {
            autoUpdater.quitAndInstall(false, true);
            return { success: true };
        }
        return { success: false, error: 'No update downloaded' };
    });
}

/**
 * Check for updates (can be called from main process)
 */
export function checkForUpdates() {
    return autoUpdater.checkForUpdates();
}

/**
 * Get current update state
 */
export function getUpdateState() {
    return {
        updateAvailable,
        updateDownloaded,
    };
}
