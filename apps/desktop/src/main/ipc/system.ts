/**
 * System IPC Handlers
 * 
 * System-level operations like opening URLs and file paths.
 */

import { ipcMain, shell, app, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from './channels';

/**
 * Register system IPC handlers
 */
export function registerSystemHandlers() {
    // Open URL in default browser
    ipcMain.handle(IPC_CHANNELS.SYSTEM_OPEN_EXTERNAL, async (_event, url: string) => {
        try {
            // Validate URL
            const parsed = new URL(url);
            if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
                return { success: false, error: 'Invalid URL protocol' };
            }
            await shell.openExternal(url);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Show file in folder
    ipcMain.handle(IPC_CHANNELS.SYSTEM_SHOW_IN_FOLDER, async (_event, filePath: string) => {
        try {
            shell.showItemInFolder(filePath);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get app paths
    ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_PATH, async (_event, name: string) => {
        try {
            const validPaths = ['home', 'appData', 'userData', 'temp', 'desktop', 'documents', 'downloads'];
            if (!validPaths.includes(name)) {
                return '';
            }
            return app.getPath(name as any);
        } catch {
            return '';
        }
    });

    // Get app version
    ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_APP_VERSION, async () => {
        return app.getVersion();
    });

    // Window controls
    ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, async (event) => {
        const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();
        if (win) {
            win.minimize();
            return { success: true };
        }
        return { success: false, error: 'No window found' };
    });

    ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, async (event) => {
        const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();
        if (win) {
            if (win.isMaximized()) {
                win.unmaximize();
            } else {
                win.maximize();
            }
            return { success: true, isMaximized: win.isMaximized() };
        }
        return { success: false, error: 'No window found' };
    });

    ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, async (event) => {
        const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();
        if (win) {
            win.close();
            return { success: true };
        }
        return { success: false, error: 'No window found' };
    });
}
