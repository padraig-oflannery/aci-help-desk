/**
 * Download IPC Handlers
 * 
 * Handles file downloads with progress reporting.
 */

import { ipcMain, BrowserWindow, app } from 'electron';
import { IPC_CHANNELS } from './channels';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';

// Active downloads tracking
const activeDownloads = new Map<string, { abort: () => void }>();

/**
 * Download a file from URL
 */
async function downloadFile(
    win: BrowserWindow | null,
    url: string,
    filename: string
): Promise<{ success: boolean; filePath: string; error?: string }> {
    return new Promise((resolve) => {
        try {
            // Get downloads folder
            const downloadsPath = app.getPath('downloads');
            const filePath = path.join(downloadsPath, filename);

            // Create write stream
            const file = fs.createWriteStream(filePath);

            // Handle response logic
            const handleResponse = (response: http.IncomingMessage) => {
                // Handle redirects
                if (response.statusCode === 301 || response.statusCode === 302) {
                    const redirectUrl = response.headers.location;
                    if (redirectUrl) {
                        file.close();
                        fs.unlinkSync(filePath);
                        downloadFile(win, redirectUrl, filename).then(resolve);
                        return;
                    }
                }

                if (response.statusCode !== 200) {
                    file.close();
                    fs.unlinkSync(filePath);
                    resolve({ success: false, filePath: '', error: `HTTP ${response.statusCode}` });
                    return;
                }

                const totalSize = parseInt(response.headers['content-length'] || '0', 10);
                let downloadedSize = 0;

                response.on('data', (chunk) => {
                    downloadedSize += chunk.length;

                    // Report progress
                    if (win && totalSize > 0) {
                        const progress = Math.round((downloadedSize / totalSize) * 100);
                        win.webContents.send(IPC_CHANNELS.DOWNLOAD_PROGRESS, {
                            filename,
                            progress,
                            downloadedSize,
                            totalSize,
                        });
                    }
                });

                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    activeDownloads.delete(filename);

                    // Notify complete
                    if (win) {
                        win.webContents.send(IPC_CHANNELS.DOWNLOAD_COMPLETE, {
                            filename,
                            filePath,
                        });
                    }

                    resolve({ success: true, filePath });
                });
            };

            // Make the request using the appropriate protocol
            const request = url.startsWith('https')
                ? https.get(url, handleResponse)
                : http.get(url, handleResponse);

            request.on('error', (error) => {
                file.close();
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                activeDownloads.delete(filename);

                if (win) {
                    win.webContents.send(IPC_CHANNELS.DOWNLOAD_ERROR, {
                        filename,
                        error: error.message,
                    });
                }

                resolve({ success: false, filePath: '', error: error.message });
            });

            // Track for cancellation
            activeDownloads.set(filename, {
                abort: () => {
                    request.destroy();
                    file.close();
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
            });

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            resolve({ success: false, filePath: '', error: message });
        }
    });
}

/**
 * Register download IPC handlers
 */
export function registerDownloadHandlers() {
    ipcMain.handle(IPC_CHANNELS.DOWNLOAD_FILE, async (event, url: string, filename: string) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        return downloadFile(win, url, filename);
    });

    ipcMain.handle(IPC_CHANNELS.DOWNLOAD_CANCEL, async (_event, filename: string) => {
        const download = activeDownloads.get(filename);
        if (download) {
            download.abort();
            activeDownloads.delete(filename);
            return { success: true };
        }
        return { success: false };
    });
}
