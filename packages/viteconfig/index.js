import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import * as path from 'node:path'
import {sentryVitePlugin} from "@sentry/vite-plugin";

// Deterministically bucket node_modules into N chunks.
// Hashing by package name (not full file path) keeps output stable while staying fairly even.
const VENDOR_CHUNK_COUNT = 4

function normalizeModuleId(id) {
    // Rollup sometimes prefixes virtual modules with \0.
    return typeof id === 'string' ? id.replace(/^\\0+/, '') : ''
}

function extractPackageNameFromId(rawId) {
    const id = normalizeModuleId(rawId)

    // Handle pnpm layout:
    //   .../node_modules/.pnpm/<name>@<ver>/node_modules/<name>/...
    //   .../node_modules/.pnpm/@scope+name@<ver>/node_modules/@scope/name/...
    const pnpmMarker = '/node_modules/.pnpm/'
    const pnpmIdx = id.indexOf(pnpmMarker)
    if (pnpmIdx !== -1) {
        const after = id.slice(pnpmIdx + pnpmMarker.length)
        const nmIdx = after.indexOf('/node_modules/')
        if (nmIdx !== -1) {
            const pkgPath = after.slice(nmIdx + '/node_modules/'.length)
            const parts = pkgPath.split('/')
            if (parts[0]?.startsWith('@')) return `${parts[0]}/${parts[1]}`
            return parts[0]
        }
    }

    // Standard npm/yarn layout:
    //   .../node_modules/<name>/...
    //   .../node_modules/@scope/name/...
    const nm = '/node_modules/'
    const idx = id.lastIndexOf(nm)
    if (idx === -1) return null

    const pkgPath = id.slice(idx + nm.length)
    const parts = pkgPath.split('/')
    if (!parts[0]) return null
    if (parts[0].startsWith('@')) return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : null
    return parts[0]
}

function fnv1a32(str) {
    // Simple, fast, deterministic 32-bit hash.
    let h = 0x811c9dc5
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i)
        // h *= 16777619 (using shifts to stay 32-bit)
        h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
    }
    return h >>> 0
}

function vendorBucketForPackage(pkgName) {
    const bucket = fnv1a32(pkgName) % VENDOR_CHUNK_COUNT
    return `vendor-${bucket}`
}


export default function viteConfig(sourceDir) {
    return defineConfig({
        server: {
            port: parseInt(process.env.PORT || '5173'),
            strictPort: false
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
            sourcemap: true,
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        const normalizedId = normalizeModuleId(id)

                        // Vendor chunking: split all node_modules into 4 stable buckets.
                        if (normalizedId.includes('node_modules')) {
                            const pkgName = extractPackageNameFromId(normalizedId)
                            if (pkgName) return vendorBucketForPackage(pkgName)
                            // Fallback if we can’t parse a package name.
                            return 'vendor-0'
                        }

                        // Components
                        if (normalizedId.includes('/src/components/')) {
                            const componentPath = normalizedId.split('/src/components/')[1]
                            const mainDir = componentPath.split('/')[0]
                            return `component-${mainDir}`
                        }

                        // Source files
                        if (normalizedId.includes('/src/')) {
                            if (normalizedId.includes('/pages/')) {
                                const pagePath = normalizedId.split('/pages/')[1]
                                const pageSegment = pagePath.split('/')[0]
                                return `page-${pageSegment}`
                            }

                            if (normalizedId.includes('/fonts/')) return 'fonts'
                            if (normalizedId.includes('/images/')) return 'images'
                            if (normalizedId.includes('/styles/')) return 'styles'

                            // Main app files
                            if (normalizedId.match(/\/src\/[^/]+\.tsx$/)) {
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
