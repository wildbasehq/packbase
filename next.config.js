const iteration = require('child_process')
    .execSync('git rev-list --count HEAD')
    .toString()
    .trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    swcMinify: true,
    images: {
        domains: ['127.0.0.1', 'udxdytccktvaedirxooa.supabase.co', 'ecwxmakixjrsklydfmtl.supabase.co', 'cdn.discordapp.com', 'unavatar.io', 'localhost'],
    },
    env: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,

        NEXT_PUBLIC_ITERATION_COUNT: iteration,

        NEXT_PUBLIC_POSTHOG_KEY: process.env.POSTHOG_KEY,
        NEXT_PUBLIC_POSTHOG_HOST: process.env.POSTHOG_HOST,
    },
    webpack: (config) => {
        return config;
    },
    async rewrites() {
        return [
            {
                source: '/@:userId([a-zA-Z0-9]+)/:id*',
                destination: "/user/:userId/:id*",
            },
            {
                source: '/p/:packId([a-zA-Z0-9]+)/:id*',
                destination: "/pack/:packId/:id*",
            },
            {
                source: '/',
                destination: "/pack/universe",
            }
        ]
    }
};

module.exports = nextConfig;
