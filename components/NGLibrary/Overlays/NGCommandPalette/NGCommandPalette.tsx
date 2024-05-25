// @todo: maybe OpenAI this?

import React, {Fragment, useEffect, useState} from 'react'
import {Combobox, Dialog, Transition} from '@headlessui/react'
import {LockClosedIcon, MagnifyingGlassIcon} from '@heroicons/react/20/solid'
import {
    BellIcon,
    ExclamationCircleIcon,
    PaintBrushIcon,
    QuestionMarkCircleIcon,
    ShareIcon,
    ShieldCheckIcon,
    TrashIcon,
    UserIcon,
} from '@heroicons/react/24/outline'
import {getMe} from '@/lib/api/users/me'
import {ProjectName} from '@/lib/utils'

function classNames(...classes: (string | boolean)[]) {
    return classes.filter(Boolean).join(' ')
}

export default function NGCommandPalette({...props}: {
    states: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
    friends: any[]
    groups: any[]
    pages: any[]
}) {
    const [open, setOpen] = props.states
    const [loading, setLoading] = useState(false)
    const [rawQuery, setRawQuery] = useState('')
    const [users, setUsers] = useState(props.friends)
    const [groups, setGroups] = useState(props.groups)

    const query = rawQuery.toLowerCase().replace(/^[#@~!]/, '')

    let settings: any[] = []
    if (getMe()) {
        settings = [{
            id: 1,
            name: 'Account',
            description: 'Manage your account settings',
            tags: `email password profile avatar picture username nickname handle name surname family name given name first name last name display name bio description about location`,
            icon: QuestionMarkCircleIcon,
            href: '/settings/',
        }, {
            id: 2,
            name: 'Appearance',
            description: 'Customize your account & UI appearance',
            tags: 'theme color light dark mode theme',
            icon: PaintBrushIcon,
            href: '/settings/skin/',
        }, {
            id: 3,
            name: 'Social accounts',
            description: 'Boast your social media presence',
            tags: `twitter facebook instagram reddit youtube twitch github linkedin discord telegram tiktok`,
            icon: ShareIcon,
            href: '/settings/social/',
        }, {
            id: 4,
            name: 'Notifications',
            description: 'Manage your mobile notifications',
            icon: BellIcon,
            href: '/settings/access/',
        }, {
            id: 5,
            name: 'Security',
            description: 'Configure two-factor authentication, telegram, and reset your password',
            tags: `2fa two-factor authentication telegram password reset change update forgot lost recover`,
            icon: ShieldCheckIcon,
            href: '/settings/access/',
        }, {
            id: 6,
            name: 'Profile bio',
            description: 'Add a bio to your profile',
            tags: `bio description about location`,
            icon: QuestionMarkCircleIcon,
            href: '/settings/',
        }, {
            id: 7,
            name: 'Display Name',
            description: 'Change your display name',
            tags: 'username nickname handle',
            icon: UserIcon,
            href: '/settings/',
        }]
    }

    let filteredGroups = []
    let filteredUsers = []
    let filteredSettings = []

    let pages = [...props.pages]
    pages = pages.filter((page) => typeof page.icon !== 'string' && typeof page.name === 'string')
    // remove duplicates
    pages = pages.filter((page, index) => pages.findIndex((p) => p.name === page.name) === index)

    let filteredPages = []

    // Check what the rawQuery starts with, and only show the relevant results. I.e., if it starts with @, only show
    // users and blank the others.
    const queryGroups = rawQuery === '#' ? groups : query === '' ? [] : groups.filter((group) => group.name.toLowerCase().includes(query) || group.description.toLowerCase().includes(query) || group.tags?.toLowerCase().split(', ').some((tag: string) => query.includes(tag)))
    const queryUsers = rawQuery === '@' ? users : query === '' ? [] : users.filter((user) => user.username.toLowerCase().includes(query) || user.display_name.toLowerCase().includes(query) || user.bio?.toLowerCase().includes(query))
    const querySettings = rawQuery === '~' ? settings : query === '' ? [] : settings.filter((setting) => setting.name.toLowerCase().includes(query) || setting.description.toLowerCase().includes(query) || setting.tags?.toLowerCase().split(' ').some((tag: string) => query.includes(tag)) || setting.tags?.toLowerCase().includes(query))
    const queryPages = rawQuery === '!' ? pages : query === '' ? [] : pages.filter((page) => page.name.toLowerCase().includes(query) || page.description?.toLowerCase().includes(query) || page.tags?.toLowerCase().split(' ').some((tag: string) => query.includes(tag)) || page.tags?.toLowerCase().includes(query))
    switch (rawQuery[0]) {
        case '#': {
            filteredGroups = queryGroups
            break
        }

        case '@': {
            filteredUsers = queryUsers
            break
        }

        case '~': {
            filteredSettings = querySettings
            break
        }

        case '!': {
            filteredPages = queryPages
            break
        }

        default: {
            filteredGroups = queryGroups
            filteredUsers = queryUsers
            filteredSettings = querySettings
            filteredPages = queryPages
        }
    }

    let showDelete = false
    if (getMe() && (
        rawQuery === 'delete' || rawQuery === 'delete account' || rawQuery === 'deactivate' || rawQuery === 'deactivate account' || rawQuery === 'delete my account' || rawQuery === 'deactivate my account' || rawQuery === 'delete my profile' || rawQuery === 'deactivate my profile'
    )) {
        showDelete = true
    }

    useEffect(() => {
        setUsers(props.friends)
        setGroups(props.groups)
    }, [props.friends, props.groups])

    const keydownHandler = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault()
            setOpen(true)
            setLoading(false)
        }
    }

    useEffect(() => {
        document.addEventListener('keydown', keydownHandler)

        return () => {
            document.removeEventListener('keydown', keydownHandler)
        }
    }, [])

    // Set loading state, then off after 1s of no input
    useEffect(() => {
        if (showDelete || rawQuery === '' || rawQuery.startsWith('~') || rawQuery.startsWith('!') || rawQuery.startsWith('?')) return setLoading(false)
        setLoading(true)
        const timeout = setTimeout(() => setLoading(false), 1000)
        return () => clearTimeout(timeout)
    }, [rawQuery])

    return (
        <Transition.Root show={open} as={Fragment} afterLeave={() => setRawQuery('')}>
            <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20" onClose={setOpen}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <Dialog.Overlay
                        className="fixed inset-0 bg-neutral-500/25 bg-opacity-75 backdrop-blur transition-opacity"/>
                </Transition.Child>

                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 translate-y-4 rotate-1"
                    enterTo="opacity-100 translate-y-0 rotate-0"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 translate-y-0 rotate-0 sm:scale-100"
                    leaveTo="opacity-0 translate-y-4 -rotate-1 sm:translate-y-0 sm:scale-95"
                >
                    <Combobox
                        as="div"
                        className="mx-auto max-w-xl transform divide-y divide-neutral-100 dark:divide-neutral-600 overflow-hidden rounded bg-card shadow-2xl ring-1 ring-black ring-opacity-5 transition-all"
                        onChange={(item: any) => {
                            if (item.member_count) {
                                window.location.href = `/pack/${item.id}/`
                            } else if (item.username) {
                                window.location.href = `/@${item.username}/`
                            } else if (item.target) {
                                window.open(item.href, item.target)
                            } else {
                                window.location.href = item.href
                            }

                            setOpen(false)
                        }}
                    >
                        <div className="relative">
                            <MagnifyingGlassIcon
                                className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-neutral-400"
                                aria-hidden="true"
                            />
                            <Combobox.Input
                                className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-default placeholder-neutral-400 focus:ring-0 sm:text-sm"
                                placeholder="Search..."
                                onChange={(event) => setRawQuery(event.target.value.trim())}
                            />
                        </div>

                        {(
                            filteredGroups.length > 0 || filteredUsers.length > 0 || filteredSettings.length > 0 || filteredPages.length > 0 || showDelete
                        ) && (
                            <Combobox.Options
                                static
                                className="max-h-80 scroll-py-10 scroll-pb-2 space-y-4 overflow-y-auto p-4 pb-2"
                            >
                                {filteredGroups.length > 0 && (
                                    <li>
                                        <h2 className="text-xs font-semibold text-default">Groups</h2>
                                        <ul className="-mx-4 mt-2 text-sm text-alt">
                                            {filteredGroups.map((group) => (
                                                <Combobox.Option
                                                    key={group.id}
                                                    value={group}
                                                    className={({active}) => classNames('flex cursor-default select-none items-center px-4 py-2', active && 'bg-indigo-600 text-white')}
                                                >
                                                    <img src={group.avatar} alt=""
                                                         className="h-6 w-6 flex-none rounded-full"/>
                                                    <span className="ml-3 flex-auto truncate">{group.name}</span>
                                                </Combobox.Option>
                                            ))}
                                        </ul>
                                    </li>
                                )}
                                {filteredUsers.length > 0 && (
                                    <li>
                                        <h2 className="text-xs font-semibold text-default">Users</h2>
                                        <ul className="-mx-4 mt-2 text-sm text-alt">
                                            {filteredUsers.map((user) => (
                                                <Combobox.Option
                                                    key={user.id}
                                                    value={user}
                                                    className={({active}) => classNames('flex cursor-default select-none items-center px-4 py-2', active && 'bg-indigo-600 text-white')}
                                                >
                                                    <img src={user.avatar} alt=""
                                                         className="h-6 w-6 flex-none rounded-full"/>
                                                    <span className="ml-3 flex-auto truncate">{user.username}</span>
                                                </Combobox.Option>
                                            ))}
                                        </ul>
                                    </li>
                                )}
                                {filteredPages.length > 0 && (
                                    <li>
                                        <h2 className="text-xs font-semibold text-default">Pages</h2>
                                        <ul className="-mx-4 mt-2 text-sm text-alt">
                                            {filteredPages.map((page, i) => (
                                                <Combobox.Option
                                                    key={i}
                                                    value={page}
                                                    className={({active}) => classNames('flex cursor-default select-none items-center px-4 py-2', active && 'bg-indigo-600 text-white')}
                                                >
                                                    {({active}) => (
                                                        <>
                                                            <page.icon
                                                                className={classNames('h-6 w-6 flex-none', active ? 'text-default' : 'text-alt')}
                                                                aria-hidden="true"
                                                            />
                                                            <span
                                                                className="ml-3 flex-auto truncate">{page.name}</span>
                                                        </>
                                                    )}
                                                </Combobox.Option>
                                            ))}
                                        </ul>
                                    </li>
                                )}
                                {filteredSettings.length > 0 && (
                                    <li>
                                        <h2 className="text-xs font-semibold text-default">Settings</h2>
                                        <ul className="-mx-4 mt-2 text-sm text-alt">
                                            {filteredSettings.map((setting) => (
                                                <Combobox.Option
                                                    key={setting.id}
                                                    value={setting}
                                                    className={({active}) => classNames('flex cursor-default select-none items-center px-4 py-2', active && 'bg-indigo-600 text-white')}
                                                >
                                                    {({active}) => (
                                                        <>
                                                            <setting.icon
                                                                className={classNames('h-6 w-6 flex-none', active ? 'text-default' : 'text-alt')}
                                                                aria-hidden="true"
                                                            />
                                                            <span
                                                                className="ml-3 flex-auto truncate">{setting.name}</span>
                                                        </>
                                                    )}
                                                </Combobox.Option>
                                            ))}
                                        </ul>
                                    </li>
                                )}

                                {/* Delete account state */}
                                {showDelete && (
                                    <li>
                                        <div className="py-14 px-6 text-center text-sm sm:px-14">
                                            <ExclamationCircleIcon className="mx-auto h-6 w-6 text-alt"/>
                                            <p className="mt-4 font-semibold text-default">Delete account</p>
                                            <p className="mt-2 text-alt">
                                                We get it, sometimes you just want to start fresh, or maybe you just
                                                want to
                                                get out from it all. If you're sure you want to delete your account, you
                                                can
                                                do so by clicking the button below. This will take you to a page where
                                                you
                                                can
                                                confirm your decision.
                                            </p>
                                        </div>
                                        <ul className="-mx-4 mt-2 text-sm text-alt">
                                            <Combobox.Option
                                                value={{
                                                    href: `/@${getMe()?.username}/settings/account-settings`,
                                                    target: '_blank',
                                                }}
                                                className={({active}) => classNames('flex cursor-default select-none items-center px-4 py-2', active && 'bg-indigo-600 text-white')}
                                            >
                                                {({active}) => (
                                                    <>
                                                        <TrashIcon
                                                            className={classNames('h-6 w-6 flex-none', active ? 'text-default' : 'text-alt')}
                                                            aria-hidden="true"
                                                        />
                                                        <span
                                                            className="ml-3 flex-auto truncate">Begin...</span>
                                                    </>
                                                )}
                                            </Combobox.Option>
                                        </ul>
                                    </li>
                                )}
                            </Combobox.Options>
                        )}

                        {/* Search loading state */}
                        {loading && (
                            <div className="py-14 px-6 text-center text-sm sm:px-14">
                                <img src={`/img/symbolic/process-working.symbolic.png`}
                                     alt="Process spinner" className="mx-auto h-6 w-6 animate-spin dark:invert"/>
                                <p className="mt-4 font-semibold text-default">Searching...</p>
                                <p className="mt-2 text-alt">
                                    We're searching for <code>{query}</code> across {ProjectName}.
                                </p>
                            </div>
                        )}

                        {rawQuery === '?' && (
                            <div className="py-14 px-6 text-center text-sm sm:px-14">
                                <QuestionMarkCircleIcon className="mx-auto h-6 w-6 text-alt"
                                                        aria-hidden="true"/>
                                <p className="mt-4 font-semibold text-default">Help with searching</p>
                                <p className="mt-2 text-alt">
                                    Use this tool to quickly search for anything across {ProjectName}. You can also use
                                    the search modifiers found in the footer below to limit the results to just users,
                                    packs, and more. Settings: <code>~</code>, Pages: <code>!</code>.
                                </p>
                            </div>
                        )}

                        {!loading && !showDelete && query !== '' && rawQuery !== '?' && rawQuery !== '🐈' && filteredGroups.length === 0 && filteredUsers.length === 0 && filteredSettings.length === 0 && filteredPages.length === 0 && (
                            <div className="py-14 px-6 text-center text-sm sm:px-14">
                                <ExclamationCircleIcon className="mx-auto h-6 w-6 text-alt" aria-hidden="true"/>
                                <p className="mt-4 font-semibold text-default">No results found</p>
                                <p className="mt-2 text-alt">
                                    {query.startsWith('a life') ? `Hey now, don't be so hard on yourself. You're doing the best you can! 🤗` : `We couldn't find any results for ${query}.`}
                                </p>
                            </div>
                        )}

                        {/* Cat shaking easter egg */}
                        {rawQuery === '🐈' && (
                            <div className="py-14 px-6 text-center text-sm sm:px-14">
                                <div className="mx-auto w-auto text-alt snapanim-shake">
                                    <img
                                        src={`/img/illustrations/onboarding/gray-cat.png`}
                                        alt=""/>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center bg-default py-2.5 px-4 text-xs text-default">
                            Type{' '}
                            <kbd
                                className={classNames(`mx-1 flex h-5 w-5 items-center justify-center rounded border bg-default-alt font-semibold sm:mx-2`, rawQuery.startsWith('#') ? 'border-indigo-600 text-indigo-600' : 'border-neutral-400 text-neutral-500')}
                            >
                                #
                            </kbd>{' '}
                            <span className="sm:hidden">for groups,</span>
                            <span className="hidden sm:inline">to access groups,</span>
                            <kbd
                                className={classNames(`mx-1 flex h-5 w-5 items-center justify-center rounded border bg-default-alt font-semibold sm:mx-2`, rawQuery.startsWith('@') ? 'border-indigo-600 text-indigo-600' : 'border-neutral-400 text-neutral-500')}
                            >
                                @
                            </kbd>{' '}
                            for users, or{' '}
                            <kbd
                                className={classNames(`mx-1 flex h-5 w-5 items-center justify-center rounded border bg-default-alt font-semibold sm:mx-2`, rawQuery === '?' ? 'border-indigo-600 text-indigo-600' : 'border-neutral-400 text-neutral-500')}
                            >
                                ?
                            </kbd>{' '}
                            for more.
                        </div>

                        {/* Privacy notice, everything stays on device */}
                        <div className="flex flex-wrap items-center bg-default py-2.5 px-4 text-xs text-default">
                            <span className="flex items-center">
                                <LockClosedIcon className="text-primary h-4 w-4 mr-1.5" aria-hidden="true"/>
                                <p>
                                    <span className="text-primary font-semibold">Privacy:{' '}</span>
                                    Specific searches are never stored, but keywords are used for
                                    trending topics.
                                </p>
                            </span>
                        </div>
                    </Combobox>
                </Transition.Child>
            </Dialog>
        </Transition.Root>
    )
}
