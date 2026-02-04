import {t} from 'elysia'
import emojiRegex from 'emoji-regex'

export const UserProfile = t.Object(
    {
        id: t.Optional(t.String()),
        type: t.Optional(t.String()),
        username: t.Optional(
            t.String({
                minLength: 2,
                maxLength: 40,
                pattern: '^(?=.{2,40}$)(?![_-])(?!.*[_-]{2})(?!.*[_-]$)[A-Za-z0-9_-]+$',
            }),
        ),
        display_name: t.Optional(
            t.String({
                maxLength: 20,
            }),
        ),
        badge: t.Optional(t.String()),
        xp: t.Optional(t.Number()),
        about: t.Optional(
            t.Partial(
                t.Object({
                    bio: t.String({
                        maxLength: 256,
                    }),
                    flair: t.String({
                        maxLength: 12,
                    }),
                }),
            ),
        ),
        space_type: t.Optional(t.Union([t.Literal('default'), t.Literal('custom_free'), t.Literal('custom_unrestricted')])),
        post_privacy: t.Optional(t.Union([t.Literal('everyone'), t.Literal('followers'), t.Literal('friends'), t.Literal('private')])),
        images: t.Optional(
            t.Object({
                avatar: t.Optional(t.Any()),
                header: t.Optional(t.Any()),
            }),
        ),
        following: t.Optional(t.Boolean()),
        invite_code: t.Optional(
            t.String({
                minLength: 24,
                maxLength: 37,
            }),
        ),
    },
    {
        additionalProperties: true,
    },
)

export const UserProfileWithInviteCode = t.Intersect([
    UserProfile,
    t.Object({
        invite_code: t.Optional(
            t.String({
                minLength: 6,
                maxLength: 6,
            }),
        ),
    }),
])

export const UserProfileStatus = t.Object({
    ...UserProfile.props,
    status: t.Optional(
        t.Union([
            t.Literal('online'), // 0x01
            t.Literal('offline'), //0x00
            t.Literal('away'), // 0x02
            t.Literal('busy'), // 0x03
            t.Object({
                // 0x10
                emoji: t.String({
                    pattern: emojiRegex().source,
                    maxLength: 3,
                }),
                msg: t.String({
                    maxString: 12,
                }),
            }),
        ]),
    ),
})

export const PackCreateBody = t.Object({
    display_name: t.String({
        maxLength: 24,
    }),
    slug: t.String({
        minLength: 2,
        maxLength: 20,
        pattern: '^(?=.{2,40}$)(?![_-])(?!.*[_-]{2})[a-z0-9]+(?:[_-][a-z0-9]+)*$',
    }),
    description: t.String({
        maxLength: 256,
    }),
})

export const PackEditBody = t.Object({
    slug: t.Optional(
        t.String({
            default: '',
            minLength: 2,
            maxLength: 20,
            pattern: '^(?=.{2,40}$)(?![_-])(?!.*[_-]{2})[a-z0-9]+(?:[_-][a-z0-9]+)*$',
        }),
    ),
    display_name: t.Optional(
        t.String({
            maxLength: 24,
        }),
    ),
    about: t.Optional(
        t.Partial(
            t.Object({
                bio: t.String({
                    maxLength: 256,
                }),
                flair: t.String({
                    maxLength: 12,
                }),
            }),
        ),
    ),
    images: t.Optional(
        t.Object({
            avatar: t.Optional(t.Any()),
            header: t.Optional(t.Any()),
        }),
    ),
})

export const PackMembership = t.Object({
    id: t.Number(),
    user_id: t.String(),
    permissions: t.Number()
})

export const PackResponse = t.Object({
    id: t.String(),
    slug: t.String(),
    display_name: t.String(),
    expires_after: t.Optional(t.Number()), // cache
    about: t.Optional(
        t.Partial(
            t.Object({
                bio: t.String(),
                flair: t.String(),
            }),
        ),
    ),
    images: t.Optional(
        t.Partial(
            t.Object({
                avatar: t.String(),
                header: t.String(),
            }),
        ),
    ),
    membership: t.Optional(PackMembership),
    statistics: t.Optional(
        t.Object({
            members: t.Number(),
            heartbeat: t.Number(),
        }),
    ),
    created_at: t.String(),
    owner_id: t.Optional(
        t.String(),
    ),
    pages: t.Optional(
        t.Array(
            t.Object({
                id: t.String(),
                created_at: t.String(),
                title: t.String(),
                slug: t.String(),
                description: t.Optional(t.String()),
                icon: t.Optional(t.String()),
                ticker: t.Optional(t.String()),
                order: t.Optional(t.Number()),
                query: t.Optional(t.Any()),
            }),
        ),
    ),
})

