import {cn} from '@/lib/utils'

const textSize = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
}

export function Heading({as, children, size = 'base', ...props}: {
    as?: React.ElementType;
    children: React.ReactNode;
    size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
    [key: string]: any;
}): JSX.Element {
    const Comp = as || 'h1'
    props.className = cn('text-default select-none', props.className, textSize[size], 'font-medium leading-none tracking-tight')
    return (
        <Comp {...props}>
            {children}
        </Comp>
    )
}

export function Text({children, size = 'sm', alt, ...props}: {
    children: React.ReactNode;
    size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
    alt?: boolean;
    [key: string]: any;
}): JSX.Element {
    props.className = cn('text-default select-none', props.className, textSize[size], alt && 'text-alt', '[&_p]:leading-relaxed')

    return (
        <p {...props}>
            {children}
        </p>
    )
}