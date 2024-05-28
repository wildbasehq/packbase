import BoringAvatar from 'boring-avatars'
import {clsx} from 'clsx'

export default function UserAvatar({user, size = 'lg', avatar, ...props}: {
    user?: any; // object - @todo: type this
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | number;
    icon?: string;
    [x: string]: any;
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

    if ((!user || !user.avatar) && !avatar) {
        return (
            <div
                className={clsx(props.className, `inline-flex justify-center rounded-md items-center bg-n-5 text-white overflow-hidden`)}
                style={props.style} title={`${props.displayName}'s avatar`}>
                <BoringAvatar variant="beam" square size={typeof size === 'number' ? size : sizes[size]} {...props} />
            </div>
        )
    } else {
        return (
            <img width={1024}
                 height={1024}
                 src={user?.avatar || avatar}
                 alt={`${user?.username || props.displayName}'s avatar`}
                 {...props}
                 className={clsx(props.className, `inline-flex justify-center rounded-md items-center bg-n-5 text-white overflow-hidden`)}
            />
        )
    }
}