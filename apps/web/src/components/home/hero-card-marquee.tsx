import {cn, vg} from '@/lib'
import {getAvatar} from '@/lib/api/users/avatar'
import {Avatar, MediaGallery, Text} from '@/src/components'
import {motion} from 'motion/react'
import {useEffect, useState} from 'react'

export function HeroCardMarquee() {
    const [posts, setPosts] = useState<
        {
            id: string
            body: string
            user: {
                id: string
                username: string
                images?: {
                    avatar?: string
                }
            }
            assets: any
        }[]
    >()

    useEffect(() => {
        vg.search
            .get({
                query: {
                    q: `$posts = @PAGE(0, 25, [Where posts:content_type ("markdown") AND posts:tags ("~rating_safe")]) AS *;\n$posts:user = [Where profiles:id ($posts:user_id->ONE)] AS *;`,
                },
            })
            .then(({data: response}) => {
                const p = response?.posts
                setPosts(
                    [...Array(Math.max(25, p?.length || 0)).keys()].map(
                        (i) => p?.[i % (p?.length || 1)],
                    ),
                )
            })
    }, [])

    const ROWS = 16

    return (
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none dark">
            <div className="absolute inset-0 bg-linear-to-t from-neutral-900 via-transparent to-neutral-900 z-10"/>

            <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] flex gap-8 justify-center items-center content-center opacity-[0.25] transform -rotate-12">
                {/* Columns: 5 columns of 16 cards each */}
                {[0, 1, 2, 3, 4].map((col) => (
                    <div
                        key={col}
                        className={cn(col % 2 === 0 ? 'translate-y-[2%]' : '', 'flex flex-col gap-8')}
                    >
                        {Array.from({length: ROWS}).map((_, i) => {
                            const index = col * ROWS + i
                            const post = posts?.[index % (posts?.length || 1)]

                            return (
                                <motion.div
                                    key={`${col}-${i}`}
                                    custom={col}
                                    initial="hidden"
                                    animate="visible"
                                    variants={{
                                        hidden: (colIdx) => ({
                                            opacity: 0,
                                            y: colIdx % 2 === 0 ? -1000 : 1000,
                                        }),
                                        visible: {
                                            opacity: 1,
                                            y: col % 2 === 0 ? 0 : 250,
                                            transition: {
                                                duration: 3,
                                                delay: col % 2 === 0 ? (ROWS - 1 - i) * 0.15 : i * 0.15,
                                                ease: 'easeInOut',
                                            },
                                        },
                                        exit: (colIdx) => ({
                                            opacity: 0,
                                            y: colIdx % 2 === 0 ? -1000 : 1000,
                                            transition: {
                                                duration: 0.5,
                                                delay: col % 2 === 0 ? i * 0.1 : (ROWS - 1 - i) * 0.1,
                                                ease: 'easeIn',
                                            },
                                        }),
                                    }}
                                    className={cn(
                                        post ? 'bg-card' : 'bg-foreground',
                                        'w-40 min-h-60 rounded-xl p-4 border min-w-md',
                                    )}
                                >
                                    {post && (
                                        <>
                                            {post.user && (
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Avatar
                                                        src={getAvatar(post.user.id)}
                                                        initials={post.user.username[0]}
                                                        className="size-6 shrink-0"
                                                    />
                                                    <Text className="font-bold truncate text-xs text-white">{post.user.username}</Text>
                                                </div>
                                            )}

                                            <Text className="text-[10px] leading-tight line-clamp-9 text-white">{post.body}</Text>

                                            {post.assets && <MediaGallery assets={post.assets}/>}
                                        </>
                                    )}
                                </motion.div>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}