export const HowlBody = t.Object({
    tenant_id: t.String(),
    channel_id: t.Optional(t.String()),
    content_type: t.Union([t.Literal('markdown'), t.Literal('rich'), t.Literal('asset'), t.Literal('howling_alongside')]),
    body: t.Nullable(
        t.String({
            minLength: 1,
            maxLength: 4096,
        }),
    ),
    asset_ids: t.Optional(t.Array(t.String())),
    tags: t.Optional(
        t.Array(
            t.String({
                minLength: 1,
                maxLength: 50,
            }),
        ),
    ),
})

export const HowlComment = t.Object({
    user: UserProfile,
    created_at: t.String(),
    body: t.Optional(t.String({
        maxLength: 4096,
    })),
    content_type: t.String(),
})

export const HowlResponse = t.Object({
    id: t.String(),
    rehowl_id: t.Optional(t.String()),
    tenant_id: t.Optional(t.String()),
    channel_id: t.Optional(t.String()),
    content_type: t.Union([t.Literal('markdown'), t.Literal('rich'), t.Literal('asset'), t.Literal('howling_alongside'), t.Literal('howling_echo')]),
    created_at: t.String(),
    body: t.Optional(
        t.String({
            maxLength: 4096,
        }),
    ),
    allow_rehowl: t.Optional(t.Boolean()),
    rehowled_by: t.Optional(UserProfile),
    assets: t.Optional(
        t.Array(
            t.Object({
                type: t.Union([t.Literal('image'), t.Literal('video'), t.Literal('audio'), t.Literal('file')]),
                data: t.Object({
                    name: t.Optional(t.String()),
                    url: t.String(),
                }),
            }),
        ),
    ),
    tags: t.Optional(
        t.Array(
            t.String({
                minLength: 1,
                maxLength: 50,
            }),
        ),
    ),
    user: UserProfile,
    reactions: t.Optional(
        t.Array(
            t.Object({
                key: t.String(),
                emoji: t.String(),
                count: t.Number(),
                reactedByMe: t.Optional(t.Boolean()),
            }),
        ),
    ),
    comments: t.Optional(t.Array(HowlComment)),
    pack: t.Optional(PackResponse),
    page: t.Optional(
        t.Object({
            id: t.String(),
            title: t.String(),
            slug: t.String(),
            description: t.Optional(t.String()),
            icon: t.Optional(t.String()),
        }),
    ),
    warning: t.Optional(
        t.Object({
            reason: t.String()
        })
    )
    // classification: t.Optional(
    //     t.Object(
    //         {
    //             label: t.String(),
    //             rheoAgrees: t.Boolean(),
    //             rationale: t.Optional(t.String()),
    //         },
    //         {
    //             description: 'For internal debugging use only.',
    //         },
    //     ),
    // ),
})

export const PackPageCreateBody = t.Object({
    // title: t.String({
    //     minLength: 1,
    //     maxLength: 50,
    // }),
    slug: t.String({
        minLength: 1,
        maxLength: 50,
        pattern: '^[a-z0-9-]+$',
    }),
    // description: t.Optional(t.String({
    //     maxLength: 200,
    // })),
    // icon: t.Optional(t.String()),
    // ticker: t.Optional(t.String()),
    // content: t.Optional(t.Any()),
    order: t.Optional(t.Number()),
})

export const PackPageEditBody = t.Object({
    title: t.Optional(
        t.String({
            minLength: 1,
            maxLength: 50,
        }),
    ),
    slug: t.Optional(
        t.String({
            minLength: 1,
            maxLength: 50,
            pattern: '^[a-z0-9-]+$',
        }),
    ),
    description: t.Optional(
        t.String({
            maxLength: 200,
        }),
    ),
    icon: t.Optional(t.String()),
    ticker: t.Optional(t.String()),
    query: t.Optional(t.Any()),
    order: t.Optional(t.Number()),
})

export const PackPageReorderBody = t.Object({
    pageId: t.String(),
    newOrder: t.Number(),
})

export const Pagination = (type: any) =>
    t.Object({
        has_more: t.Boolean(),
        data: t.Array(type),
    })

export const NotificationType = t.Object({
    id: t.String(),
    created_at: t.String(),
    user_id: t.String(),
    type: t.String(),
    title: t.String(),
    content: t.Optional(t.String()),
    read: t.Boolean(),
    read_at: t.Optional(t.String()),
    metadata: t.Optional(t.Any()),
    related_id: t.Optional(t.String()),
})

export const NotificationReadBody = t.Object({
    id: t.Optional(t.String()),
    ids: t.Optional(t.Array(t.String())),
    all: t.Optional(t.Boolean()),
})

export const NotificationFetchQuery = t.Object({
    limit: t.Optional(t.Number({default: 20})),
    cursor: t.Optional(t.String()),
    unread_only: t.Optional(t.Boolean({default: false})),
})
