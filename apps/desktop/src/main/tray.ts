/**
 * System Tray Module
 * 
 * Handles tray icon, context menu, status indicators, and notifications.
 */

import { Tray, Menu, nativeImage, Notification } from 'electron';
import { join } from 'path';
import * as fs from 'fs';

// Tray instance
let tray: Tray | null = null;

// Current status
type TrayStatus = 'online' | 'offline' | 'busy' | 'away';
let currentStatus: TrayStatus = 'online';

// Callbacks
let onShowWindow: (() => void) | null = null;
let onQuit: (() => void) | null = null;
let onStatusChange: ((status: TrayStatus) => void) | null = null;
let onNewTicket: (() => void) | null = null;
let onOpenSettings: (() => void) | null = null;
let onCheckForUpdates: (() => void) | null = null;

// Status labels
const STATUS_LABELS: Record<TrayStatus, string> = {
    online: '🟢 Online',
    offline: '⚫ Offline',
    busy: '🔴 Busy',
    away: '🟡 Away',
};

/**
 * Create tray icon from SVG or fallback to programmatic icon
 */
function createTrayIcon(): Electron.NativeImage {
    // Try to load SVG tray icon
    const svgPath = join(__dirname, '../../resources/tray-icon.svg');

    try {
        if (fs.existsSync(svgPath)) {
            const svgContent = fs.readFileSync(svgPath, 'utf-8');
            const icon = nativeImage.createFromDataURL(
                `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`
            );
            // Resize for tray (16x16 on Windows, 22x22 on macOS)
            const size = process.platform === 'darwin' ? 22 : 16;
            return icon.resize({ width: size, height: size });
        }
    } catch (error) {
        console.warn('Failed to load SVG tray icon, using fallback:', error);
    }

    // Fallback: Create a 16x16 blue headset-like icon programmatically
    const size = 16;
    const buffer = Buffer.alloc(size * size * 4);

    // Simple headset pattern
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            let isIcon = false;

            // Headband arc (top)
            if (y >= 2 && y <= 4) {
                const centerX = 8;
                const dist = Math.abs(x - centerX);
                if (dist >= 2 && dist <= 6 && y <= 2 + dist / 2) {
                    isIcon = true;
                }
            }

            // Left earpiece
            if (x >= 2 && x <= 4 && y >= 5 && y <= 10) {
                isIcon = true;
            }

            // Right earpiece
            if (x >= 11 && x <= 13 && y >= 5 && y <= 10) {
                isIcon = true;
            }

            // Microphone arm and mic
            if (y >= 10 && y <= 12 && x >= 4 && x <= 6) {
                isIcon = true;
            }
            if (y >= 11 && y <= 13 && x >= 6 && x <= 8) {
                isIcon = true;
            }

            if (isIcon) {
                buffer[i] = 59;      // R (blue #3B82F6)
                buffer[i + 1] = 130; // G
                buffer[i + 2] = 246; // B
                buffer[i + 3] = 255; // A
            } else {
                buffer[i] = 0;
                buffer[i + 1] = 0;
                buffer[i + 2] = 0;
                buffer[i + 3] = 0; // Transparent
            }
        }
    }

    return nativeImage.createFromBuffer(buffer, { width: size, height: size });
}

/**
 * Build the context menu
 */
