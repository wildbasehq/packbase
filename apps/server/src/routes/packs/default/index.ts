import {YapockType} from "@/index";
import requiresToken from "@/utils/identity/requires-token";
import {t} from "elysia";
import {HTTPError} from "@/lib/HTTPError";

export default (app: YapockType) =>
    app.get(
        '',
        async ({set, user}) => {
            requiresToken({set, user});

            const profile = await prisma.profiles.findFirst({
                where: {
                    id: user.sub
                },
                select: {
                    id: true,
                    default_pack: true
                }
            })

            const hasPostsInUniverse = await prisma.posts.findFirst({
                where: {
                    user_id: user.sub,
                    tenant_id: '00000000-0000-0000-0000-000000000000'
                },
                select: {
                    id: true,
                    user_id: true,
                    tenant_id: true
                }
            });

            const requires_switch = !!hasPostsInUniverse;

            return {
                id: profile.default_pack,
                requires_switch
            }
        }
    )
        .patch(
            '',
            async ({set, user, body}) => {
                requiresToken({set, user});
                const {pack_id} = body;

                const hasUniversePosts = await prisma.posts.findFirst({
                    where: {
                        user_id: user.sub,
                        tenant_id: '00000000-0000-0000-0000-000000000000'
                    },
                    select: {
                        id: true,
                        user_id: true,
                        tenant_id: true
                    }
                });

                if (hasUniversePosts) {
                    const targetPack = await prisma.packs.findUnique({
                        where: {id: pack_id},
                        select: {
                            id: true,
                            owner_id: true
                        }
                    });

                    if (!targetPack) {
                        set.status = 404;
                        throw HTTPError.notFound({summary: "Pack not found."});
                    }

                    if (targetPack.owner_id !== user.sub) {
                        set.status = 403;
                        throw HTTPError.forbidden({summary: "You do not have permission to switch to this pack."});
                    }

                    // Switch universe posts to the new pack
                    await prisma.posts.updateMany({
                        where: {
                            user_id: user.sub,
                            tenant_id: '00000000-0000-0000-0000-000000000000'
                        },
                        data: {
                            tenant_id: pack_id
                        }
                    });
                }

                await prisma.profiles.update({
                    where: {id: user.sub},
                    data: {default_pack: pack_id}
                });

                return {}
            },
            {
                body: t.Object({
                    pack_id: t.String()
                })
            }
        )