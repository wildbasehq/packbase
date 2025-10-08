import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import * as path from 'node:path'

export default function viteConfig(sourceDir) {
    return defineConfig({
        server: {
            port: parseInt(process.env.PORT || '5173'),
            strictPort: true
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
            },
        },
        define: {
            'import.meta.env.CF_PAGES_COMMIT_SHA': `"${process.env.CF_PAGES_COMMIT_SHA}"` || '"synced"',
        },
        // @ts-ignore
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
}
