import clsx from 'clsx'
import {ComponentPropsWithoutRef} from "react";

type HeadingProps = { level?: 1 | 2 | 3 | 4 | 5 | 6 } & ComponentPropsWithoutRef<
    'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
>

export function Heading({className, level = 1, ...props}: HeadingProps) {
    let Element: `h${typeof level}` = `h${level}`

    return (
        <Element
            {...props}
            className={clsx(className, 'text-xl font-semibold text-foreground sm:text-lg select-none')}
        />
    )
}

export function Subheading({className, level = 2, ...props}: HeadingProps) {
    let Element: `h${typeof level}` = `h${level}`

    return (
        <Element
            {...props}
            className={clsx(className, 'text-base/7 font-semibold text-foreground sm:text-sm/6 select-none  ')}
        />
    )
}
