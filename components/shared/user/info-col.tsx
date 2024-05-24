'use client'

import UserAvatar from '@/components/shared/user/avatar'
// @ts-ignore
import * as HoverCard from '@radix-ui/react-hover-card'
import {Drawer} from 'vaul'
import {useState} from 'react'
import clsx from 'clsx'

export default function UserInfoCol({user, size, inDrawer}: {
    user: any; // object
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    inDrawer?: boolean;
}) {
    const [snap, setSnap] = useState<number | string | null>('148px')

    const DrawerRoot = inDrawer ? Drawer.NestedRoot : Drawer.Root

    return (
        <DrawerRoot
            snapPoints={['355px', '640px', 1]}
            activeSnapPoint={snap}
            setActiveSnapPoint={setSnap}
            shouldScaleBackground
        >
            <Drawer.Trigger>
                <HoverCard.Root>
                    <HoverCard.Trigger asChild>
                        <UserInfo user={user} size={size}/>
                    </HoverCard.Trigger>
                    <HoverCard.Portal>
                        <HoverCard.Content side="bottom" align="start" sideOffset={5}>
                            <div className="max-w-md w-fit h-fit">
                            </div>
                        </HoverCard.Content>
                    </HoverCard.Portal>
                </HoverCard.Root>
            </Drawer.Trigger>
            <Drawer.Portal>
                <Drawer.Content
                    className="fixed flex flex-col bg-card border border-b-none rounded-t-[10px] bottom-0 left-0 right-0 h-full max-h-[97%] mx-[-1px] md:mx-auto md:max-w-sm lg:max-w-md xl:max-w-lg">
                    <div
                        className={clsx('flex flex-col w-full', {
                            'overflow-y-auto': snap === 1,
                            'overflow-hidden': snap !== 1,
                        })}
                    >
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </DrawerRoot>
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
                <span className="text-sm font-semibold">{user.username || user.avatar}</span>
                <span
                    className="self-baseline text-xs text-alt unicorn:text-on-surface-variant/50">{user.tag || 'piss'}</span>
            </div>
        </div>
    )
}