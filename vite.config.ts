import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import * as path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            '@/components': path.resolve(__dirname, './components'),
            '@/pages': path.resolve(__dirname, './pages'),
            '@/src': path.resolve(__dirname, './src'),
            '@/lib': path.resolve(__dirname, './lib'),
            '@/styles': path.resolve(__dirname, './styles'),
            '@/public': path.resolve(__dirname, './public'),
            '@/datasets': path.resolve(__dirname, './datasets'),
        },
    },
    plugins: [react(), tailwindcss()],
})
