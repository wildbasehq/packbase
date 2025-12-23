import {Heading} from '@/components/shared/text'

import {cn} from '@/lib/utils'
import {cva, type VariantProps} from 'class-variance-authority'
import {forwardRef, HTMLAttributes} from 'react'

const alertVariants = cva(
    'relative w-full rounded-3xl border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
    {
        variants: {
            variant: {
                default: 'bg-card-solid text-foreground',
                destructive: 'border-destructive/50 bg-card text-destructive dark:border-destructive [&>svg]:text-destructive',
                success: 'border-green-500 bg-card [&>svg]:text-green-500',
                warning: 'border-yellow-500 bg-yellow-500/15 [&>svg]:text-yellow-500',
                info: 'border-blue-500 bg-card [&>svg]:text-blue-500',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)

const Alert = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>>(
    ({className, variant, ...props}, ref) => (
        <div ref={ref} role="alert" className={cn(alertVariants({variant}), className)} {...props} />
    )
)
Alert.displayName = 'Alert'

const AlertTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(({
                                                                                             className,
                                                                                             ...props
                                                                                         }, ref) => (
    <Heading as="h5" ref={ref}
             className={cn('mb-1 select-none font-medium leading-none tracking-tight', className)} {...props} />
))
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
    ({className, ...props}, ref) => <div ref={ref}
                                         className={cn('select-none text-sm/6 [&_p]:leading-relaxed', className)} {...props} />
)
AlertDescription.displayName = 'AlertDescription'

export {Alert, AlertTitle, AlertDescription}
