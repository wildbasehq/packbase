const utwm = require('unplugin-tailwindcss-mangle/webpack')

/** @type {import('next').NextConfig} */
const nextConfig = {
    /**
     * PLEASE REMOVE ME WHEN THIS CLOSES PLEASE GOD PLEASEEE UGHHH PLEASE DADDY PLEASE
     * https://github.com/elysiajs/eden/issues/168
     */
    eslint: {
        // !! WARN !!
        // This allows production builds to successfully complete even if
        // your project has ESLint errors.
        // !! WARN !!
        ignoreDuringBuilds: true,
    },
    typescript: {
        // !! WARN !!
        // Dangerously allow production builds to successfully complete even if
        // your project has type errors.
        // !! WARN !!
        ignoreBuildErrors: true,
    },
    reactStrictMode: false,
    swcMinify: true,
    images: {
        domains: ['127.0.0.1', 'udxdytccktvaedirxooa.supabase.co', 'ecwxmakixjrsklydfmtl.supabase.co', 'cdn.discordapp.com', 'unavatar.io', 'localhost'],
    },
    env: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,

        NEXT_PUBLIC_POSTHOG_KEY: process.env.POSTHOG_KEY,
        NEXT_PUBLIC_POSTHOG_HOST: process.env.POSTHOG_HOST,
    },
    webpack: (config) => {
        if (process.env.NODE_ENV === 'production') {
            config.plugins.push(utwm())
        }

        return config
    },
    async rewrites() {
        return [
            {
                source: '/@:userId([a-zA-Z0-9]+)/:id*',
                destination: '/user/:userId/:id*',
            },
            {
                source: '/p/:packId([a-zA-Z0-9]+)/:id*',
                destination: '/pack/:packId/:id*',
            },
            {
                source: '/',
                destination: '/pack/universe',
            },
        ]
    },
}

module.exports = nextConfig
