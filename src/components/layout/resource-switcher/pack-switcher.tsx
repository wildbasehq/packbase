import ECGIcon from '@/components/icons/dazzle/ecg'
import { Logo } from '@/components/shared/logo'
import { Text } from '@/components/shared/text'
import Tooltip, { TooltipContent } from '@/components/shared/tooltip'
import { Button } from '@/components/shared/button'
import UserAvatar from '@/components/shared/user/avatar'
import { useResourceStore, useUIStore, useUserAccountStore } from '@/lib/state'
import { cn } from '@/lib/utils'
import { UsersIcon } from '@heroicons/react/20/solid'
import { PlusIcon } from '@heroicons/react/24/solid'
import { TentTreeIcon } from 'lucide-react'
import useSound from 'use-sound'
import './pack-switcher.component.css'
import Link from '@/components/shared/link.tsx'
import { useLocation } from 'wouter'

export default function PackSwitcher() {
    // Going back home
    const [initialSound] = useSound('/sounds/switcher.ogg')
    // Entering pack
    // 1 in 1000 chance of using `/sounds/sfx.lobotomy.social.new.wav` instead of `/sounds/switched.ogg`
    const [switchedSoundNormal] = useSound('/sounds/switched.ogg')
    const [switchedSoundSpecial] = useSound('/sounds/sfx.lobotomy.social.new.wav')
    // Not allowed
    const [heavyHoverSound] = useSound('/sounds/switch-hover-s.ogg', {
        playbackRate: 0.3,
    })

    const { currentResource, setCurrentResource, resources } = useResourceStore()
    const { user } = useUserAccountStore()
    const { resourceDefault, loading, setLoading } = useUIStore()
    const [, navigate] = useLocation()

    const switchedSound = () => {
        const rand = Math.random()
        if (rand < 0.002) {
            console.log('random hit', rand)
            switchedSoundSpecial()
        } else {
            switchedSoundNormal()
        }
    }

    const switchResource = (resource: any) => {
        if (loading || currentResource.id === resource.id) {
            if (resource.slug === 'universe') navigate('/p/universe')
            return heavyHoverSound()
        }
        resource.id === resourceDefault.id ? initialSound() : switchedSound()
        setCurrentResource(resource)
        setLoading(true)
        navigate(`/p/${resource.slug}`)
    }

    return (
        <div className="min-w-16 relative flex h-full flex-col items-center border-r gap-3 py-2">
            <Tooltip content="Home" side="right">
                <div
                    className={cn(
                        'hover:show-pill flex h-12 w-12 justify-center cursor-pointer items-center [&>div]:bg-n-1',
                        currentResource.id === resourceDefault.id
                            ? 'force-pill [&>div>*]:invert [&>div]:bg-primary'
                            : 'dark:[&>div>*]:invert dark:[&>div]:bg-n-7'
                    )}
                    onClick={() => switchResource(resourceDefault)}
                >
                    <Logo noColorTheme className="!w-10 !h-10" />
                </div>
            </Tooltip>

            <div className="h-[0.1rem] w-full bg-n-5/20"></div>

            {resources.map(item => (
                <Tooltip
                    key={item.id}
                    content={
                        <div>
                            <TooltipContent>
                                <Text>{item.display_name}</Text>
                            </TooltipContent>
                            <div className="mt-1 grid grid-rows-1 divide-y border-t">
                                <div className="grid grid-cols-2 gap-2 divide-x px-2 [&>*:not(:first-child)]:pl-2 *:py-1">
                                    <Text
                                        className={
                                            (item.statistics?.heartbeat || 0) < item.statistics?.members ? 'text-tertiary!' : 'text-alt'
                                        }
                                    >
                                        <ECGIcon className="-mt-0.5 inline-flex h-4 w-4" /> {item.statistics?.heartbeat || 0}
                                    </Text>
                                    <Text alt>
                                        <UsersIcon className="-mt-0.5 inline-flex h-4 w-4" /> {item.statistics?.members}
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
                    <div
                        className={cn(
                            'hover:show-pill flex h-12 w-12 justify-center items-center',
                            currentResource.id === item.id && 'force-pill'
                        )}
                        onClick={() => switchResource(item)}
                    >
                        <UserAvatar
                            name={item.display_name}
                            size={40}
                            icon={item.images?.avatar}
                            className="inline-flex cursor-pointer overflow-hidden"
                        />
                    </div>
                </Tooltip>
            ))}

            {user && !user.anonUser && (
                <Tooltip content="Create/Join Pack" side="right" delayDuration={0}>
                    <Link
                        href="/p/new"
                        className={cn('hover:show-pill flex h-8 w-8 items-center', currentResource.id === 'new' && 'force-pill')}
                    >
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-1">
                            <PlusIcon />
                        </Button>
                    </Link>
                </Tooltip>
            )}

            <div className="grow" />
        </div>
    )
}
