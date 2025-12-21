import { Avatar } from '@/components/shared/avatar.tsx'
import { Heading, Text } from '@/components/shared/text.tsx'
import { useContentFrame } from '@/lib/hooks/content-frame.tsx'
import { MoreVertical, Search } from 'lucide-react'
import { motion } from 'motion/react'

export function ChannelHeader({ channelId }: { channelId: string }) {
    const { data: channel, isLoading } = useContentFrame('get', `dm.channels.${channelId}`, undefined, {
        id: `channel-${channelId}`,
    })

    const rec = channel?.recipients?.[0]
    const name = rec?.display_name || rec?.username || 'Direct Message'
    const handle = rec?.username ? `@${rec.username}` : null
    const avatarSrc = rec?.images_avatar || null
    const initials = (rec?.display_name || rec?.username || '?').slice(0, 1)

    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-0 z-40 shrink-0 border-b"
            role="banner"
        >
            <div className="flex items-center gap-4 px-6 py-3 h-[72px]">
                {isLoading && (
                    <div className="flex items-center gap-3 w-full animate-pulse">
                        <div className="size-10 rounded-full bg-muted/60" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 bg-muted/60 rounded" />
                            <div className="h-3 w-20 bg-muted/60 rounded" />
                        </div>
                    </div>
                )}

                {!isLoading && channel && (
                    <>
                        <div className="relative">
                            <Avatar src={avatarSrc} alt={name} initials={avatarSrc ? undefined : initials}
                                className="size-10 ring-2 ring-background shadow-sm" />
                            <span className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 ring-2 ring-background" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <Heading size="sm" className="truncate font-semibold tracking-tight text-foreground/90">
                                {name}
                            </Heading>
                            <Text size="xs" alt className="truncate opacity-80 font-medium">
                                {handle || 'Direct Message'}
                            </Text>
                        </div>

                        <div className="ml-auto flex items-center gap-1">
                            <button
                                type="button"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                                title="Search"
                            >
                                <Search className="size-5 opacity-70" />
                            </button>
                            <button
                                type="button"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                                title="More"
                            >
                                <MoreVertical className="size-5 opacity-70" />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    )
}

