import React from 'react';

export function NGAvatar({...props}: {
    size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    statusPosition?: 'top' | 'bottom';
    online?: boolean;
    image: string;

    className?: string;
}) {
    const size = (() => {
        switch (props.size) {
            case 'xxs':
                // a grower not a shower
                return 'w-5 h-5';
            case 'xs':
                return 'w-6 h-6';
            case 'sm':
                return 'w-8 h-8';
            case 'md':
            default:
                return 'w-10 h-10';
            case 'lg':
                return 'w-12 h-12';
            case 'xl':
                return 'w-14 h-14';
        }
    })();

    return (
        <span className={`${props.className || 'inline-block'} relative`}>
            <img
                className={`${size} rounded-full`}
                src={props.image}
                alt=""
            />
            {props.online && (
                <span className={`absolute ${props.statusPosition === 'top' ? 'top-0' : 'bottom-0'} right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-neutral-800 bg-green-500`}></span>
            )}
        </span>
    )
}