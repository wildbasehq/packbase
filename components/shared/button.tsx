import {forwardRef, LegacyRef, MouseEventHandler, ReactNode, useEffect, useState} from 'react'
import {cn} from '@/lib/utils'

export declare interface NGButtonType {
    onClick?: MouseEventHandler<HTMLButtonElement>;
    variant?: 'lighter' | 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success' | 'warning' | 'info';
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;

    theme?: any;
    children?: ReactNode;
    className?: string;
}

const Button = forwardRef((props: NGButtonType, ref: LegacyRef<HTMLButtonElement> | undefined) => {
    const [variant, setVariant] = useState<any>({
        useSystemText: true,
    })

    useEffect(() => {
        switch (props.variant) {
            case 'lighter': {
                setVariant({
                    useSystemText: true,
                    dark: {
                        bg: 'bg-surface-container-lower',
                        hover: 'dark:hover:bg-neutral-800',
                    },
                })

                break
            }

            case 'primary': {
                setVariant({
                    dark: {
                        bg: 'dark:bg-blue-600',
                        hover: 'dark:hover:bg-blue-700',
                    },
                    light: {
                        bg: 'bg-blue-600',
                        hover: 'hover:bg-blue-700',
                    },
                })

                break
            }

            case 'danger': {
                setVariant({
                    dark: {
                        bg: 'dark:bg-red-600',
                        hover: 'dark:hover:bg-red-700',
                    },
                    light: {
                        bg: 'bg-red-600',
                        hover: 'hover:bg-red-700',
                    },
                })

                break
            }
        }
    }, [props.variant])

    return (
        <button
            type={props.type || 'button'}
            disabled={props.disabled || false}
            className={cn(props.className, `${variant.light?.bg || 'bg-white unicorn:bg-surface-container-lowest'} ${variant.light?.hover || 'hover:bg-neutral-50'} ${variant.useSystemText ? 'text-default' : 'text-white'} ${variant.dark?.bg || 'dark:bg-n-6 unicorn:dark:bg-surface-container-high'} ${variant.dark?.hover || 'dark:hover:bg-surface-variant/75'} w-full inline-flex justify-center rounded-md border px-4 py-2 text-base font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 hover:ring-4 hover:ring-neutral-500/10 sm:w-auto sm:text-sm`)}
            onClick={props.onClick || (
                () => {
                }
            )}
            ref={ref}
        >
            {props.children}
        </button>
    )
})

Button.displayName = 'button'
export default Button
