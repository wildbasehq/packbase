/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import ECGIcon from '@/components/icons/dazzle/ecg'
import { Logo } from '@/components/shared/logo'
import { Heading, Text } from '@/components/shared/text'
import Tooltip, { TooltipTitle } from '@/components/shared/tooltip'
import { Button } from '@/components/shared/button'
import UserAvatar from '@/components/shared/user/avatar'
import { useResourceStore, useUIStore, useUserAccountStore } from '@/lib/state'
import { cn } from '@/lib/utils'
import { UsersIcon } from '@heroicons/react/20/solid'
import { PlusIcon } from '@heroicons/react/24/solid'
import { TentTreeIcon } from 'lucide-react'
import './pack-switcher.component.css'
import Link from '@/components/shared/link.tsx'
import { useLocation } from 'wouter'
import { Protect } from '@clerk/clerk-react'
import { AnimatePresence, motion } from 'framer-motion'

export default function PackSwitcher() {
    const { currentResource, setCurrentResource, resources } = useResourceStore()
    const { resourceDefault, loading, setLoading } = useUIStore()
    const {
        user: { id: user_id },
    } = useUserAccountStore()
    const [, navigate] = useLocation()

    const switchResource = (resource: any) => {
        if (loading || currentResource.id === resource.id) {
            if (resource.slug === 'universe') navigate('/p/universe')
        }

        resource.is_owner = currentResource.owner_id === user_id
        setCurrentResource(resource)
        setLoading(true)
        navigate(`/p/${resource.slug}`)
    }

    return (
        <div className="min-w-16 relative flex h-full flex-col items-center py-2">
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
                    <Logo noColorTheme className="!w-9.5 !h-9.5" />
                </div>
            </Tooltip>

            <div className="h-[1px] w-1/2 bg-n-3 dark:bg-n-7 my-2"></div>

            {resources.map(item => (
                <Tooltip key={item.id} content={item.display_name} side="right" delayDuration={0}>
                    <div className="relative">
                        <div
                            className={cn(
                                'hover:show-pill off-by-six flex h-12 w-12 justify-center items-center before:!left-[-0.65rem]',
                                currentResource.id === item.id && 'force-pill'
                            )}
                            onClick={() => switchResource(item)}
                        >
                            <UserAvatar
                                name={item.display_name}
                                size={38}
                                icon={item.images?.avatar}
                                className="inline-flex cursor-pointer overflow-hidden !rounded-xl"
                            />
                        </div>

                        {/* Pack icon background */}
                        <AnimatePresence>
                            {currentResource.id === item.id && (
                                <motion.div
                                    key={`pack-bg-${item.id}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute inset-0 ring-white/10 -z-1 bg-white dark:bg-n-8 h-12 rounded-tl rounded-bl rounded-out-r w-[calc(4rem)] pack-icon-bg"
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </Tooltip>
            ))}

            <Protect>
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
            </Protect>

            <div className="grow" />
        </div>
    )
}
