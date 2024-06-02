'use client'

import './pack-switcher.component.scss'
import Tooltip from '@/components/shared/tooltip'
import {Logo} from '@/components/shared/logo'
import UserAvatar from '@/components/shared/user/avatar'
import {Button} from '@/components/shared/ui/button'
import {SettingsIcon} from 'lucide-react'
import useSound from 'use-sound'
import {useResourceStore, useResourceUIStore} from '@/lib/states'
import {cn} from '@/lib/utils'

export default function PackSwitcher() {
    const [initialSound] = useSound('/sounds/switcher.ogg')
    const [switchedSound] = useSound('/sounds/switched.ogg')
    const [heavyHoverSound] = useSound('/sounds/switch-hover-s.ogg', {
        playbackRate: .3,
    })

    const available = [
        {
            id: 'floodchat',
            name: 'The Flood Chat',
            icon: 'https://cdn.discordapp.com/icons/333623134152294401/4352917374ecb07503ef9022a75de44d.webp?size=96',
            possiblyUnavailable: true
        },
        {
            id: 'bradesu',
            name: 'Bra\'s Corner',
            icon: 'https://cdn.discordapp.com/icons/1079320989718028399/742261f5d8e46e22a304893d4afc674d.webp?size=96',
            possiblyUnavailable: true
        },
        {
            id: 'sozlol',
            name: 'These aren\'t real',
            possiblyUnavailable: true
        },
    ]

    const {currentResource, setCurrentResource} = useResourceStore()
    const {resourceDefault, loading, setLoading} = useResourceUIStore()

    const switchResource = (resource: any) => {
        if (loading || currentResource.id === resource.id) return heavyHoverSound()
        resource.id === resourceDefault.id ? initialSound() : switchedSound()
        setCurrentResource(resource)
        setLoading(true)
        setTimeout(() => {
            setLoading(false)
        }, 1000)
    }

    return (
        <div className="z-50 relative flex flex-col items-center gap-4 h-full border-r w-18 p-4">
            <Tooltip content="Home" side="right">
                <div className="flex items-center h-8 w-8 cursor-pointer hover:show-pill"
                     onClick={() => switchResource(resourceDefault)}>
                    <Logo/>
                </div>
            </Tooltip>

            <div className="h-0.5 w-full bg-n-5/20"></div>

            {available.map(item => (
                <Tooltip key={item.id} content={item.name} side="right" delayDuration={0}>
                    <div
                        className={cn('flex items-center h-8 w-8 hover:show-pill', currentResource.id === item.id && 'force-pill')}
                        onClick={() => switchResource(item)}>
                        <UserAvatar name={item.name} size={32} avatar={item.icon}
                                    className="inline-flex overflow-hidden ring-1 ring-default cursor-pointer"/>
                    </div>
                </Tooltip>
            ))}
            <div className="grow"/>
            <Tooltip content="Settings" side="right" delayDuration={0}>
                <Button variant="ghost" size="icon">
                    <SettingsIcon/>
                </Button>
            </Tooltip>
        </div>
    )
}