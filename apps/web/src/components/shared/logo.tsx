/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {cn} from '@/lib/utils'
import {LoadingSpinner} from '@/src/components'
import {ComponentProps, SVGProps, useEffect, useState} from 'react'

export const Logo = (props: SVGProps<SVGSVGElement>) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 245.22 229.23" data-slot="icon"
             fill="currentColor" {...props}>
            <path
                d="M227.15,228.09l-20.69-9.23-17.23-7.69c-16.63,2.45-34.44,1.06-53.07-5.23a98,98,0,0,1-59.57-55.19C44.83,73.69,100.63,0,173.64,0A105.62,105.62,0,0,1,240.1,23.39l-8.49,18a5.26,5.26,0,0,1-4.59,3L108.67,48.37c-4.31.15-7.91,3.6-7.94,8.83l25,77.93A14.24,14.24,0,0,0,137,144.84l63,9.65-12.35,13.58-.15.18a14.26,14.26,0,0,0,11,23.3h.23l43.84-.67.17,1.62L245.15,215A12.84,12.84,0,0,1,227.15,228.09Z"/>
            <path d="M45.52,120.88H7.5a7.5,7.5,0,0,1,0-15h38a7.5,7.5,0,1,1,0,15Z"/>
            <path
                d="M45.52,86.63a7.6,7.6,0,0,1-2.38-.39L9,74.82A7.5,7.5,0,0,1,13.78,60.6L47.9,72a7.5,7.5,0,0,1-2.38,14.61Z"/>
            <path
                d="M12.57,167.69a7.5,7.5,0,0,1-2.82-14.45l33.73-13.7a7.5,7.5,0,1,1,5.64,13.9l-33.73,13.7A7.57,7.57,0,0,1,12.57,167.69Z"/>
        </svg>
    )
}

/**
 * Same logo, fades logo SVG to spinner after a customisable delay
 */
export const LogoSpinner = ({
                                delay = 200,
                            }: {
    delay?: number
    spinnerClassName?: string
    logoProps?: ComponentProps<typeof Logo>
    showSpinner?: boolean
}) => {
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(true)
        }, delay)

        return () => clearTimeout(timer)
    }, [delay])

    return (
        <div
            className="relative ring-1 ring-inset ring-n-7/25 rounded-xl w-14 h-14 flex justify-center items-center p-3">
            <div
                className={cn(
                    'absolute inset-0 flex items-center justify-center transition-opacity duration-300 p-3',
                    isLoading ? 'opacity-0' : 'opacity-100'
                )}
            >
                <Logo className="w-full h-full flex justify-center items-center dark:fill-white"/>
            </div>

            <LoadingSpinner
                className={cn('transition-opacity duration-300', !isLoading ? 'opacity-0' : 'opacity-100')}/>
        </div>
    )
}
