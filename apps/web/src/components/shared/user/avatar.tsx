/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {cn} from '@/lib'
import {getAvatar} from '@/src/lib/api/users/avatar'

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

    return (
        <>
            <div className="relative" style={props.style}>
                <img
                    width={1024}
                    height={1024}
                    src={getAvatar(user?.id) || icon}
                    alt={`${user?.username || props.display_name}'s avatar`}
                    {...props}
                    className={cn(props.className, `inline-flex items-center justify-center overflow-hidden rounded-md text-white`)}
                />
                {showOnlineStatus && <OnlineStatus isOnline={isOnline} size={size}/>}
            </div>
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
