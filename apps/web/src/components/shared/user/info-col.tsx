import UserAvatar from '@/components/shared/user/avatar'
// @ts-ignore
import Link from '@/components/shared/link'
import Markdown from '@/components/shared/markdown'
import {BentoGenericUnlockableBadge, BentoStaffBadge} from '@/lib/utils/pak'
import * as HoverCard from '@radix-ui/react-hover-card'
import {cn} from '@/lib'
import {ReactNode} from "react";

export default function UserInfoCol({
                                        user,
                                        size,
                                        tag,
                                        children,
                                        className,
                                    }: {
    user: any // object
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    tag?: ReactNode
    children?: ReactNode
    className?: string
}) {
    // const [snap, setSnap] = useState<number | string | null>('148px')

    // const DrawerRoot = inDrawer ? Drawer.NestedRoot : Drawer.Root

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
                    {user.images?.header && (
                        <div className="pointer-events-none absolute right-0 top-0 h-full w-full">
                            {/*<div className="absolute w-full h-full bg-card/90 rounded"/>*/}
                            <img
                                src={user.images?.header}
                                width={1080}
                                height={1080}
                                className="h-full w-full rounded object-cover object-center opacity-10"
                                alt="Cover image"
                            />
                        </div>
                    )}

                    <div className="z-50 flex flex-col gap-[7px]">
                        <UserAvatar size="3xl" user={user}/>
                        <div className="flex flex-col gap-4">
                            <div>
                                <div className="text-md">
                                    {user.display_name || user.username}
                                    {user.type && (
                                        <BentoStaffBadge type={user.type} className="ml-1 inline-flex h-5 w-5"
                                                         width={20} height={20}/>
                                    )}
                                    {user.badge && (
                                        <BentoGenericUnlockableBadge
                                            type={user.badge}
                                            className="ml-1 inline-flex h-5 w-5"
                                            width={20}
                                            height={20}
                                        />
                                    )}
                                </div>
                                <div className="text-muted-foreground text-sm">@{user.username}</div>
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
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    tag?: ReactNode
}) {
    return (
        <div className="flex flex-row items-center gap-2">
            <UserAvatar user={user} size={size}/>
            <div className="flex flex-col">
                <Link href={`/@${user.username}`} className="text-default text-sm font-semibold">
                    {user.display_name || user.username}
                    {user.type &&
                        <BentoStaffBadge type={user.type} className="ml-1 inline-flex h-5 w-5" width={20} height={20}/>}
                    {user.badge && (
                        <BentoGenericUnlockableBadge type={user.badge} className="ml-1 inline-flex h-5 w-5" width={20}
                                                     height={20}/>
                    )}
                </Link>
                <span
                    className="text-muted-foreground w-32 self-baseline overflow-hidden text-ellipsis whitespace-nowrap text-xs unicorn:text-on-surface-variant/50">
                    {tag || user.tag || user.username || 'piss'}
                </span>
            </div>
        </div>
    )
}
