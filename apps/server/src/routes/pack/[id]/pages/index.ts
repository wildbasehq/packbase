import {YapockType} from '@/index'
import {PackPageCreateBody, PackPageEditBody, PackPageReorderBody} from '@/models/defs'
import {HTTPError} from '@/lib/HTTPError'
import prisma from '@/db/prisma'
import {PackCache} from '../index'
import requiresToken from '@/utils/identity/requires-token'
import PackMan from '@/lib/packs/PackMan'

export default (app: YapockType) =>
    app.group('', (app) =>
        app
            // Get all pages for a pack
            .get(
                '',
                async ({params: {id}}) => {
                    const pages = await prisma.packs_pages.findMany({
                        where: {tenant_id: id},
                        orderBy: {order: 'asc'},
                    })

                    if (!pages) {
                        return []
                    }

                    return pages.map((page) => ({
                        ...page,
                        created_at: page.created_at.toString(),
                        updated_at: page.updated_at.toString(),
                    }))
                },
                {
                    detail: {
                        description: 'Get all pages for a pack',
                        tags: ['Pack Pages'],
                    },
                },
            )

            // Create a new page
            .post(
                '',
                async ({params: {id}, set, user, body}: any) => {
                    requiresToken({set, user})
                    if (!(await PackMan.hasPermission(user.sub, id, PackMan.PERMISSIONS.ManagePack))) return HTTPError.forbidden({
                        summary: 'Missing permission'
                    })

                    // Check if the pack exists
                    const packExists = await prisma.packs.findUnique({
                        where: {id},
                    })

                    if (!packExists) {
                        throw HTTPError.notFound({
                            summary: 'Pack not found',
                        })
                    }

                    body.slug = body.slug.toLowerCase().replaceAll(' ', '-')

                    // Check if a page with the same slug already exists in this pack
                    const existingPage = await prisma.packs_pages.findFirst({
                        where: {
                            tenant_id: id,
                            slug: body.slug,
                        },
                    })

                    if (existingPage) {
                        throw HTTPError.conflict({
                            summary: 'A page with this slug already exists in this pack',
                        })
                    }

                    // Get the highest order value to place the new page at the end
                    const highestOrder = await prisma.packs_pages.findFirst({
                        where: {tenant_id: id},
                        orderBy: {order: 'desc'},
                    })

                    const order = body.order !== undefined ? body.order : highestOrder ? highestOrder.order + 1 : 0

                    // Create the new page
                    const newPage = await prisma.packs_pages.create({
                        data: {
                            tenant_id: id,
                            title: body.slug,
                            slug: body.slug,
                            order,
                        },
                    })

                    // Invalidate pack cache
                    PackCache.delete(id)

                    return {
                        ...newPage,
                        id: newPage.id.toString(),
                        created_at: newPage.created_at.toString(),
                        updated_at: newPage.updated_at.toString(),
                    }
                },
                {
                    body: PackPageCreateBody,
                    detail: {
                        description: 'Create a new page for a pack',
                        tags: ['Pack Pages'],
                    },
                },
            )

            // Get a specific page
            .get(
                '/:pageId',
                async ({params: {id, pageId}}) => {
                    const page = await prisma.packs_pages.findFirst({
                        where: {
                            tenant_id: id,
                            id: pageId,
                        },
                    })

                    if (!page) {
                        throw HTTPError.notFound({
                            summary: 'Page not found',
                        })
                    }

                    return {
                        ...page,
                        created_at: page.created_at.toString(),
                        updated_at: page.updated_at.toString(),
                    }
                },
                {
                    detail: {
                        description: 'Get a specific page from a pack',
                        tags: ['Pack Pages'],
                    },
                },
            )

            // Update a page
            .put(
                '/:pageId',
                async ({params: {id, pageId}, set, user, body}: any) => {
                    requiresToken({set, user})
                    if (!(await PackMan.hasPermission(user.sub, id, PackMan.PERMISSIONS.ManagePack))) return HTTPError.forbidden({
                        summary: 'Missing permission'
                    })

                    // Check if the page exists
                    const existingPage = await prisma.packs_pages.findFirst({
                        where: {
                            tenant_id: id,
                            id: pageId,
                        },
                    })

                    if (!existingPage) {
                        throw HTTPError.notFound({
                            summary: 'Page not found',
                        })
                    }

                    // If slug is being changed, check if it's unique
                    if (body.slug && body.slug !== existingPage.slug) {
                        const slugExists = await prisma.packs_pages.findFirst({
                            where: {
                                tenant_id: id,
                                slug: body.slug,
                                id: {not: pageId},
                            },
                        })

                        if (slugExists) {
                            throw HTTPError.conflict({
                                summary: 'A page with this slug already exists in this pack',
                            })
                        }
                    }

                    // Update the page
                    const updatedPage = await prisma.packs_pages.update({
                        where: {
                            id: pageId,
                        },
                        data: {
                            title: body.title !== undefined ? body.title : undefined,
                            slug: body.slug !== undefined ? body.slug : undefined,
                            description: body.description !== undefined ? body.description : undefined,
                            icon: body.icon !== undefined ? body.icon : undefined,
                            ticker: body.ticker !== undefined ? body.ticker : undefined,
                            query: body.query !== undefined ? body.query : undefined,
                            order: body.order !== undefined ? body.order : undefined,
                            updated_at: new Date(),
                        },
                    })

                    // Invalidate pack cache
                    PackCache.delete(id)

                    return {
                        ...updatedPage,
                        created_at: updatedPage.created_at.toString(),
                        updated_at: updatedPage.updated_at.toString(),
                    }
                },
                {
                    body: PackPageEditBody,
                    detail: {
                        description: 'Update a page in a pack',
                        tags: ['Pack Pages'],
                    },
                },
            )

            // Delete a page
            .delete(
                '/:pageId',
                async ({params: {id, pageId}, set, user}: any) => {
                    requiresToken({set, user})
                    if (!(await PackMan.hasPermission(user.sub, id, PackMan.PERMISSIONS.ManagePack))) return HTTPError.forbidden({
                        summary: 'Missing permission'
                    })

                    // Check if the page exists
                    const existingPage = await prisma.packs_pages.findFirst({
                        where: {
                            tenant_id: id,
                            id: pageId,
                        },
                    })

                    if (!existingPage) {
                        throw HTTPError.notFound({
                            summary: 'Page not found',
                        })
                    }

                    // Delete the page
                    await prisma.packs_pages.delete({
                        where: {
                            id: pageId,
                        },
                    })

                    // Invalidate pack cache
                    PackCache.delete(id)

                    return {success: true}
                },
                {
                    detail: {
                        description: 'Delete a page from a pack',
                        tags: ['Pack Pages'],
                    },
                },
            )

            // Reorder pages
            .post(
                '/reorder',
                async ({params: {id}, set, user, body}: any) => {
                    requiresToken({set, user})
                    if (!(await PackMan.hasPermission(user.sub, id, PackMan.PERMISSIONS.ManagePack))) return HTTPError.forbidden({
                        summary: 'Missing permission'
                    })

                    // Check if the page exists
                    const existingPage = await prisma.packs_pages.findFirst({
                        where: {
                            tenant_id: id,
                            id: body.pageId,
                        },
                    })

                    if (!existingPage) {
                        throw HTTPError.notFound({
                            summary: 'Page not found',
                        })
                    }

                    // Get all pages for this pack
                    const pages = await prisma.packs_pages.findMany({
                        where: {tenant_id: id},
                        orderBy: {order: 'asc'},
                    })

                    // Remove the page being moved
                    const filteredPages = pages.filter((page) => page.id !== body.pageId)

                    // Insert the page at the new position
                    filteredPages.splice(body.newOrder, 0, existingPage)

                    // Update the order of all pages
                    for (let i = 0; i < filteredPages.length; i++) {
                        await prisma.packs_pages.update({
                            where: {id: filteredPages[i].id},
                            data: {order: i},
                        })
                    }

                    // Invalidate pack cache
                    PackCache.delete(id)

                    return {success: true}
                },
                {
                    body: PackPageReorderBody,
                    detail: {
                        description: 'Reorder pages in a pack',
                        tags: ['Pack Pages'],
                    },
                },
            ),
    );
