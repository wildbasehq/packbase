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
    props.className = `${props.className || ''} ${textSize[size]}`
    return (
        <Comp {...props}>
            {children}
        </Comp>
    )
}

export function Text({children, size = 'base', ...props}: {
    children: React.ReactNode;
    size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
    [key: string]: any;
}): JSX.Element {
    return (
        <p className={`${textSize[size]}`} {...props}>
            {children}
        </p>
    )
}