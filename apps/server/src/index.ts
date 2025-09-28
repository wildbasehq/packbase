// dirty replace json.stringify to support bigint
const ogStringify = JSON.stringify;
// @ts-ignore
JSON.stringify = (obj) =>
    ogStringify(obj, (key, value) => {
        if (typeof value === 'bigint') {
            return value.toString();
        }
        return value;
    });

import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import Debug from 'debug';
import verifyToken from '@/utils/verify-token';
import { swagger } from '@elysiajs/swagger';
import { autoload } from 'elysia-autoload';
import deleteNulls from '@/utils/delete-nulls';
import fs from 'node:fs/promises';
import posthog, { distinctId } from '@/utils/posthog';
// Trigger clerk connection
import './db/auth';
import './lib/rheo';
import { HTTPError } from '@/lib/HTTPError';
import clerkClient from './db/auth';
import prisma from '@/db/prisma';
import { randomUUID } from 'crypto';

const isCluster = process.argv.includes('--cluster');
const isBuildingSDK = process.argv.includes('--build-sdk');
const isTestingStartupTime = process.argv.includes('--close-on-success');

const log = !isTestingStartupTime
    ? {
          info: Debug('vg:init'),
          request: Debug('vg:request'),
          error: Debug('vg:init:error'),
      }
    : {
          info: () => {},
          request: () => {},
          error: () => {},
      };

log.info(`Server${isCluster ? ' (cluster)' : ''} \x1b[38;5;244mSTART\x1b[0m: Awake!!`);

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
    .resolve(async ({ request, query }): Promise<any> => {
        if (request.headers.get('authentication')) request.headers.set('Authorization', request.headers.get('authentication'));
        if (query.token) request.headers.set('Authorization', `Bearer ${query.token}`);
        request.headers.set('Authorization', request.headers.get('Authorization')?.replace('Bearer ', ''));

        const user = await verifyToken(request);

        async function logAudit({ action, model_id, model_type, model_object }: { action: string; model_id: string; model_type: string; model_object: any }) {
            // Attempt to write audit log, but never block the response on failure
            try {
                const userId: string = (user && (user.sub as string)) || '00000000-0000-0000-0000-000000000000';
                await prisma.admin_audit_log.create({
                    data: {
                        user_id: userId,
                        action,
                        model_type,
                        model_id,
                        model_object,
                    },
                });
            } catch (_) {
                // Swallow audit failures
            }
        }

        // Check admin routes
        const url = new URL(request.url);
        if (url.pathname.startsWith('/admin')) {
            const auditIfAdminSql = async (action: string, model_object: any) => {
                if (!url.pathname.startsWith('/admin/sql')) return;
                logAudit({
                    action,
                    model_id: 'unknown',
                    model_type: 'admin.sql',
                    model_object,
                });
            };

            // Get private metadata from Clerk
            if (user?.userId) {
                const privateMetadata = await clerkClient.users.getUser(user?.userId).then((user) => user.privateMetadata);
                if (privateMetadata?.type !== 'admin') {
                    await auditIfAdminSql('UNAUTHORIZED', { reason: 'Not admin' });
                    throw HTTPError.notFound({ summary: 'NOT_FOUND' });
                }
            } else {
                await auditIfAdminSql('UNAUTHENTICATED', { reason: 'No user' });
                throw HTTPError.notFound({ summary: 'NOT_FOUND' });
            }
        }

        // Well, the request is continuing, so we can log the audit
        if (!url.pathname.startsWith('/admin') && !url.pathname.startsWith('/server/fwupd')) {
            logAudit({
                action: 'REQUEST_OK',
                model_id: url.pathname,
                model_type: 'request',
                model_object: {
                    request: {
                        url: request.url, // Use request's URL for whole path incl domain
                        method: request.method,
                        body: request.body,
                    },
                },
            });
        }

        if (user?.sub) return { user, logAudit };
    })

    .onAfterHandle(({ response, request }) => {
        if (!request.url.includes('/docs')) {
            return deleteNulls(response);
        }
    })

    .onError(({ code, error, request }) => {
        console.log(code, error);
        // Ensure JSON response
        try {
            if (code === 'VALIDATION')
                return {
                    ...error.validator,
                };

            return new HTTPError(error as any).toJSON();
        } catch (_) {
            return error;
        }
    })
    // Load routes
    .use(
        await autoload({
            ...(isBuildingSDK
                ? {
                      types: {
                          output: './routes.ts',
                          typeName: 'Packbase',
                          useExport: true,
                      },
                  }
                : {}),
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
    // Health
    /**
     * {
     *               status?: string,
     *               message?: string,
     *               connections?: number,
     *               cpu?: number,
     *               memory?: number,
     *             }
     */
    .get('/health', async ({ response }) => {
        const health = {
            status: 'OK',
            message: 'Server is healthy',
            connections: process.env.CLUSTER_WORKERS ? process.env.CLUSTER_WORKERS : 1,
            cpu: process.cpuUsage().system / 1000000000,
            memory: process.memoryUsage().heapUsed / 1000000,
        };

        return health;
    })
    .listen(process.env.PORT || 8000, async () => {
        const startupMs = performance.now();

        if (isBuildingSDK) {
            log.info(`Server \x1b[32mOK\x1b[0m: Heading back to the SDK build process`);
            process.exit(0);
        } else if (isTestingStartupTime) {
            console.log(startupMs);
            process.exit(0);
        }

        posthog.capture({
            distinctId,
            event: 'Server Start',
            properties: {
                startup: startupMs,
                maintenance: process.env.MAINTENANCE,
            },
        });

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
                    log.info('Webhook called');
                })
                .catch((e) => {
                    log.error('Webhook failed', e);
                });
        }
    });

setTimeout(async () => {
    const initialMs = performance.now();
    const logStartup = () => {
        const startupMs = Math.round(performance.now() - initialMs);
        if (startupMs > 150) {
            log.info(
                `Server \x1b[31mSLOW\x1b[0m: Startup took ${startupMs}ms (true ${performance.now()}) (${Math.round(startupMs / 1000)}s${Math.round(startupMs / 1000) > 60 ? `, ${Math.round(startupMs / 1000 / 60)}m` : ''}), Listening on ${process.env.PORT || 8000}\nThis took too long! It will add up the more server instances you have.`,
            );
        } else {
            log.info(`Server \x1b[32mOK\x1b[0m: Startup took ${startupMs}ms (true ${Math.round(performance.now())}), Listening on ${process.env.PORT || 8000}`);
        }
    };
    // Run all files in order inside the migrate folder
    try {
        const modules = await fs.readdir(`${__dirname}/migrate`);
        for (const module of modules) {
            const index = modules.indexOf(module);
            if (module.endsWith('.ts')) {
                log.info(`Running migration ${module}`);
                const { default: func } = await import(`./migrate/${module}`);
                await func();

                if (index === modules.length - 1) {
                    logStartup();
                }
            }
        }
    } catch (e) {
        log.error('Error running migrations', e);
    }
}, 100);

// process.on('unhandledRejection', (reason, promise) => {
//     log.error('Unhandled Rejection at:', promise, 'reason:', reason)
//     // Application specific logging, throwing an error, or other logic here
// })

type YapockTypeDerivative = typeof Yapock;
declare module '@/index' {
    interface YapockType extends YapockTypeDerivative {}
}
