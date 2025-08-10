import {t} from 'elysia'
import {YapockType} from '@/index'

export default (app: YapockType) => app
    .get('', async ({set, query}) => {
        try {
            let html = await (await fetch(process.env.VOYAGE_FWUPD_UI_CHECK_URL, {
                cache: 'no-cache'
            })).text()

            // Example: <meta content="abcdef" name="commit-sha"/> would return "abcdef"
            const match = html.match(/<meta content="([^"]+)" name="commit-sha"/)

            if (!match) {
                set.status = 404
                return {error: 'Commit SHA meta tag not found'}
            }

            // if ?c=<SHA>, compare.
            let response: {
                s: string // SHA
                u?: 0 | 1 // Update?
            } = {
                s: match[1]
            }

            if (query?.c) {
                if (query.c !== match[1]) {
                    response.u = 1
                }
            }

            return response
        } catch (error) {
            set.status = 500
            return {error: 'Failed to fetch firmware version'}
        }
    }, {
        detail: {
            description: 'Get firmware version statuses about this Voyage.',
            tags: ['Server']
        },
        response: {
            200: t.Object({}, {
                additionalProperties: true
            })
        }
    })
