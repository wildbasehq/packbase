import {cn} from '@/lib'
import * as Headless from '@headlessui/react'
import {ComponentPropsWithoutRef, ReactNode} from 'react'
import {Text} from './text'

const sizes = {
    xs: 'sm:max-w-xs',
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '3xl': 'sm:max-w-3xl',
    '4xl': 'sm:max-w-4xl',
    '5xl': 'sm:max-w-5xl',
    auto: 'sm:max-w-fit',
}

export function Dialog({
                           size = 'auto',
                           className,
                           children,
                           blurBackground,
                           ...props
                       }: {
    size?: keyof typeof sizes;
    className?: string;
    blurBackground?: boolean;
    children: ReactNode
} & Omit<Headless.DialogProps, 'as' | 'className'>) {
    return (
        <Headless.Dialog {...props}>
            <Headless.DialogBackdrop
                transition
                className={cn(
                    'fixed inset-0 flex w-screen z-50 justify-center overflow-y-auto px-2 py-2 transition duration-100 focus:outline-0 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in sm:px-6 sm:py-8 lg:px-8 lg:py-16',
                    blurBackground ? 'backdrop-blur-xl bg-muted/90' : 'bg-muted/50'
                )}
            />

            <div className="fixed inset-0 w-screen overflow-y-auto pt-6 sm:pt-0 z-50">
                <div
                    className="grid min-h-full grid-rows-[1fr_auto] justify-items-center sm:grid-rows-[1fr_auto_3fr] sm:p-4">
                    <Headless.DialogPanel
                        transition
                        className={cn(
                            className,
                            sizes[size],
                            'row-start-2 w-full overflow-hidden min-w-0 rounded-3xl bg-white ring-1 shadow-lg ring-zinc-950/10 sm:mb-auto dark:bg-zinc-900 dark:ring-white/10 forced-colors:outline',
                            'transition duration-100 will-change-transform data-closed:translate-y-12 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in sm:data-closed:translate-y-0 sm:data-closed:data-enter:scale-95'
                        )}
                    >
                        {children}
                    </Headless.DialogPanel>
                </div>
            </div>
        </Headless.Dialog>
    )
}

export function DialogTitle({className, ...props}: {
    className?: string
} & Omit<Headless.DialogTitleProps, 'as' | 'className'>) {
    return (
        <Headless.DialogTitle
            {...props}
            className={cn(className, 'text-lg/6 font-semibold text-balance select-none text-zinc-950 sm:text-base/6 dark:text-white')}
        />
    )
}

export function DialogDescription({
                                      className,
                                      ...props
                                  }: {
    className?: string
} & Omit<Headless.DescriptionProps<typeof Text>, 'as' | 'className'>) {
    return <Headless.Description as={Text} {...props} className={cn(className, 'mt-2 text-pretty')}/>
}

export function DialogBody({className, ...props}: ComponentPropsWithoutRef<'div'>) {
    return <div {...props} className={cn(className, 'mt-6')}/>
}

export function DialogActions({className, ...props}: ComponentPropsWithoutRef<'div'>) {
    return (
        <div
            {...props}
            className={cn(className, 'mt-8 flex flex-col-reverse items-center justify-end gap-3 *:w-full sm:flex-row sm:*:w-auto')}
        />
    )
}
