/**
 * IPC Registration
 * 
 * Central registration of all IPC handlers.
 */

export { IPC_CHANNELS } from './channels';
export { registerAuthHandlers } from './auth';
export { registerDownloadHandlers } from './download';
export { registerSystemHandlers } from './system';
export { registerTrayHandlers } from './tray';

import { registerAuthHandlers } from './auth';
import { registerDownloadHandlers } from './download';
import { registerSystemHandlers } from './system';
import { registerTrayHandlers } from './tray';

/**
 * Register all IPC handlers
 */
export function registerAllIPCHandlers() {
    registerAuthHandlers();
    registerDownloadHandlers();
    registerSystemHandlers();
    registerTrayHandlers();
}