function buildContextMenu(): Menu {
    return Menu.buildFromTemplate([
        {
            label: 'IT Helpdesk Pro',
            enabled: false,
            icon: createTrayIcon(),
        },
        { type: 'separator' },
        {
            label: 'Open Dashboard',
            click: () => onShowWindow?.(),
            accelerator: 'CmdOrCtrl+Shift+D',
        },
        {
            label: 'New Ticket',
            click: () => onNewTicket?.(),
            accelerator: 'CmdOrCtrl+Shift+N',
        },
        { type: 'separator' },
        {
            label: 'Status',
            submenu: [
                {
                    label: STATUS_LABELS.online,
                    type: 'radio',
                    checked: currentStatus === 'online',
                    click: () => setStatus('online'),
                },
                {
                    label: STATUS_LABELS.away,
                    type: 'radio',
                    checked: currentStatus === 'away',
                    click: () => setStatus('away'),
                },
                {
                    label: STATUS_LABELS.busy,
                    type: 'radio',
                    checked: currentStatus === 'busy',
                    click: () => setStatus('busy'),
                },
                {
                    label: STATUS_LABELS.offline,
                    type: 'radio',
                    checked: currentStatus === 'offline',
                    click: () => setStatus('offline'),
                },
            ],
        },
        { type: 'separator' },
        {
            label: 'Settings',
            click: () => onOpenSettings?.(),
        },
        {
            label: 'Check for Updates',
            click: () => onCheckForUpdates?.(),
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => onQuit?.(),
            accelerator: 'CmdOrCtrl+Q',
        },
    ]);
}

/**
 * Update tooltip with status
 */
function updateTooltip(): void {
    if (!tray) return;
    const statusText = STATUS_LABELS[currentStatus];
    tray.setToolTip(`IT Helpdesk Pro - ${statusText}`);
}

/**
 * Set the current status
 */
export function setStatus(status: TrayStatus): void {
    currentStatus = status;
    updateTooltip();

    // Rebuild menu to update radio selection
    if (tray) {
        tray.setContextMenu(buildContextMenu());
    }

    onStatusChange?.(status);
}

/**
 * Get current status
 */
export function getStatus(): TrayStatus {
    return currentStatus;
}

/**
 * Show a notification
 */
export function showNotification(title: string, body: string, onClick?: () => void): void {
    if (!Notification.isSupported()) {
        console.warn('Notifications not supported on this platform');
        return;
    }

    const notification = new Notification({
        title,
        body,
        icon: join(__dirname, '../../resources/icon.svg'),
        silent: false,
    });

    if (onClick) {
        notification.on('click', onClick);
    }

    notification.show();
}

/**
 * Show ticket notification
 */
export function showTicketNotification(ticketId: string, subject: string, priority: 'low' | 'medium' | 'high' | 'critical'): void {
    const priorityEmoji = {
        low: '🔵',
        medium: '🟡',
        high: '🟠',
        critical: '🔴',
    };

    showNotification(
        `${priorityEmoji[priority]} New Ticket: #${ticketId}`,
        subject,
        () => onShowWindow?.()
    );
}

/**
 * Initialize tray callbacks
 */
export interface TrayCallbacks {
    onShowWindow: () => void;
    onQuit: () => void;
    onStatusChange?: (status: TrayStatus) => void;
    onNewTicket?: () => void;
    onOpenSettings?: () => void;
    onCheckForUpdates?: () => void;
}

/**
 * Create the system tray
 */
export function createTray(callbacks: TrayCallbacks): Tray {
    if (tray) {
        return tray;
    }

    // Set callbacks
    onShowWindow = callbacks.onShowWindow;
    onQuit = callbacks.onQuit;
    onStatusChange = callbacks.onStatusChange || null;
    onNewTicket = callbacks.onNewTicket || null;
    onOpenSettings = callbacks.onOpenSettings || null;
    onCheckForUpdates = callbacks.onCheckForUpdates || null;

    // Create tray
    const icon = createTrayIcon();
    tray = new Tray(icon);

    // Set context menu
    tray.setContextMenu(buildContextMenu());
    updateTooltip();

    // Double-click to show window
    tray.on('double-click', () => {
        onShowWindow?.();
    });

    // Single click on Windows shows menu (default behavior)
    // On macOS, single click also shows the window
    if (process.platform === 'darwin') {
        tray.on('click', () => {
            onShowWindow?.();
        });
    }

    return tray;
}

/**
 * Destroy the tray
 */
export function destroyTray(): void {
    if (tray) {
        tray.destroy();
        tray = null;
    }
}

/**
 * Check if tray exists
 */
export function hasTray(): boolean {
    return tray !== null;
}
