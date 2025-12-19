import RSS from 'rss';
import {posts, profiles} from '@prisma/client';

export interface RSSPost extends Partial<posts> {
    id: string;
    created_at: Date;
    body: string | null;
    content_type: string;
    pack_slug?: string | null;
}

export interface RSSProfile extends Partial<profiles> {
    id: string;
    username: string;
    display_name: string | null;
    bio: string | null;
}

/**
 * RSSGenerator - Generates RSS 2.0 compliant XML feeds
 */
export class RSSGenerator {
    /**
     * Generate an RSS feed for a user's posts
     *
     * @param profile The user profile
     * @param posts Array of posts to include in the feed
     * @param baseUrl The base URL of the application
     * @returns RSS XML string
     */
    static generateUserFeed(profile: RSSProfile, posts: RSSPost[], baseUrl: string): string {
        const feedUrl = `${baseUrl}/user/${profile.username}/rss`;
        const userUrl = `https://packbase.app/@${profile.username}`;

        const feed = new RSS({
            title: `${profile.display_name || profile.username}'s Posts`,
            description: profile.bio || `Posts by ${profile.display_name || profile.username}`,
            feed_url: feedUrl,
            site_url: userUrl,
            language: 'en',
            pubDate: posts.length > 0 ? posts[0].created_at : new Date(),
            ttl: 60, // 60 minutes
            copyright: `© ${new Date().getFullYear()} ${profile.display_name} (${profile.username})`,
            generator: 'Packbase',
        });

        for (const post of posts) {
            const postUrl = `${baseUrl}/p/${post.pack_slug || 'universe'}/${post.id}`;

            // Prepare description/content
            let description = post.body || '';

            // Add asset information if available
            if (post.assets && Array.isArray(post.assets) && post.assets.length > 0) {
                const assetInfo = post.assets.map((asset: any) => {
                    if (asset.type === 'image') {
                        return `<p><img src="${process.env.PROFILES_CDN_URL_PREFIX}/${asset.data.url}" alt="${asset.alt || 'Image'}" /></p>`;
                    } else if (asset.type === 'video') {
                        return `<p><video src="${asset.data.url}" controls></video></p>`;
                    }
                    return '';
                }).join('\n');

                if (assetInfo) {
                    description = `${description}\n${assetInfo}`;
                }
            }

            feed.item({
                title: this.generatePostTitle(post),
                description: description || '(No content)',
                url: postUrl,
                guid: post.id,
                date: post.created_at,
                author: profile.username,
            });
        }

        return feed.xml({indent: true});
    }

    /**
     * Generate a title for a post based on its content
     */
    private static generatePostTitle(post: RSSPost): string {
        if (!post.body) {
            return `Post by user at ${post.created_at.toISOString()}`;
        }

        // Extract first line or first 50 characters
        const firstLine = post.body.split('\n')[0];
        const title = firstLine.length > 50
            ? firstLine.substring(0, 47) + '...'
            : firstLine;

        return title || `Post at ${post.created_at.toISOString()}`;
    }
}

