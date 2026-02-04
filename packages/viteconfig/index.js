import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import * as path from 'node:path'
import {sentryVitePlugin} from "@sentry/vite-plugin";


export default function viteConfig(sourceDir) {
    return defineConfig({
        server: {
            host: true,
            port: parseInt(process.env.PORT || '5173'),
            strictPort: false,
            hmr: {
                protocol: process.env.HMR_PROTOCOL || 'ws', // ws or wss
                host: process.env.HMR_HOST || undefined // Optional: override host via env; default lets Vite auto-detect
            }
        },
        resolve: {
            alias: {
                '@/components': path.resolve(sourceDir, './src/components'),
                '@/pages': path.resolve(sourceDir, './src/pages'),
                '@/src': path.resolve(sourceDir, './src'),
                '@/lib': path.resolve(sourceDir, './src/lib'),
                '@/audio': path.resolve(sourceDir, './src/audio'),
                '@/styles': path.resolve(sourceDir, './src/styles'),
                '@/public': path.resolve(sourceDir, './public'),
                '@/datasets': path.resolve(sourceDir, './datasets'),
                '@/types': path.resolve(sourceDir, './src/types'),
                '@/routes': path.resolve(sourceDir, './src/routes')
            },
        },
        define: {
            'import.meta.env.CF_COMMIT_SHA': `"${process.env.CF_COMMIT_SHA}"` || '"synced"',
        },
        // @ts-ignore
        plugins: [
            react(),
            tailwindcss(),
            sentryVitePlugin({
                authToken: process.env.SENTRY_AUTH_TOKEN,
                org: "yipnyap",
                project: "packbase-browser",
            })
        ],
        build: {
            target: 'esnext',
            minify: 'esbuild',
            sourcemap: false,
            rollupOptions: {
                output: {
                    advancedChunks: {
                        groups: [{name: 'vendor', test: /\/react(?:-dom)?/}]
                    },

                    chunkFileNames: 'assets/js/[name]-[hash].js',
                    assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
                    entryFileNames: 'assets/js/[name]-[hash].js',
                },
            },

            chunkSizeWarningLimit: 2000,
        },

        optimizeDeps: {
            include: [
                'react',
                'react-dom',
                'react/jsx-runtime',
                'react-dom/client',
                'scheduler'
            ],
            exclude: ['@sentry/vite-plugin', '.bun', '.vite']
        },

        css: {
            modules: {
                generateScopedName: '[name]__[local]__[hash:base64:5]',
            },
        },
    })
}
