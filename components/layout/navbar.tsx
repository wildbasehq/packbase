import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Button } from '@/components/shared/experimental-button-rework'
import { useUIStore, useUserAccountStore } from '@/lib/states'
import { ScanFaceIcon } from 'lucide-react'
import React, { useState } from 'react'
import UserOnboardingModal from '../modal/user-onboarding-modal'
import { Logo } from '@/components/shared/logo'
import Link from '@/components/shared/link'
import Tooltip from '@/components/shared/tooltip.tsx'
import { Badge } from '@/components/shared/badge.tsx'
import { WorkerStore } from '@/lib/workers.ts'
import { WorkerSpinner } from '@/lib/use-worker-status.tsx'
import { truncate } from '@/lib/utils'

export default function NavBar() {
    const { user } = useUserAccountStore()
    const { hidden, updateAvailable, maintenance } = useUIStore()
    const { jobs, getRunningJobs } = WorkerStore()

    const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(
        user && !user?.metadata?.dp_uod && !user.anonUser && !maintenance
    )

    return (
        <>
            {user && !user?.metadata?.dp_uod && !user.anonUser && !maintenance && (
                <UserOnboardingModal state={[showOnboardingModal, setShowOnboardingModal]} />
            )}

            <div
                className={`${hidden || !user ? '' : 'sm:!pl-[24.5rem]'} flex h-16 w-full items-center justify-items-stretch px-2 sm:px-4`}
            >
                {hidden || !user ? (
                    <Link className="flex-1" href="/">
                        <Logo className="h-8" />
                    </Link>
                ) : (
                    <div className="flex-1" />
                )}

                <div className="w-full h-16 justify-self-end max-w-7xl">
                    <div className="relative flex justify-end h-full lg:items-center xl:justify-between">
                        {/*{user && !user.anonUser && <Search/>}*/}
                        <div className="relative"></div>

                        <div className="flex items-center gap-5">
                            {jobs.size > 0 && <WorkerSpinner />}
                            {updateAvailable && (
                                <>
                                    <Tooltip content={`Click to update: ${truncate(updateAvailable, 7)}`} delayDuration={0}>
                                        <div className="flex cursor-pointer scale-80" onClick={() => window.location.reload()}>
                                            <Badge color="amber" className="flex items-center justify-center">
                                                <span className="text-xs">Update available</span>
                                            </Badge>
                                        </div>
                                    </Tooltip>

                                    <div className="hidden md:dark:bg-white/15 md:block md:h-5 md:w-px md:bg-n-8/10" />
                                </>
                            )}
                            <div className="flex gap-4">
                                <ThemeToggle />
                            </div>

                            <div className="hidden min-[416px]:contents">
                                {!user && (
                                    <Link href="/id/login" className="no-underline!">
                                        <Button color="indigo" className="flex items-center justify-center">
                                            <ScanFaceIcon className="w-4 h-4 mr-1" /> Sign In
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
