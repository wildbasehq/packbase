import {t} from 'elysia'
import {YapockType} from '@/index'

export default (app: YapockType) => app
    .get('', () => {
        const {AUTH_AVAILABLE_USERNAMES, PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL, PROFILES_CDN_URL_PREFIX, MAINTENANCE, VOYAGE_CAPABILITIES} = process.env
        const availableUserDomains = AUTH_AVAILABLE_USERNAMES?.split(' ') || []
        const privacyPolicy = PRIVACY_POLICY_URL
        const termsOfService = TERMS_OF_SERVICE_URL
        const capabilities = VOYAGE_CAPABILITIES?.split(' ') || []

        const server: {
            bucketRoot: string;
            maintenance?: string;
            availableUserDomains: string[];
            capabilities?: string[];
            links?: {
                privacyPolicy?: string;
                termsOfService?: string;
            }
        } = {
            availableUserDomains,
            bucketRoot: PROFILES_CDN_URL_PREFIX,
            maintenance: typeof MAINTENANCE === 'string' ? MAINTENANCE : undefined
        }

        if (privacyPolicy) server.links = {...server.links, privacyPolicy}
        if (termsOfService) server.links = {...server.links, termsOfService}

        if (capabilities) server.capabilities = capabilities

        return server
    }, {
        detail: {
            description: 'Describes the server and its available user domains.',
            tags: ['Server']
        },
        response: {
            200: t.Object({
                bucketRoot: t.String(),
                maintenance: t.Optional(t.String()),
                availableUserDomains: t.Array(t.String()),
                capabilities: t.Optional(t.Array(t.String())),
                links: t.Optional(t.Object({
                    privacyPolicy: t.Optional(t.String()),
                    termsOfService: t.Optional(t.String()),
                }))
            })
        }
    })
