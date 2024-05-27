'use client'

import UserAvatar from '@/components/shared/user/avatar'
// @ts-ignore
import * as HoverCard from '@radix-ui/react-hover-card'

export default function UserInfoCol({user, size, inDrawer}: {
    user: any; // object
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    inDrawer?: boolean;
}) {
    // const [snap, setSnap] = useState<number | string | null>('148px')

    // const DrawerRoot = inDrawer ? Drawer.NestedRoot : Drawer.Root

    return (
        <HoverCard.Root>
            <HoverCard.Trigger>
                <UserInfo user={user} size={size}/>
            </HoverCard.Trigger>
            <HoverCard.Portal>
                <HoverCard.Content
                    className="relative data-[side=bottom]:animate-slide-up-fade-snapper data-[side=right]:animate-slideLeftAndFade data-[side=left]:animate-slideRightAndFade data-[side=top]:animate-slide-down-fade w-96 bg-background rounded-md p-5 shadow-md border data-[state=open]:transition-all"
                    sideOffset={5}
                    collisionPadding={{left: 32}}
                >
                    {/*<div className="absolute top-0 right-0 w-full h-full -z-[1]">*/}
                    {/*    <div className="absolute w-full h-full bg-background/90 rounded" />*/}
                    {/*    <img src="https://api.yipnyap.me/vault/@server/uploads/members/256/cover-image/6378402f65b8b-yp-cover-image.jpg" className="w-full h-full object-cover rounded object-center" alt="Cover image" />*/}
                    {/*</div>*/}
                    <div className="flex flex-col gap-[7px]">
                        <UserAvatar size="3xl" user={user}/>
                        <div className="flex flex-col gap-4">
                            <div>
                                <div className="text-md">Bernie 🐻</div>
                                <div className="text-sm text-alt">@bernie_burr</div>
                            </div>
                            <div className="text-sm">
                                I draw
                            </div>
                            <div className="flex gap-4">
                                <div className="flex gap-1">
                                    <div className="text-sm font-medium">2</div>
                                    {' '}
                                    <div className="text-sm">Following</div>
                                </div>
                                <div className="flex gap-1">
                                    <div className="text-sm font-medium">1</div>
                                    {' '}
                                    <div className="text-sm">Followers</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <HoverCard.Arrow className="fill-white"/>
                </HoverCard.Content>
            </HoverCard.Portal>
        </HoverCard.Root>
    )
}

export function UserInfo({user, size}: {
    user: any; // object
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}) {
    return (
        <div className="flex flex-row items-center gap-2">
            <UserAvatar user={user} size={size || 'md'}/>
            <div className="flex flex-col">
                <span className="text-sm text-default font-semibold">{user.display_name || user.username}</span>
                <span
                    className="self-baseline text-xs text-alt unicorn:text-on-surface-variant/50">{user.tag || 'piss'}</span>
            </div>
        </div>
    )
}