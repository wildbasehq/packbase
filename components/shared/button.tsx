'use client';

import {ReactNode, forwardRef, LegacyRef, MouseEventHandler, useEffect, useState} from 'react';

interface NGButtonType {
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
    });

    useEffect(() => {
        switch (props.variant) {
            case 'lighter': {
                setVariant({
                    useSystemText: true,
                    dark: {
                        bg: 'dark:bg-neutral-700',
                        hover: 'dark:hover:bg-neutral-800',
                    },
                })

                break;
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

                break;
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

                break;
            }
        }
    }, [props.variant]);

    return (
        <button
            type={props.type || 'button'}
            disabled={props.disabled || false}
            className={`${props.className} ${variant.light?.bg || 'bg-white'} ${variant.light?.hover || 'hover:bg-neutral-50'} ${variant.useSystemText ? 'text-default' : 'text-white'} ${variant.dark?.bg || 'dark:bg-neutral-800'} ${variant.dark?.hover || 'dark:hover:bg-neutral-800/75'} w-full inline-flex justify-center rounded-md border border-default px-4 py-2 text-base font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm`}
            onClick={props.onClick || (
                () => {
                }
            )}
            ref={ref}
        >
            {props.children}
        </button>
    );
});

Button.displayName = 'Button';
export default Button;
