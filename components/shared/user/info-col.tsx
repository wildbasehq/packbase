'use client'

import UserAvatar from '@/components/shared/user/avatar'
// @ts-ignore
import * as HoverCard from '@radix-ui/react-hover-card'
import {Link} from '@/components/shared/link'
import ReactMarkdown from 'react-markdown'
import {Heading, Text} from '@/components/shared/text'
import {BentoStaffBadge} from '@/lib/utils/pak'
import Image from 'next/image'

export default function UserInfoCol({user, size, tag}: {
    user: any; // object
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    tag?: React.ReactNode;
}) {
    // const [snap, setSnap] = useState<number | string | null>('148px')

    // const DrawerRoot = inDrawer ? Drawer.NestedRoot : Drawer.Root

    return (
        <HoverCard.Root>
            <HoverCard.Trigger className="!no-underline select-none">
                <UserInfo user={user} size={size} tag={tag}/>
            </HoverCard.Trigger>
            <HoverCard.Portal>
                <HoverCard.Content
                    className="relative data-[side=bottom]:animate-slide-up-fade-snapper data-[side=right]:animate-slideLeftAndFade data-[side=left]:animate-slideRightAndFade data-[side=top]:animate-slide-down-fade w-96 bg-card rounded p-5 shadow border data-[state=open]:transition-all overflow-hidden"
                    sideOffset={5}
                    collisionPadding={{left: 32}}
                >
                    {user.images?.header && (
                        <div className="absolute top-0 right-0 w-full h-full pointer-events-none">
                            {/*<div className="absolute w-full h-full bg-card/90 rounded"/>*/}
                            <Image src={user.images?.header} width={1080} height={1080} className="w-full h-full object-cover rounded object-center opacity-10"
                                   alt="Cover image"/>
                        </div>
                    )}

                    <div className="flex flex-col gap-[7px] z-50">
                        <UserAvatar size="3xl" user={user}/>
                        <div className="flex flex-col gap-4">
                            <div>
                                <div className="text-md">
                                    {user.display_name || user.username}
                                    {user.type && (
                                        <BentoStaffBadge type={user.type} className="ml-1 inline-flex h-5 w-5" width={20} height={20}/>
                                    )}
                                </div>
                                <div className="text-sm text-alt">@{user.username}</div>
                            </div>
                            <ReactMarkdown className="text-sm" components={{
                                h1(props) {
                                    return <Heading {...props}/>
                                },
                                p(props) {
                                    return <Text {...props}/>
                                }
                            }}>
                                {user.about?.bio}
                            </ReactMarkdown>
                            <div className="flex gap-4">
                                <div className="flex gap-1">
                                    <div className="text-sm font-medium">-1</div>
                                    {' '}
                                    <div className="text-sm">Mutuals</div>
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

export function UserInfo({user, size, tag}: {
    user: any; // object
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    tag?: React.ReactNode;
}) {
    return (
        <div className="flex flex-row items-center gap-2">
            <UserAvatar user={user} size={size || 'md'}/>
            <div className="flex flex-col">
                <Link href={`/@${user.username}`} className="text-sm text-default font-semibold">
                    {user.display_name || user.username}
                    {user.type && (
                        <BentoStaffBadge type={user.type} className="ml-1 inline-flex h-5 w-5" width={20} height={20}/>
                    )}
                </Link>
                <span
                    className="self-baseline text-xs text-alt unicorn:text-on-surface-variant/50">{tag || user.tag || 'piss'}</span>
            </div>
        </div>
    )
}