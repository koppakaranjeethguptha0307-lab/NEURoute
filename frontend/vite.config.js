import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3000,
        open: false,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                secure: false,
                configure: function (proxy) {
                    proxy.on('error', function (err, _req, res) {
                        if (res && !res.headersSent) {
                            res.writeHead(503, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Backend server offline', code: 'BACKEND_OFFLINE' }));
                        }
                    });
                },
            },
        },
    },
});
