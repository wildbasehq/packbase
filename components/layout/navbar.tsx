'use client'

import Link from 'next/link'
import Image from 'next/image'
import {Logo} from '@/components/shared/logo'
import {Button} from '@/components/shared/ui/button'
import ActiveLink from '@/components/shared/activelink'
import {HomeIcon, ScanFaceIcon, ServerIcon, UserIcon} from 'lucide-react'
import {useEffect, useState} from 'react'
import {ThemeToggle} from '@/components/shared/theme-toggle'
import {Search} from '@/components/layout/search'
import UserDropdown from '@/components/layout/user-dropdown'
import {useResourceUIStore, useUserAccountStore} from '@/lib/states'
import UserAvatar from '@/components/shared/user/avatar'
import Popover from '@/components/shared/popover'
import {LoadingCircle} from '@/components/shared/icons'

export default function NavBar() {
    const {user} = useUserAccountStore()
    const {loading} = useResourceUIStore()
    const [navigation, setNavigation] = useState<any[]>([])

    useEffect(() => {
        setNavigation([{
            name: 'Home',
            href: '/',
            icon: HomeIcon,
        }, {
            name: 'Profile',
            tags: 'login register logout account settings profile user, identity',
            href: '/id/create',
            icon: UserIcon,
        }, {
            name: 'Server Information',
            tags: 'status uptime health check',
            href: '/stat',
            icon: ServerIcon,
        }])
    }, [])

    return (
        <>
            <div
                className={`flex sticky top-0 z-30 h-16 bg-sidebar border-0 border-b border-default border-solid ${loading ? 'before:animate-[shimmer_1s_linear_infinite] shimmer-template' : ''}`}>
                <nav
                    aria-label="Sections"
                    className="hidden lg:flex lg:flex-col h-16 text-default">
                    <div className="w-96 flex flex-row h-full divide-x divide-default border-r border-default">
                        {/* Logo */}
                        <Link
                            href="/"
                            className="flex items-center justify-center w-20 h-full cursor-pointer"
                        >
                            <Logo/>
                        </Link>
                        {(navigation.length === 0 || loading) && (
                            <div className="flex items-center justify-center w-20 h-full">
                                <LoadingCircle/>
                            </div>
                        )}

                        {!loading && navigation.map((item: any, i: number) => (
                            <ActiveLink
                                key={i}
                                href={item.href}
                                className="flex items-center justify-center w-20 h-full cursor-pointer"
                                activeClassName="bg-blue-50 bg-opacity-50 dark:bg-neutral-700"
                                inactiveClassName="hover:bg-blue-50 hover:bg-opacity-50 dark:hover:bg-neutral-700"
                            >
                                <>
                                    {item.icon && (
                                        <>
                                            {typeof item.icon !== 'string' && (
                                                <item.icon className="flex-shrink-0 h-6 w-6 text-default"
                                                           aria-hidden="true"/>
                                            )}

                                            {typeof item.icon === 'string' && (
                                                <Image
                                                    className={`flex-shrink-0 h-6 w-6 ${item.description?.startsWith('@') ? 'rounded-full' : 'rounded-lg'}`}
                                                    src={item.icon}
                                                    alt={`Icon for ${item.name}`}
                                                />
                                            )}
                                        </>
                                    )}
                                </>
                            </ActiveLink>
                        ))}
                    </div>
                </nav>

                <div className="max-w-7xl h-16 w-full mx-auto px-2 sm:px-4">
                    {!loading && (
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
                    )}
                </div>
            </div>
        </>
    )
}
