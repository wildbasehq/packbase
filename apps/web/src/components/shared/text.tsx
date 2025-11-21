import {cn} from '@/lib/utils'
import {ComponentPropsWithoutRef, ElementType, JSX, ReactNode} from 'react'
import Link from './link'

const textSize = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
}

export function Heading({
                            as,
                            children,
                            size = 'md',
                            alt,
                            ...props
                        }: {
    as?: ElementType
    children?: ReactNode
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
    alt?: boolean
    [ke_y: string]: any
}): JSX.Element {
    const Comp = as || 'h1'
    props.className = cn(
        'select-none',
        props.className,
        textSize[size],
        'font-medium leading-none tracking-tight',
        alt ? 'text-muted-foreground' : 'text-default'
    )
    return <Comp {...props}>{children}</Comp>
}

export function Text({
                         children,
                         as,
                         size = 'sm',
                         alt,
                         ...props
                     }: {
    children?: ReactNode
    as?: ElementType
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
    alt?: boolean
    [_: string]: any
}): JSX.Element {
    const Comp = as || 'p'
    props.className = cn(
        'text-base/6 select-none data-disabled:opacity-50 sm:text-sm/6 prose prose-zinc dark:prose-invert max-w-none break-words',
        props.className,
        textSize[size],
        alt && 'text-muted-foreground',
        '[&_p]:leading-relaxed'
    )

    return <Comp {...props}>{children}</Comp>
}

export function TextLink({className, ...props}: ComponentPropsWithoutRef<typeof Link>) {
    return (
        <Link
            {...props}
            className={cn(
                className,
                'text-zinc-950 underline decoration-zinc-950/50 data-hover:decoration-zinc-950 dark:text-white dark:decoration-white/50 dark:data-hover:decoration-white'
            )}
        />
    )
}

export function Strong({className, ...props}: ComponentPropsWithoutRef<'strong'>) {
    return <strong {...props} className={cn(className, 'font-medium text-zinc-950 dark:text-white')}/>
}

export function Code({className, ...props}: ComponentPropsWithoutRef<'code'>) {
    return (
        <code
            {...props}
            className={cn(
                className,
                'rounded-sm border border-zinc-950/10 bg-zinc-950/[2.5%] px-0.5 text-sm font-medium text-zinc-950 sm:text-[0.8125rem] dark:border-white/20 dark:bg-white/5 dark:text-white'
            )}
        />
    )
}
