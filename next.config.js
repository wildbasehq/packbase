const {resolve} = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    swcMinify: true,
    images: {
        domains: ['ecwxmakixjrsklydfmtl.supabase.co', 'cdn.discordapp.com', 'unavatar.io', 'localhost'],
    },
    env: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,

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
            }
        ]
    }
};

module.exports = nextConfig;
