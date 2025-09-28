import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import * as path from 'node:path'

export default defineConfig({
    resolve: {
        alias: {
            '@/components': path.resolve(__dirname, './src/components'),
            '@/pages': path.resolve(__dirname, './src/pages'),
            '@/src': path.resolve(__dirname, './src'),
            '@/lib': path.resolve(__dirname, './src/lib'),
            '@/audio': path.resolve(__dirname, './src/audio'),
            '@/styles': path.resolve(__dirname, './src/styles'),
            '@/public': path.resolve(__dirname, './public'),
            '@/datasets': path.resolve(__dirname, './datasets'),
            '@/types': path.resolve(__dirname, './src/types'),
        },
    },
    define: {
        'import.meta.env.CF_PAGES_COMMIT_SHA': `"${process.env.CF_PAGES_COMMIT_SHA}"` || '"synced"',
    },
    plugins: [react(), tailwindcss()],
    build: {
        target: 'esnext',
        minify: 'esbuild',
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // Don't manually split node_modules - let Vite handle it
                    if (id.includes('node_modules')) {
                        return 'vendor'
                    }

                    // Components
                    if (id.includes('/src/components/')) {
                        const componentPath = id.split('/src/components/')[1]
                        const mainDir = componentPath.split('/')[0]
                        return `component-${mainDir}`
                    }

                    // Source files
                    if (id.includes('/src/')) {
                        if (id.includes('/pages/')) {
                            const pagePath = id.split('/pages/')[1]
                            const pageSegment = pagePath.split('/')[0]
                            return `page-${pageSegment}`
                        }

                        if (id.includes('/fonts/')) return 'fonts'
                        if (id.includes('/images/')) return 'images'
                        if (id.includes('/styles/')) return 'styles'

                        // Main app files
                        if (id.match(/\/src\/[^/]+\.tsx$/)) {
                            return 'app'
                        }
                    }
                },

                chunkFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
                entryFileNames: 'assets/js/[name]-[hash].js',
            },
        },

        chunkSizeWarningLimit: 2000,
    },

    optimizeDeps: {
        include: ['react', 'react-dom', 'react/jsx-runtime'],
    },

    css: {
        modules: {
            generateScopedName: '[name]__[local]__[hash:base64:5]',
        },
    },
})
