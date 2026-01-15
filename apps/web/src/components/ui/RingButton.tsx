import Link from '@/components/shared/link'
import {cn} from '@/lib'
import {Text} from '@/src/components'
import {ComponentType, FC} from 'react'

interface ButtonProps {
    icon: ComponentType<{ className?: string }>;
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: 'destructive' | 'default';
}

export const RingButton: FC<ButtonProps> = ({
                                                icon: Icon,
                                                label,
                                                href,
                                                onClick,
                                                variant = 'default'
                                            }) => {
    const variantStyles = {
        destructive: 'hover:bg-destructive/75 ring-destructive/25',
        default: 'hover:bg-muted ring-muted/50'
    }

    const className = `group inline-flex w-full cursor-pointer items-center justify-start gap-4 rounded px-4 py-3 transition-all hover:ring-2 ${variantStyles[variant]}`

    const content = (
        <>
            <Icon className="fill-muted-foreground h-4 w-4 group-hover:fill-white"/>
            <Text className="group-hover:text-white">{label}</Text>
        </>
    )

    if (href) {
        return (
            <Link href={href} className={cn(className, 'text-foreground')} onClick={onClick}>
                {content}
            </Link>
        )
    }

    return (
        <div className={className} onClick={onClick}>
            {content}
        </div>
    )
}