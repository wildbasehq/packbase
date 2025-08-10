import {PostHog} from 'posthog-node'

const client = new PostHog(
    process.env.POSTHOG_KEY || 'dummy',
    {host: 'https://us.i.posthog.com'}
)

export const distinctId = process.env.HEROKU_DYNO_ID || process.env.POSTHOG_DISTINCT_ID || 'voyage'

export default client