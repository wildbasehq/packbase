'use client'

import { ExpandingArrow, LoadingCircle } from '@/components/shared/icons'
import { Logo } from '@/components/shared/logo'
import { Heading, Text } from '@/components/shared/text'
import UserAvatar from '@/components/shared/user/avatar'
import useComponentVisible from '@/lib/hooks/use-component-visible'
import { useResourceStore, useUIStore } from '@/lib/states'
import { useEffect, useState } from 'react'
import useSound from 'use-sound'
import { PlayFunction } from 'use-sound/dist/types'
import './resource-switcher.component.scss'
import { Dropdown, DropdownHeader, DropdownMenu } from '@/components/shared/dropdown'
import { MenuButton } from '@headlessui/react'
import Link from 'next/link'
import LogoutIcon from '@/components/shared/icons/logout'
import { vg } from '@/lib/api'
import { toast } from '@/lib/toast'

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
                    <Dropdown>
                        <MenuButton
                            className="w-full"
                            onClick={(e) => {
                                if (loading || currentResource.standalone || currentResource.temporary) {
                                    e.preventDefault()
                                    ref.current?.classList.add('[&>*>*]:animate-shake')
                                    return playSound(heavyHoverSound)
                                }
                            }}
                        >
                            <span className="z-10 flex w-full items-center justify-between">
                                <div className="flex h-10 items-center space-x-2">
                                    {!currentResource || (currentResource.standalone && !currentResource.icon) ? (
                                        <Logo className="w-8" />
                                    ) : (
                                        <UserAvatar
                                            name={currentResource.display_name}
                                            size={32}
                                            icon={currentResource.icon}
                                            className="inline-flex h-8 w-8 overflow-hidden"
                                        />
                                    )}
                                    <Text className="font-bold">{currentResource.display_name}</Text>
                                </div>
                                <ExpandingArrow className="right-0 -mt-1 h-6 w-6 rotate-90 text-neutral-500 transition-all dark:text-white" />
                            </span>
                        </MenuButton>
                        <DropdownMenu className="z-50 -mt-16 rounded-tl-none rounded-tr-none !p-0">
                            <ResourceSwitcherMenu />
                        </DropdownMenu>
                    </Dropdown>
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

function ResourceSwitcherMenu() {
    const { currentResource: pack } = useResourceStore()

    return (
        <DropdownHeader className="flex w-96 flex-col !p-0">
            <div className="h-fit w-full rounded-bl rounded-br bg-white/50 shadow dark:bg-n-6/50">
                <div className="p-2">
                    <Link href={`/p/${pack.slug}`} className="!no-underline">
                        <div className="ring-default flex items-center rounded px-4 py-4 transition-all hover:bg-n-2/25 hover:ring-2 dark:hover:bg-n-6/50">
                            <UserAvatar user={pack} size="lg" />
                            <div className="ml-3 grow">
                                <Heading>{pack.display_name || pack.slug}</Heading>
                                <Text alt>{pack.slug}</Text>
                            </div>
                            {/*<Link href={`/p/${pack.slug}/settings`}>*/}
                            {/*    /!* mt-1 to offset button *!/*/}
                            {/*    <Button variant="ghost" size="icon" className="mt-1 h-5 w-5 cursor-pointer">*/}
                            {/*        <SettingsIcon className="h-5 w-5" />*/}
                            {/*    </Button>*/}
                            {/*</Link>*/}
                        </div>
                    </Link>
                </div>
            </div>

            <div className="inline-flex w-full flex-col gap-2 px-3 py-2">
                <div
                    className="group inline-flex w-full cursor-pointer items-center justify-start gap-4 rounded px-4 py-3 ring-destructive/25 transition-all hover:bg-destructive/75 hover:ring-2"
                    onClick={() => {
                        vg.pack({ id: pack.id })
                            .join.delete()
                            .then(() => {
                                window.location.reload()
                            })
                            .catch((e) => {
                                toast.error(e.message)
                            })
                    }}
                >
                    <LogoutIcon className="fill-alt h-4 w-4 group-hover:fill-white" />{' '}
                    <Text alt className="group-hover:text-white">
                        Leave pack
                    </Text>
                </div>
            </div>
        </DropdownHeader>
    )
}
