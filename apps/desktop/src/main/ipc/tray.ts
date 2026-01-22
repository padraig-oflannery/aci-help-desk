/**
 * Tray IPC Handlers
 * 
 * Handles IPC communication for tray functionality.
 */

import { ipcMain } from 'electron';
import { IPC_CHANNELS } from './channels';
import { setStatus, getStatus, showNotification, showTicketNotification } from '../tray';

export function registerTrayHandlers(): void {
    // Set tray status
    ipcMain.handle(IPC_CHANNELS.TRAY_SET_STATUS, async (_event, status: 'online' | 'offline' | 'busy' | 'away') => {
        setStatus(status);
        return { success: true };
    });

    // Get tray status
    ipcMain.handle(IPC_CHANNELS.TRAY_GET_STATUS, async () => {
        return { status: getStatus() };
    });

    // Show notification
    ipcMain.handle(IPC_CHANNELS.TRAY_SHOW_NOTIFICATION, async (_event, title: string, body: string) => {
        showNotification(title, body);
        return { success: true };
    });

    // Show ticket notification
    ipcMain.handle(IPC_CHANNELS.TRAY_SHOW_TICKET_NOTIFICATION, async (
        _event,
        ticketId: string,
        subject: string,
        priority: 'low' | 'medium' | 'high' | 'critical'
    ) => {
        showTicketNotification(ticketId, subject, priority);
        return { success: true };
    });
}
