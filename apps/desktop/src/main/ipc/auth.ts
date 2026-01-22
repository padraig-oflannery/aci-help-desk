/**
 * Auth IPC Handlers
 * 
 * Securely stores tokens using the system keychain.
 */

import { ipcMain, safeStorage } from 'electron';
import { IPC_CHANNELS } from './channels';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

// Token file path - computed lazily after app is ready
let tokenFilePath: string | null = null;

function getTokenFilePath(): string {
    if (!tokenFilePath) {
        tokenFilePath = path.join(app.getPath('userData'), 'auth.enc');
    }
    return tokenFilePath;
}

/**
 * Store encrypted token
 */
function storeToken(token: string): { success: boolean } {
    try {
        const TOKEN_FILE = getTokenFilePath();
        if (safeStorage.isEncryptionAvailable()) {
            const encrypted = safeStorage.encryptString(token);
            fs.writeFileSync(TOKEN_FILE, encrypted);
        } else {
            // Fallback: store base64 encoded (less secure)
            fs.writeFileSync(TOKEN_FILE, Buffer.from(token).toString('base64'));
        }
        return { success: true };
    } catch (error) {
        console.error('Failed to store token:', error);
        return { success: false };
    }
}

/**
 * Retrieve encrypted token
 */
function getToken(): string | null {
    try {
        const TOKEN_FILE = getTokenFilePath();
        if (!fs.existsSync(TOKEN_FILE)) {
            return null;
        }

        const data = fs.readFileSync(TOKEN_FILE);

        if (safeStorage.isEncryptionAvailable()) {
            return safeStorage.decryptString(data);
        } else {
            // Fallback: decode base64
            return Buffer.from(data.toString(), 'base64').toString();
        }
    } catch (error) {
        console.error('Failed to get token:', error);
        return null;
    }
}

/**
 * Clear stored token
 */
function clearToken(): { success: boolean } {
    try {
        const TOKEN_FILE = getTokenFilePath();
        if (fs.existsSync(TOKEN_FILE)) {
            fs.unlinkSync(TOKEN_FILE);
        }
        return { success: true };
    } catch (error) {
        console.error('Failed to clear token:', error);
        return { success: false };
    }
}

/**
 * Register auth IPC handlers
 */
export function registerAuthHandlers() {
    ipcMain.handle(IPC_CHANNELS.AUTH_STORE_TOKEN, async (_event, token: string) => {
        return storeToken(token);
    });

    ipcMain.handle(IPC_CHANNELS.AUTH_GET_TOKEN, async () => {
        return getToken();
    });

    ipcMain.handle(IPC_CHANNELS.AUTH_CLEAR_TOKEN, async () => {
        return clearToken();
    });
}

