/**
 * IPC Channel Constants
 * 
 * Defines all IPC channel names for type-safe communication.
 */

export const IPC_CHANNELS = {
    // Auth
    AUTH_STORE_TOKEN: 'auth:store-token',
    AUTH_GET_TOKEN: 'auth:get-token',
    AUTH_CLEAR_TOKEN: 'auth:clear-token',
    AUTH_SUCCESS: 'auth:success',  // Transition to main window after login
    AUTH_LOGOUT: 'auth:logout',    // Transition from main window to auth window on logout

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
    SPLASH_CHECK_AUTH: 'splash:check-auth',  // Check if user is authenticated
    SPLASH_COMPLETE: 'splash:complete',  // Transition from splash to next window

    // Tray
    TRAY_SET_STATUS: 'tray:set-status',
    TRAY_GET_STATUS: 'tray:get-status',
    TRAY_SHOW_NOTIFICATION: 'tray:show-notification',
    TRAY_SHOW_TICKET_NOTIFICATION: 'tray:show-ticket-notification',

    // Updates
    UPDATE_CHECK: 'update:check',
    UPDATE_INSTALL: 'update:install',
    UPDATE_STATUS: 'update:status',
    UPDATE_PROGRESS: 'update:progress',
    UPDATE_AVAILABLE: 'update:available',
    UPDATE_DOWNLOADED: 'update:downloaded',
    UPDATE_ERROR: 'update:error',
} as const;

export type IPCChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
