'use client'

import './resource-switcher.component.scss'
import {Heading, Text} from '@/components/shared/text'
import UserAvatar from '@/components/shared/user/avatar'
import useComponentVisible from '@/lib/hooks/use-component-visible'
import useSound from 'use-sound'
import {PlayFunction} from 'use-sound/dist/types'
import {toast} from '@/lib/toast'
import {useResourceStore, useResourceUIStore} from '@/lib/states'
import {Key, useEffect, useState} from 'react'
import {ExpandingArrow, LoadingCircle} from '@/components/shared/icons'
import {fetcher} from '@/lib/utils'
import {XIcon} from 'lucide-react'
import Tooltip from '@/components/shared/tooltip'
import {ExclamationTriangleIcon} from '@heroicons/react/24/solid'
import {Logo} from '@/components/shared/logo'
import TextTicker from '@/components/shared/text-ticker'

export default function ResourceSwitcher() {
    // sound refs
    const [initialSound] = useSound('/sounds/switcher.ogg')
    const [switchedSound] = useSound('/sounds/switched.ogg')
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
    const [failedSound] = useSound('/sounds/switch-failed.ogg')

    const {currentResource, setCurrentResource} = useResourceStore()

    const {resourceDefault, loading, setLoading} = useResourceUIStore()
    const {ref, isComponentVisible, setIsComponentVisible} = useComponentVisible({
        soundOnClose: cancelSound
    })
    // fuck you nextjs
    const [domReady, setDomReady] = useState(false)

    const [availableResources, setAvailableResources] = useState<{
        id: string | number;
        name: string;
        standalone?: boolean;
        icon?: string;
        unavailable?: boolean;
        possiblyUnavailable?: boolean;
    }[]>([
        resourceDefault,
        {
            id: 'floodchat',
            name: 'The Flood Chat',
            icon: 'https://cdn.discordapp.com/icons/333623134152294401/4352917374ecb07503ef9022a75de44d.webp?size=96',
            possiblyUnavailable: true
        },
        {
            id: 'rjojw',
            name: 'Rek\'s... slay\'s',
            icon: 'https://cdn.discordapp.com/icons/1116547738629320774/e9d8187dba27013aece701d6a43b16a4.webp?size=96',
            possiblyUnavailable: true
        },
        {
            id: 'sozlol',
            name: 'These aren\'t real',
            possiblyUnavailable: true
        },
    ])

    const playSound = (sound: PlayFunction) => {
        sound()
    }

    const switchResource = (resource: any) => {
        playSound(resource.id === resourceDefault.id ? cancelSound : switchedSound)
        setLoading(true)
        setCurrentResource(resource)

        if (ref.current) {
            if (resource.standalone) {
                setLoading(false)
                // playSound(heavyHoverSound)
                return
            }

            setTimeout(() => {
                fetcher(`${process.env.NEXT_PUBLIC_YIPNYAP_CORE_URL}/v2/groups/${resource.id}`).then((res) => {
                    if (res.E2ID) {
                        // playSound(heavyHoverSound)
                    } else {
                        toast.error('The resource is experiencing an outage.', {
                            description: `"${resource!.name}" is not available. You have been switched back to the Universe.`,
                        })
                        setCurrentResource(resourceDefault)
                        playSound(failedSound)
                    }

                    setLoading(false)
                }).catch(() => {
                    toast.error('The resource is experiencing an outage.', {
                        description: `"${resource!.name}" is not available. You have been switched back to the Universe.`,
                    })
                    setCurrentResource(resourceDefault)
                    playSound(failedSound)
                    setLoading(false)
                    setAvailableResources((prev) => {
                        return prev.map((res) => {
                            if (res.id === resource.id) {
                                res.unavailable = true
                            }
                            return res
                        })
                    })
                })
            }, 10000)
        }
    }

    const shuffleArray = (array: any[]) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]
        }
        return array
    }

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setDomReady(true)
        }
    }, [])

    const rows = shuffleArray([8, 7, 6])
    return (
        <>
            {domReady ? (
                <div ref={ref}
                     className={`group flex flex-row items-center justify-between cursor-pointer select-none ${loading ? '!cursor-no-drop' : ''}`}
                     aria-label="Switch resource"
                     title={loading ? 'Resource is still switching...' : 'Switch resource'}
                     onClick={() => {
                         if (loading) {
                             ref.current?.classList.add('[&>*>*]:animate-shake')
                             return playSound(heavyHoverSound)
                         }
                         if (!isComponentVisible) playSound(initialSound)
                         setIsComponentVisible(!isComponentVisible)
                     }}
                     onAnimationEnd={() => {
                         ref.current?.classList.remove('[&>*>*]:animate-shake')
                     }}
                >
                    <span className="relative flex z-10 w-full justify-between items-center">
                        {!currentResource || currentResource.standalone ? (
                            <div className="flex h-10 items-center space-x-2">
                                <Logo className="w-8"/>
                                <Text className="font-bold">
                                    <TextTicker texts={[
                                        currentResource.name,
                                        '3 unreads'
                                    ]} interval={5000}/>
                                </Text>
                            </div>
                        ) : (
                            <Resource name={currentResource.name} id={currentResource.id} icon={currentResource.icon}/>
                        )}
                        <div
                            className={`absolute ${isComponentVisible ? 'top-[10px]' : 'top-[18px]'} transition-all right-0`}>
                            <ExpandingArrow
                                className={`${isComponentVisible ? '!opacity-0' : ''} rotate-90 w-6 h-6 right-0 text-neutral-500 transition-all dark:text-white`}/>
                            <XIcon
                                className={`${isComponentVisible ? 'opacity-1' : 'opacity-0'} w-6 h-6 right-0 text-neutral-500 transition-opacity dark:text-white`}/>
                        </div>
                    </span>

                    {/* switcher */}
                    <div>
                        <div
                            className={`absolute top-0 left-0 ${isComponentVisible ? 'h-screen' : 'opacity-0 h-full group-hover:opacity-100'} transition-switcher bg-card/90 w-full shadow-sm pt-[64px]`}>
                            {isComponentVisible && (
                                <div
                                    className="h-full switcher-list-stagger overflow-y-auto overflow-x-visible">
                                    <div className="flex flex-col">
                                        {/* "Your groups live here" upsell */}
                                        <div className="relative w-full overflow-hidden flex flex-col">
                                            {/* Behold, over-engineered upsell */}
                                            <div className="relative">
                                                <div className="flex flex-col space-x-[-1px]">
                                                    {[...Array(3)].map((_, i) => (
                                                        // Fade to black on bottom
                                                        <div key={i}
                                                             className={`flex flex-row justify-between ${i !== 0 && '-mt-4'}`}
                                                             style={{
                                                                 zIndex: i + 1,
                                                                 ...(i !== 2 && {
                                                                     maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 35%, rgba(0,0,0,0.3))',
                                                                 })
                                                             }}
                                                        >
                                                            {[...Array(rows[i])].map((_: any, i: Key) => (
                                                                <UserAvatar key={i}
                                                                            name={Math.random().toString(36).substring(7)}
                                                                            size={40}
                                                                            className="inline-flex overflow-hidden border"
                                                                            style={{
                                                                                rotate: `${Math.floor(Math.random() * 10) - 5}deg`,
                                                                            }}/>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="px-5 py-3">
                                                <Heading className="font-bold">Your packs live here</Heading>
                                                <Text className="text-alt">
                                                    Each pack has their own chat, feed channels, and more. Switch
                                                    between them
                                                    here, anytime.
                                                </Text>
                                            </div>
                                        </div>

                                        {availableResources.map((resource) => {
                                            if (resource.id === currentResource.id) return null
                                            return (
                                                <div key={resource.id} className={`flex flex-col hover:z-50`}
                                                     onClick={(e) => {
                                                         if (resource.unavailable) {
                                                             e.stopPropagation()
                                                             toast.error(`"${resource!.name}" is not available right now.`)
                                                             return playSound(heavyHoverSound)
                                                         }
                                                         switchResource(resource)
                                                         setIsComponentVisible(false)
                                                     }}
                                                     onMouseEnter={() => {
                                                         playSound(hoverSound)
                                                     }}
                                                >
                                                    {resource.standalone && (
                                                        <div
                                                            className="flex items-center py-3 px-5 space-x-2 hover:bg-hover cursor-pointer">
                                                            <Logo className="w-8 h-8"/>
                                                            <Text className="font-bold">{resource.name}</Text>
                                                        </div>
                                                    )}

                                                    {!resource.standalone && (
                                                        <Tooltip key={resource.id}
                                                                 content={resource.unavailable ? 'Unavailable' : null}>
                                                            <div
                                                                className={`flex py-3 px-5 items-center justify-between ${resource.unavailable && '!opacity-50'} hover:bg-hover cursor-pointer`}>
                                                                <Resource name={resource.name} id={resource.id}
                                                                          icon={resource.icon}/>
                                                                {(resource.possiblyUnavailable && !resource.unavailable) && (
                                                                    <Tooltip
                                                                        content={<div className="px-2 py-1.5" style={{
                                                                            zIndex: 99,
                                                                            whiteSpace: 'pre-line',
                                                                            width: '14.75rem'
                                                                        }}>
                                                                            <Text className="font-bold">
                                                                                Possibly Unavailable
                                                                            </Text>
                                                                            <Text className="text-alt">
                                                                                It&apos;s experiencing an outage, or may
                                                                                no longer exist.
                                                                            </Text>
                                                                        </div>} side="left">
                                                                        <ExclamationTriangleIcon
                                                                            className="w-5 h-5 text-yellow-500"/>
                                                                    </Tooltip>
                                                                )}
                                                            </div>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
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

function Resource({name, id, icon}: {
    name: string;
    id: string | number;
    icon?: string;
}) {
    return (
        <span className="flex min-w-0 items-center justify-between space-x-3">
            <UserAvatar name={name} size={40} avatar={icon}
                        className="inline-flex h-10 w-10 overflow-hidden"/>
            <div className="flex-1 flex flex-col min-w-0">
                <Text>
                    {name}
                </Text>
                <Text className="text-alt">
                    {id}
                </Text>
            </div>
        </span>
    )
}