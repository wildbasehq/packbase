'use client'

import './pack-switcher.component.scss'
import Tooltip from '@/components/shared/tooltip'
import { Logo } from '@/components/shared/logo'
import UserAvatar from '@/components/shared/user/avatar'
import { Button } from '@/components/shared/ui/button'
import { SettingsIcon } from 'lucide-react'
import useSound from 'use-sound'
import { useResourceStore, useResourceUIStore } from '@/lib/states'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function PackSwitcher() {
    const [initialSound] = useSound('/sounds/switcher.ogg')
    const [switchedSound] = useSound('/sounds/switched.ogg')
    const [heavyHoverSound] = useSound('/sounds/switch-hover-s.ogg', {
        playbackRate: 0.3,
    })

    const { currentResource, setCurrentResource, resources, setResources } = useResourceStore()
    const { resourceDefault, loading, setLoading } = useResourceUIStore()
    const router = useRouter()

    const switchResource = (resource: any) => {
        if (loading || currentResource.id === resource.id) return heavyHoverSound()
        resource.id === resourceDefault.id ? initialSound() : switchedSound()
        setCurrentResource(resource)
        setLoading(true)
        router.push(`/p/${resource.id}`)
    }

    useEffect(() => {
        setResources([
            {
                id: 'floodchat',
                name: 'The Flood Chat',
                icon: 'https://cdn.discordapp.com/icons/333623134152294401/4352917374ecb07503ef9022a75de44d.webp?size=96',
                possiblyUnavailable: true,
            },
            {
                id: 'bradesu',
                name: "Bra's Corner",
                icon: 'https://cdn.discordapp.com/icons/1079320989718028399/742261f5d8e46e22a304893d4afc674d.webp?size=96',
                possiblyUnavailable: true,
            },
            {
                id: 'sozlol',
                name: "These aren't real",
                possiblyUnavailable: true,
            },
        ])
    }, [])

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
                <Tooltip key={item.id} content={item.name} side="right" delayDuration={0}>
                    <div className={cn('hover:show-pill flex h-8 w-8 items-center', currentResource.id === item.id && 'force-pill')} onClick={() => switchResource(item)}>
                        <UserAvatar name={item.name} size={32} icon={item.icon} className="inline-flex cursor-pointer overflow-hidden" />
                    </div>
                </Tooltip>
            ))}
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
