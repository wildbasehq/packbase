'use client'

import './resource-switcher.component.scss'
import {Text} from '@/components/shared/text'
import UserAvatar from '@/components/shared/user/avatar'
import useComponentVisible from '@/lib/hooks/use-component-visible'
import useSound from 'use-sound'
import {PlayFunction} from 'use-sound/dist/types'
import {useResourceStore, useResourceUIStore} from '@/lib/states'
import {useEffect, useState} from 'react'
import {ExpandingArrow, LoadingCircle} from '@/components/shared/icons'
import {Logo} from '@/components/shared/logo'
import TextTicker from '@/components/shared/text-ticker'

export default function ResourceSwitcher() {
    // sound refs
    const [cancelSound] = useSound('/sounds/switch-hover-s.ogg', {
        volume: 0.35,
        playbackRate: .25,
    })
    const [hoverSound] = useSound('/sounds/switch-hover-s.ogg', {
        volume: 0.25,
        playbackRate: .5,
        interrupt: true,
    })
    const [heavyHoverSound] = useSound('/sounds/switch-hover-s.ogg', {
        playbackRate: .3,
    })

    const {currentResource} = useResourceStore()

    const {loading} = useResourceUIStore()
    const {ref} = useComponentVisible({
        soundOnClose: cancelSound
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
            {domReady ? (
                <div ref={ref}
                     className={`group flex flex-row items-center justify-between select-none ${loading ? '!cursor-no-drop' : ''}`}
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
                    <span className="flex z-10 w-full justify-between items-center"
                          onClick={() => {
                              if (loading) {
                                  ref.current?.classList.add('[&>*>*]:animate-shake')
                                  return playSound(heavyHoverSound)
                              }
                          }}>
                        <div className="flex h-10 items-center space-x-2">
                                {(!currentResource || currentResource.standalone)
                                    ? <Logo className="w-8"/>
                                    : <UserAvatar name={currentResource.name} size={32} avatar={currentResource.icon}
                                                  className="inline-flex h-8 w-8 overflow-hidden"/>}
                            <Text className="font-bold">
                                    <TextTicker key={currentResource.name} texts={[
                                        currentResource.name,
                                        '🎉 Prototype'
                                    ]} interval={5000}/>
                                </Text>
                            </div>
                        <ExpandingArrow
                            className="rotate-90 -mt-1 w-6 h-6 right-0 text-neutral-500 transition-all dark:text-white"/>
                    </span>
                </div>
            ) : (
                <div className="flex flex-row items-center justify-between cursor-pointer shimmer-template select-none">
                    <span className="flex z-10 w-full justify-between items-center">
                        <div className="flex h-10 items-center space-x-2">
                            <LoadingCircle/>
                            <Text className="font-bold">Connecting</Text>
                        </div>
                    </span>
                </div>
            )}
        </>
    )
}
