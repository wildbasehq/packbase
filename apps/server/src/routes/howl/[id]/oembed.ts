import {YapockType} from '@/index'
import {getPost} from '@/lib/api/post'
import {t} from 'elysia'

/**
 * oEmbed endpoint for howl posts.
 * Discord fetches this via the <link rel="alternate" type="application/json+oembed"> tag
 * to populate embed author name, author URL, and author icon.
 *
 * @see https://oembed.com/
 */
export default (app: YapockType) =>
    app.get(
        '',
        async ({params, set}) => {
            const {id} = params

            const howl = await getPost(id)
            if (!howl) {
                set.status = 404
                return {error: 'Not found'}
            }

            const displayName = howl.user.display_name || howl.user.username

            return {
                type: 'link',
                version: '1.0',
                author_name: `${displayName} (@${howl.user.username})`,
                author_url: `https://packbase.app/@${howl.user.username}`,
                provider_name: 'Packbase',
                provider_url: 'https://packbase.app',
            }
        },
        {
            detail: {
                description: 'oEmbed metadata for a howl post',
                tags: ['Howl'],
            },
            params: t.Object({
                id: t.String({description: 'Howl ID'}),
            }),
        },
    )
