'use client'

import Link from 'next/link'
import {Button} from '@/components/shared/ui/button'
import {ScanFaceIcon} from 'lucide-react'
import {ThemeToggle} from '@/components/shared/theme-toggle'
import {Search} from '@/components/layout/search'
import UserDropdown from '@/components/layout/user-dropdown'
import {useResourceUIStore, useUserAccountStore} from '@/lib/states'
import UserAvatar from '@/components/shared/user/avatar'
import Popover from '@/components/shared/popover'
import ResourceSwitcher from '@/components/layout/resource-switcher'

export default function NavBar() {
    const {user} = useUserAccountStore()
    const {loading} = useResourceUIStore()

    return (
        <>
            <div
                className="flex sticky top-0 z-30 h-16 bg-sidebar shadow-sm border-0 border-b border-default border-solid">
                <nav
                    aria-label="Sections"
                    className="hidden lg:flex lg:flex-col h-16">
                    <div
                        className={`relative flex items-center w-96 h-full py-2 px-5 border-r border-default shimmer-template ${loading ? 'before:animate-shimmer-fast overflow-hidden' : ''}`}>
                        <div className="w-full">
                            <ResourceSwitcher/>
                        </div>
                    </div>
                </nav>

                <div className="max-w-7xl h-16 w-full mx-auto px-2 sm:px-4">
                    <div className="relative h-full flex items-center justify-between">
                        <div className="relative"></div>

                        <Search/>

                        <div className="flex items-center gap-5">
                            {/*<p className="hidden md:block text-sm text-alt">*/}
                            {/*    {process.env.NEXT_PUBLIC_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'unknown'}*/}
                            {/*</p>*/}
                            {/*<div className="hidden md:block md:h-5 md:w-px md:bg-neutral-900/10 md:dark:bg-white/15"/>*/}
                            <div className="flex gap-4">
                                <ThemeToggle/>
                            </div>
                            <div className="hidden min-[416px]:contents">
                                {user &&
                                    <Popover
                                        content={<>
                                            {user && <UserDropdown/>}
                                        </>}
                                        align="end"
                                    >
                                        <div>
                                            <UserAvatar user={user} size="md"/>
                                        </div>
                                    </Popover>
                                }

                                {!user && (
                                    <>
                                        <Link href="/id/login">
                                            <Button variant="ghost" size="self" className="flex h-6 w-6">
                                                <ScanFaceIcon className="h-4 w-4"/>
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
