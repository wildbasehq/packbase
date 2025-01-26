'use client'

import ECGIcon from '@/components/shared/icons/dazzle/ecg'
import { Logo } from '@/components/shared/logo'
import { Text } from '@/components/shared/text'
import Tooltip, { TooltipContent } from '@/components/shared/tooltip'
import { Button } from '@/components/shared/ui/button'
import UserAvatar from '@/components/shared/user/avatar'
import { useResourceStore, useUIStore } from '@/lib/states'
import { cn } from '@/lib/utils'
import { UsersIcon } from '@heroicons/react/20/solid'
import { PlusIcon } from '@heroicons/react/24/solid'
import { SettingsIcon, TentTreeIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useSound from 'use-sound'
import './pack-switcher.component.scss'

export default function PackSwitcher() {
    const [initialSound] = useSound('/sounds/switcher.ogg')
    const [switchedSound] = useSound('/sounds/switched.ogg')
    const [heavyHoverSound] = useSound('/sounds/switch-hover-s.ogg', {
        playbackRate: 0.3,
    })

    const { currentResource, setCurrentResource, resources } = useResourceStore()
    const { resourceDefault, loading, setLoading } = useUIStore()
    const router = useRouter()

    const switchResource = (resource: any) => {
        if (loading || currentResource.id === resource.id) return heavyHoverSound()
        resource.id === resourceDefault.id ? initialSound() : switchedSound()
        setCurrentResource(resource)
        setLoading(true)
        router.push(`/p/${resource.slug}`)
    }

    return (
        <div className="w-18 relative z-50 flex h-full flex-col items-center gap-4 border-r bg-n-8 p-4">
            <Tooltip content="Home" side="right">
                <div
                    className={cn(
                        'hover:show-pill flex h-8 w-8 cursor-pointer items-center [&>div]:bg-n-1',
                        currentResource.id === resourceDefault.id ? 'force-pill [&>div>*]:invert [&>div]:bg-primary' : 'dark:[&>div>*]:invert dark:[&>div]:bg-n-7',
                    )}
                    onClick={() => switchResource(resourceDefault)}
                >
                    <Logo noColorTheme />
                </div>
            </Tooltip>

            <div className="h-0.5 w-full bg-n-5/20"></div>

            {resources.map((item) => (
                <Tooltip
                    key={item.id}
                    content={
                        <div>
                            <TooltipContent>
                                <Text>{item.display_name}</Text>
                            </TooltipContent>
                            <div className="mt-1 grid grid-rows-1 divide-y border-t">
                                <div className="grid grid-cols-2 gap-2 divide-x px-2 [&>*:not(:first-child)]:pl-2 [&>*]:py-1">
                                    <Text alt>
                                        <ECGIcon className="-mt-0.5 inline-flex h-4 w-4" /> 12,420
                                    </Text>
                                    <Text alt>
                                        <UsersIcon className="-mt-0.5 inline-flex h-4 w-4" /> 1,827
                                    </Text>
                                </div>

                                {item.temporary && (
                                    <div className="px-2 py-1 opacity-75">
                                        <Text alt>
                                            <TentTreeIcon className="-mt-0.5 inline-flex h-4 w-4" /> Not a pack member
                                        </Text>
                                    </div>
                                )}
                            </div>
                        </div>
                    }
                    side="right"
                    delayDuration={0}
                >
                    <div className={cn('hover:show-pill flex h-8 w-8 items-center', currentResource.id === item.id && 'force-pill')} onClick={() => switchResource(item)}>
                        <UserAvatar name={item.display_name} size={32} icon={item.images?.avatar} className="inline-flex cursor-pointer overflow-hidden" />
                    </div>
                </Tooltip>
            ))}

            <Tooltip content="Create/Join Pack" side="right" delayDuration={0}>
                <Link href="/p/new" className={cn('hover:show-pill flex h-8 w-8 items-center', currentResource.id === 'new' && 'force-pill')}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-1 text-white">
                        <PlusIcon />
                    </Button>
                </Link>
            </Tooltip>

            <div className="grow" />

            <Tooltip content="Settings" side="right" delayDuration={0}>
                <Link href="/settings" className={cn('hover:show-pill flex h-8 w-8 items-center', currentResource.id === 'settings' && 'force-pill')}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white">
                        <SettingsIcon />
                    </Button>
                </Link>
            </Tooltip>
        </div>
    )
}
