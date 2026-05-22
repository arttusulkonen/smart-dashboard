import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        legacy({
            targets: ['iOS >= 9'],
            polyfills: ['es.promise', 'es.object.assign', 'es.array.iterator']
        })
    ],
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                settings: resolve(__dirname, 'settings.html'),
                login: resolve(__dirname, 'login.html')
            }
        }
    }
});