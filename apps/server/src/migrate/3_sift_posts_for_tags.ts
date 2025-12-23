import debug from 'debug'

const log = debug('vg:migrate:3_sift_posts_for_tags')

export default async function siftPostsForTags() {
    // Go through all posts, get unique tags, and add them to the posts_statistics `type: 'tags'`.tags column (created if missing)
    log('Sifting posts for tags...')

    // Fetch all posts
    const posts = await prisma.posts.findMany({
        select: {
            tags: true
        }
    })

    // Extract unique tags
    const uniqueTags = new Set<string>()
    for (const post of posts) {
        if (post.tags && Array.isArray(post.tags)) {
            for (const tag of post.tags) {
                if (tag && typeof tag === 'string') {
                    uniqueTags.add(tag)
                }
            }
        }
    }

    const tagsArray = Array.from(uniqueTags)
    log(`Found ${tagsArray.length} unique tags from ${posts.length} posts`)

    // Upsert into posts_statistics
    await prisma.posts_statistics.upsert({
        where: {
            type: 'tags'
        },
        update: {
            tags: tagsArray
        },
        create: {
            type: 'tags',
            tags: tagsArray
        }
    })

    log('Tags successfully added to posts_statistics')
}