// dirty replace json.stringify to support bigint
const ogStringify = JSON.stringify
// @ts-ignore
JSON.stringify = (obj) =>
    ogStringify(obj, (key, value) => {
        if (typeof value === 'bigint') {
            return value.toString()
        }
        return value
    })
import prisma from '@/db/prisma'
import {HTTPError} from '@/lib/http-error'
import {Inchat} from '@/lib/inchat'
import deleteNulls from '@/utils/delete-nulls'
import verifyToken from '@/utils/identity/verify-token'
import {cors} from '@elysiajs/cors'
import {swagger} from '@elysiajs/swagger'
import Debug from 'debug'
import {Elysia} from 'elysia'
import {autoload} from 'elysia-autoload'
import fs from 'node:fs/promises'

const log = {
    info: Debug('vg:init'),
    request: Debug('vg:request'),
    error: Debug('vg:init:error'),
}

log.info(`Server Awake!!`)

declare global {
    interface UserPrivateMetadata {
        unlockables?: string[];
        invited?: number;
    }
}

const Yapock = new Elysia({})
    .use(
        cors({
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'authentication', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
            credentials: true,
            maxAge: 86400,
        }),
    )
    .resolve(async ({request, query}): Promise<any> => {
        if (process.env.MAINTENANCE) {
            return {}
        }

        // This is so stupid.
        // Old Voyage SDK uses authentication, not authorization.
        if (request.headers.get('authentication')) request.headers.set('Authorization', request.headers.get('authentication'))
        if (query.token) request.headers.set('Authorization', `Bearer ${query.token}`)

        // Strip "Bearer " prefix if present, but don't set header if it doesn't exist
        // (allows Clerk to fall back to reading __session cookie)
        const authHeader = request.headers.get('Authorization')
        if (authHeader) {
            request.headers.set('Authorization', authHeader.replace('Bearer ', ''))
        }

        const user = await verifyToken(request)

        async function auditLog({action, model_id, model_type, model_object}: {
            action: string;
            model_id: string;
            model_type: string;
            model_object: any
        }) {
            // Attempt to write audit log, but never block the response on failure
            try {
                const userId: string = (user && (user.sub as string)) || '00000000-0000-0000-0000-000000000000'
                await Inchat.processAuditLog({user, action, model_type, model_id, model_object})
                return await prisma.admin_audit_log.create({
                    data: {
                        user_id: userId,
                        action,
                        model_type,
                        model_id,
                        model_object,
                    },
                })
            } catch (_) {
                // Swallow audit failures
            }
        }

        if (user?.sub) {
            // set their last_online
            await prisma.profiles.update({
                where: {
                    id: user?.sub,
                },
                data: {
                    last_online: new Date()
                }
            })
            return {user, auditLog}
        }
    })

    .onAfterHandle(({response, request}) => {
        if (!request.url.includes('/docs')) {
            return deleteNulls(response)
        }
    })

    .onError(({code, error}) => {
        console.log(code, error)
        // Ensure JSON response
        try {
            if (code === 'VALIDATION')
                return {
                    ...error.validator,
                }

            return new HTTPError(error as any).toJSON()
        } catch (_) {
            return error
        }
    })
    // Load routes
    .use(
        await autoload({
            dir: `${__dirname}/routes`,
        }),
    )
    .use(
        swagger({
            path: '/docs',
            excludeStaticFile: false,
            documentation: {
                info: {
                    title: 'Voyage Documentation',
                    version: '0.0.0',
                },
            },
        }),
    )

Yapock.listen(process.env.PORT || 8000, async () => {
    const startupMs = performance.now()

    if (process.env.WEBHOOK_URL) {
        // Call webhook with message
        fetch(process.env.WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'startup',
                startup: performance.now(),
                maintenance: process.env.MAINTENANCE,
            }),
        })
            .then(() => {
                log.info('Webhook called')
            })
            .catch((e) => {
                log.error('Webhook failed', e)
            })
    }

    log.info(`Server Startup took ${startupMs}ms (true ${Math.round(performance.now())}), Listening on ${process.env.PORT || 8000}`)

    // Run all files in order inside the migrate folder
    try {
        const modules = await fs.readdir(`${__dirname}/migrate`)
        for (const module of modules) {
            const index = modules.indexOf(module)
            if (module.endsWith('.ts')) {
                log.info(`Running migration ${module}`)
                const {default: func} = await import(`${__dirname}/migrate/${module}`)
                await func()

                if (index === modules.length - 1) {
                    log.info('Finished running migrations')

                    setTimeout(() => {
                        console.log('Startup heap:', Math.round(process.memoryUsage().heapUsed / 1024 / 1024), 'MB')
                    }, 5000)
                }
            }
        }
    } catch (e) {
        log.error('Error running migrations', e)
    }
})

type YapockTypeDerivative = typeof Yapock;
declare module '@/index' {
    interface YapockType extends YapockTypeDerivative {
    }
}
