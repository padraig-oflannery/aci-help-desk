import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rendererDir = path.join(__dirname, 'src/renderer');

export default defineConfig({
    plugins: [
        react(),
        electron({
            main: {
                // Main process entry (relative to project root, not renderer root)
                entry: path.join(__dirname, 'src/main/index.ts'),
                vite: {
                    build: {
                        outDir: path.join(__dirname, 'dist-electron/main'),
                        lib: {
                            entry: path.join(__dirname, 'src/main/index.ts'),
                            formats: ['cjs'],
                            fileName: () => 'index.cjs',
                        },
                        rollupOptions: {
                            external: ['electron', 'electron-updater'],
                        },
                    },
                    define: {
                        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
                    },
                },
            },
            preload: {
                // Preload script (relative to project root, not renderer root)
                input: path.join(__dirname, 'src/preload/index.ts'),
                vite: {
                    build: {
                        outDir: path.join(__dirname, 'dist-electron/preload'),
                        lib: {
                            entry: path.join(__dirname, 'src/preload/index.ts'),
                            formats: ['cjs'],
                            fileName: () => 'index.cjs',
                        },
                        rollupOptions: {
                            external: ['electron'],
                        },
                    },
                },
            },
            renderer: {},
        }),
    ],
    resolve: {
        alias: {
            '@': path.join(rendererDir, 'src'),
        },
    },
    // Set root to renderer directory where index.html is located
    root: rendererDir,
    base: './',
    publicDir: path.join(rendererDir, 'public'),
    build: {
        outDir: path.join(__dirname, 'dist'),
        emptyOutDir: true,
    },
});
