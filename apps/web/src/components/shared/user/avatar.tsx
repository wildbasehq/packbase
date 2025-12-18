/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import BoringAvatar from 'boring-avatars'
import {cn, isVisible} from "@/lib";
import {Activity} from "react";

export default function UserAvatar({
                                       user,
                                       size = 'lg',
                                       icon,
                                       showOnlineStatus = false,
                                       ...props
                                   }: {
    user?: any // object - @todo: type this
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | number
    icon?: string
    showOnlineStatus?: boolean
    isOnline?: boolean
    [_: string]: any
}) {
    const sizes = {
        xs: 16,
        sm: 24,
        md: 32,
        lg: 40,
        xl: 48,
        '2xl': 56,
        '3xl': 64,
    }

    props.className = `${props.className || ''}`
    props.style = {
        ...props.style,
        width: typeof size === 'number' ? size : sizes[size],
        height: typeof size === 'number' ? size : sizes[size],
    }

    const isOnline = user?.online
    const hasIcon = ((user?.images?.avatar || user?.images_avatar)) || icon

    return (
        <>
            <Activity mode={isVisible(!hasIcon)}>
                <div
                    className={cn(props.className, `relative items-center justify-center overflow-hidden rounded-md bg-n-5 text-white`)}
                    style={props.style}
                    title={`${user?.username || user?.display_name || props.display_name}'s avatar`}
                >
                    <BoringAvatar
                        variant="beam"
                        square
                        size={typeof size === 'number' ? size : sizes[size]}
                        name={user?.username || props.name || 'packbase'}
                        {...props}
                    />
                    {showOnlineStatus && <OnlineStatus isOnline={isOnline} size={size}/>}
                </div>
            </Activity>

            <Activity mode={isVisible(hasIcon)}>
                <div className="relative" style={props.style}>
                    <img
                        width={1024}
                        height={1024}
                        src={user?.images?.avatar || user?.images_avatar || icon}
                        alt={`${user?.username || props.display_name}'s avatar`}
                        {...props}
                        className={cn(props.className, `inline-flex items-center justify-center overflow-hidden rounded-md text-white`)}
                    />
                    {showOnlineStatus && <OnlineStatus isOnline={isOnline} size={size}/>}
                </div>
            </Activity>
        </>
    )
}

function OnlineStatus({isOnline, size}: { isOnline: boolean; size: string | number }) {
    return (
        <div
            className={cn(
                'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white dark:border-zinc-900',
                isOnline ? 'bg-green-500' : 'bg-gray-400',
                {
                    'w-2 h-2': size === 'xs' || size === 'sm' || (typeof size === 'number' && size < 32),
                    'w-3 h-3': size === 'md' || size === 'lg' || (typeof size === 'number' && size >= 32 && size < 48),
                    'w-4 h-4': size === 'xl' || size === '2xl' || size === '3xl' || (typeof size === 'number' && size >= 48),
                }
            )}
        ></div>
    )
}
