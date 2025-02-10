'use client'

import { ExpandingArrow, LoadingCircle } from '@/components/shared/icons'
import { Logo } from '@/components/shared/logo'
import { Text } from '@/components/shared/text'
import UserAvatar from '@/components/shared/user/avatar'
import useComponentVisible from '@/lib/hooks/use-component-visible'
import { useResourceStore, useUIStore } from '@/lib/states'
import { useEffect, useState } from 'react'
import useSound from 'use-sound'
import { PlayFunction } from 'use-sound/dist/types'
import './resource-switcher.component.scss'

export default function ResourceSwitcher() {
    const hoverCancelSFX = '/sounds/switch-hover-s.ogg'
    // sound refs
    const [cancelSound] = useSound(hoverCancelSFX, {
        volume: 0.35,
        playbackRate: 0.25,
    })
    const [hoverSound] = useSound(hoverCancelSFX, {
        volume: 0.25,
        playbackRate: 0.5,
        interrupt: true,
    })
    const [heavyHoverSound] = useSound('/sounds/switch-hover-s.ogg', {
        playbackRate: 0.3,
    })

    const { currentResource } = useResourceStore()

    const { loading, connecting } = useUIStore()
    const { ref } = useComponentVisible({
        soundOnClose: cancelSound,
    })
    // fuck you nextjs
    const [domReady, setDomReady] = useState(false)

    const playSound = (sound: PlayFunction) => {
        sound()
    }

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setDomReady(true)
        }
    }, [])

    return (
        <>
            {domReady && !connecting ? (
                <div
                    ref={ref}
                    className={`group flex select-none flex-row items-center justify-between ${loading ? '!cursor-no-drop' : ''}`}
                    aria-label="Switch resource"
                    title={loading ? 'Resource is still switching...' : 'Switch resource'}
                    onAnimationEnd={() => {
                        ref.current?.classList.remove('[&>*>*]:animate-shake')
                    }}
                    onMouseEnter={() => {
                        playSound(hoverSound)
                    }}
                    onMouseLeave={() => {
                        playSound(cancelSound)
                    }}
                >
                    <span
                        className="z-10 flex w-full items-center justify-between"
                        onClick={() => {
                            if (loading) {
                                ref.current?.classList.add('[&>*>*]:animate-shake')
                                return playSound(heavyHoverSound)
                            }
                        }}
                    >
                        <div className="flex h-10 items-center space-x-2">
                            {!currentResource || (currentResource.standalone && !currentResource.icon) ? (
                                <Logo className="w-8" />
                            ) : (
                                <UserAvatar name={currentResource.display_name} size={32} icon={currentResource.icon} className="inline-flex h-8 w-8 overflow-hidden" />
                            )}
                            <Text className="font-bold">{currentResource.display_name}</Text>
                        </div>
                        <ExpandingArrow className="right-0 -mt-1 h-6 w-6 rotate-90 text-neutral-500 transition-all dark:text-white" />
                    </span>
                </div>
            ) : (
                <div className="shimmer-template flex cursor-pointer select-none flex-row items-center justify-between">
                    <span className="z-10 flex w-full items-center justify-between">
                        <div className="flex h-10 items-center space-x-2">
                            <LoadingCircle />
                            <Text className="font-bold">Connecting</Text>
                        </div>
                    </span>
                </div>
            )}
        </>
    )
}
