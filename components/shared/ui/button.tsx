import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
    'inline-flex items-center justify-center whitespace-nowrap select-none rounded text-sm font-medium ring-offset-background transition-all focus-visible:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 hover:ring-4 hover:ring-n-5/10 disabled:cursor-not-allowed disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'bg-card text-default ring-default border no-underline! transition-all hover:bg-n-2/25 hover:ring-4 dark:hover:bg-n-6/50',
                primary: 'bg-primary text-white hover:bg-primary/90',
                destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/75 hover:ring-destructive/25',
                outline: 'ring-default text-default border no-underline! transition-all hover:bg-n-2/25 hover:ring-4 dark:hover:bg-n-6/50',
                secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                grey: 'bg-card border text-default hover:bg-zinc-900/5 dark:hover:bg-white/5',
                ghost: 'transition-all text-default hover:ring-4 hover:ring-neutral-500/10',
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 rounded-md px-3',
                lg: 'h-11 rounded-md px-8',
                icon: 'h-10 w-10',
                self: '',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
})
Button.displayName = 'Button'

export { Button, buttonVariants }
