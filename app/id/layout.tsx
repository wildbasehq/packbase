'use client'

import LoginGradient from '@/app/id/create/client/gradient'
import IDArtistShowcase from './artist-showcase'
import { useUIStore } from '@/lib/states'
import { ReactNode, useEffect } from 'react'

export default function IDLayout({ children }: { children: ReactNode }) {
    const { setHidden } = useUIStore()

    useEffect(() => {
        setHidden(true)
    }, [])

    return (
        <>
            {/* test */}
            <div className="absolute inset-0 -z-10 animate-slide-down-fade dark:opacity-75">
                <LoginGradient />
            </div>

            <div className="grid h-full grid-cols-1 2xl:grid-cols-2">
                <div className="col-span-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                    <div className="mx-auto w-full max-w-sm lg:w-96">{children}</div>
                </div>
                <div className="relative col-span-1 hidden overflow-hidden rounded-bl-3xl rounded-tl-3xl 2xl:block">
                    <IDArtistShowcase />
                </div>
            </div>
        </>
    )
}
