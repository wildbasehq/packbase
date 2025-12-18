import ThrowError from '@/utils/errors';
import sharp from 'sharp';
import {UserProfile} from '@/models/defs';
import {similarity} from '@/utils/similarity';
import {YapockType} from '@/index';
import {getUser, UserCache} from '@/routes/user/[username]';
import BannedUsernames from '@/tables/banned_usernames.json';
import {HTTPError} from '@/lib/HTTPError';
import prisma from '@/db/prisma';
import requiresToken from '@/utils/identity/requires-token';
import createStorage from '@/lib/storage';
import PackMan from "@/lib/packs/PackMan";
import {checkDefaultPackSetup} from "@/routes/packs/default";

export default (app: YapockType) =>
    app
        .get(
            '',
            async (res) => {
                const {set, user} = res;
                if (!user) {
                    set.status = 401;
                    throw HTTPError.unauthorized({
                        summary: 'You must be logged in to access this resource.',
                    });
                }

                let userProfile = await getUser({
                    by: 'id',
                    value: user.sub,
                });

                if (!userProfile) {
                    return {
                        id: user.sub,
                    };
                }

                const unlockedBadges = await prisma.inventory.findMany({
                    where: {
                        user_id: user.sub,
                        type: 'badge',
                    },
                    select: {
                        item_id: true,
                    },
                });

                userProfile.metadata = {
                    ...user.user_metadata,
                    ...user.app_metadata,
                    unlockables: unlockedBadges.map((badge) => badge.item_id),
                };

                // Default pack
                if (userProfile.default_pack && userProfile.default_pack !== '00000000-0000-0000-0000-000000000000') {
                    const defaultPackMan = await PackMan.init(userProfile.default_pack, user.sub)

                    if (!defaultPackMan) {
                        throw HTTPError.serverError({
                            summary: "Failed to load user's default pack.",
                        })
                    }

                    const defaultPack = defaultPackMan.getPack();

                    if (defaultPack) {
                        userProfile.default_pack = defaultPack
                        userProfile.default_pack.membership = defaultPackMan.getUserMembership();

                        if (userProfile.default_pack?.images_avatar) userProfile.default_pack.images = {
                            ...userProfile.default_pack.images,
                            avatar: userProfile.default_pack.images_avatar,
                        };

                        if (userProfile.default_pack?.images_header) userProfile.default_pack.images = {
                            ...userProfile.default_pack.images,
                            header: userProfile.default_pack.images_header,
                        };
                    }
                }

                const defaultPackSetup = await checkDefaultPackSetup(user.sub);

                return {
                    ...userProfile,
                    requires_setup: defaultPackSetup.requires_setup,
                    requires_switch: defaultPackSetup.requires_switch,
                };
            },
            {
                detail: {
                    description: 'Get the current user.',
                    tags: ['User'],
                },
            },
        )
        .post(
            '',
            async ({set, body, user}) => {
                requiresToken({set, user});

                return await updateUser(
                    {
                        ...(body as Update),
                        // @ts-ignore
                    },
                    set,
                    user,
                );
            },
            {
                detail: {
                    description: 'Update the current user.',
                    tags: ['User'],
                },
                body: UserProfile,
            },
        );

interface Update {
    username?: string;
    display_name?: string;
    slug?: string;
    about?: {
        bio?: string;
    };
    images?: {
        header?: string;
    };
    space_type?: 'default' | 'custom_free' | 'custom_unrestricted';
    post_privacy?: 'public' | 'followers' | 'friends' | 'private';
}

type NewProfile = Update & { bio?: string; id: string };

export async function updateUser({
                                     username,
                                     display_name,
                                     slug,
                                     space_type,
                                     post_privacy,
                                     about,
                                     images
                                 }: Update, set: any, currentUser: { sub: any }) {
    if (username) {
        for (const bannedUsername of BannedUsernames) {
            if (similarity(username, bannedUsername) > 0.8) {
                set.status = 403;
                throw HTTPError.forbidden({
                    summary: 'Username is banned!',
                });
            }
        }
    }

    if (
        about?.bio &&
        similarity(
            about.bio,
            'ごめんなさい、アマナイさん。私は今、あなたのことでさえ怒っていません。私は誰に対しても恨みを持ちません。ただ世界は今とてもとても素晴らしいと感じています。天と地を通して、私だけが光栄なです',
        ) > 0.65
    ) {
        set.status = 500;
        throw HTTPError.serverError({
            code: 'domain_expansion',
            summary: '🫸🔵🔴🫷 🤌 🫴🟣 💀💥 🟣🫷😎',
        });
    }

    const userProfile = await prisma.profiles.findUnique({
        where: {id: currentUser.sub},
    });

    let newProfile: Update & { bio?: string; id: string } = {
        id: currentUser.sub,
        username: username?.toLowerCase().trim(),
        slug: slug?.toLowerCase().trim(),
        bio: about?.bio,
        display_name,
        space_type,
        post_privacy,
    };

    // Remove undefined/null values
    Object.keys(newProfile).forEach((key: string) => {
        const typedKey = key as keyof NewProfile;
        if (newProfile[typedKey] === undefined) {
            delete newProfile[typedKey];
        }
    });

    try {
        if (!userProfile) {
            // This really shouldn't happen.
            // @TODO - remove this check and throw an error. Worried that this might occur somewhere outside of verifyToken.
            await prisma.profiles.create({
                // @ts-expect-error
                data: newProfile,
            });
        } else {
            await prisma.profiles.update({
                where: {id: currentUser.sub},
                data: newProfile,
            });
        }
    } catch (error) {
        set.status = 500;
        throw ThrowError({
            name: 'ServerlandCommErr',
            message: error.message,
        });
    }

    newProfile.images = {};

    if (images?.header) {
        const header = {
            b64: images.header.split(';base64,').pop() || '',
            ctype: images?.header.substring('data:'.length, images?.header.indexOf(';base64')),
            ext: images?.header.substring('data:image/'.length, images?.header.indexOf(';base64')),
        };

        const resized = await sharp(Buffer.from(header.b64, 'base64'), {
            animated: true,
        })
            // .resize(512, 512)
            // .toFormat('png')
            .toBuffer();

        // Create a storage instance
        const storage = createStorage(process.env.S3_PROFILES_BUCKET);

        // Convert the buffer to base64 for our storage class
        const base64Data = `data:${header.ctype};base64,${resized.toString('base64')}`;

        // Upload the image
        const headerUpload = await storage.uploadBase64Image(currentUser.sub, `0/header.${header.ext}`, base64Data, header.ext === 'gif');

        if (!headerUpload.success) {
            set.status = 500;
            throw ThrowError({
                name: 'ServerlandCommErr',
                message: headerUpload.error?.message || 'Failed to upload header image',
            });
        }

        newProfile.images.header = `${process.env.PROFILES_CDN_URL_PREFIX}/${headerUpload.path}?updated=${Date.now()}`;
    }

    try {
        await prisma.profiles.update({
            where: {id: currentUser.sub},
            data: {
                ...(newProfile.images.header && {
                    images_header: newProfile.images.header,
                }),
            },
        });
    } catch (error) {
        set.status = 500;
        throw ThrowError({
            name: 'ServerlandCommErr',
            message: error.message,
        });
    }

    UserCache.delete(currentUser.sub);

    return newProfile;
}
