// @ts-ignore
import {Badges} from '@/components/icons/badges'
import Link from '@/components/shared/link'
import Markdown from '@/components/shared/markdown'
import {cn} from '@/lib'
import {Avatar, Text} from '@/src/components'
import {getAvatar} from '@/src/lib/api/users/avatar'
import * as HoverCard from '@radix-ui/react-hover-card'
import {ReactNode} from 'react'

export default function UserInfoCol({
                                        user,
                                        size,
                                        tag,
                                        children,
                                        className,
                                    }: {
    user: any // object
    size?: number
    tag?: ReactNode
    children?: ReactNode
    className?: string
}) {
    return (
        <HoverCard.Root>
            <HoverCard.Trigger className={cn('select-none no-underline!', className)}>
                {children || <UserInfo user={user} size={size} tag={tag}/>}
            </HoverCard.Trigger>
            <HoverCard.Portal>
                <HoverCard.Content
                    className="data-[side=right]:animate-slideLeftAndFade data-[side=left]:animate-slideRightAndFade relative w-96 overflow-hidden rounded border bg-card p-5 shadow-sm data-[side=bottom]:animate-slide-up-fade-snapper data-[side=top]:animate-slide-down-fade data-[state=open]:transition-all"
                    sideOffset={5}
                    collisionPadding={{left: 32}}
                >
                    <UserHoverCard user={user}/>

                    <HoverCard.Arrow className="fill-white"/>
                </HoverCard.Content>
            </HoverCard.Portal>
        </HoverCard.Root>
    )
}

export function UserInfo({
                             user,
                             size,
                             tag,
                         }: {
    user: any // object
    size?: number
    tag?: ReactNode
}) {
    return (
        <div className="flex flex-row items-center gap-2">
            <Avatar initials={user.username.substring(0, 2)} src={getAvatar(user.id)} style={{
                width: size ?? '2rem',
                height: size ?? '2rem',
            }}/>
            <div className="flex flex-col">
                <Link href={`/@${user.username}`} className="flex text-foreground text-sm font-semibold">
                    {user.display_name || user.username}
                    <Badges xp={user?.xp} genericUnlock={user?.badge} staffBadge={user?.type}/>
                </Link>
                <Text alt>
                    {tag || user.tag || user.username || 'dummy'}
                </Text>
            </div>
        </div>
    )
}

export function UserHoverCard({user}: { user: any }) {
    return (
        <>
            {user?.images?.header && (
                <div className="pointer-events-none absolute right-0 top-0 h-full w-full">
                    {/*<div className="absolute w-full h-full bg-card/90 rounded"/>*/}
                    <img
                        src={user?.images?.header}
                        width={1080}
                        height={1080}
                        className="h-full w-full rounded object-cover object-center opacity-10"
                        alt="Cover image"
                    />
                </div>
            )}

            <div className="z-50 flex flex-col gap-[7px]">
                <Avatar initials={user.username.substring(0, 2)} src={getAvatar(user.id)} className="size-14"/>
                <div className="flex flex-col gap-4">
                    <div>
                        <Text as="div" className="text-md">
                            {user.display_name || user.username}
                            <Badges xp={user?.xp} genericUnlock={user?.badge} staffBadge={user?.type} className="ml-1 inline-flex h-5 w-5"/>
                        </Text>

                        <Text alt>@{user.username}</Text>
                    </div>
                    <Markdown className="text-sm">{user.about?.bio}</Markdown>
                    {user.mutuals && (
                        <div className="flex gap-4">
                            <div className="flex gap-1">
                                <div className="text-sm font-medium">{user.mutuals}</div>
                                <div className="text-sm">Mutuals</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
