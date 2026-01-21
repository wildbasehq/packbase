/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import LogoutIcon from '@/components/icons/logout'
import {HardDisk} from '@/components/icons/plump'
import {XPDisplay} from '@/components/icons/ranks/xp-display'
import WildbaseAsteriskIcon from '@/components/icons/wildbase-asterisk'
import ProfileSettings from '@/components/layout/user-dropdown/general/page'
import InviteSettings from '@/components/layout/user-dropdown/invite/page'
import UserStoragePage from '@/components/layout/user-dropdown/storage/page'
import {useModal} from '@/components/modal/provider'
import PagedModal from '@/components/shared/paged-modal'
import {RingButton} from '@/components/ui/RingButton'
import {useUserAccountStore} from '@/lib'
import {BubblePopover, Button, DropdownHeader, Heading, Logo, PopoverHeader, Text} from '@/src/components'
import {SignedIn, useAuth, UserAvatar, UserProfile} from '@clerk/clerk-react'
import {EnvelopeOpenIcon} from '@heroicons/react/16/solid'
import {Cog6ToothIcon, UserIcon} from '@heroicons/react/20/solid'
import {AnimatePresence, motion} from 'motion/react'
import {ReactNode, useEffect, useState} from 'react'
import {useLocation} from 'wouter'
import UserSettingsFromServer from './from-server'

function StatusLabel({children}: { children: ReactNode }) {
    return (
        <motion.div
            initial={{opacity: 0, scale: 0.96, filter: 'blur(8px)'}}
            animate={{opacity: 1, scale: 1, y: 0, filter: 'blur(0)'}}
            exit={{opacity: 0, scale: 0.96, filter: 'blur(8px)'}}
            transition={{
                duration: 0.27,
                ease: [0.26, 0.08, 0.25, 1],
            }}
            className="flex items-center w-3/4"
        >
            {children}
        </motion.div>
    )
}

function UserMenu({close}: {
    close: () => void
}) {
    const {user} = useUserAccountStore()
    const {show} = useModal()
    const [, navigate] = useLocation()

    const {signOut} = useAuth()

    if (!user) {
        return null
    }

    return (
        <DropdownHeader className="flex w-96 flex-col p-0!">
            <div
                className="h-fit w-full rounded-2xl bg-muted border shadow-sm transition-all ring-default hover:bg-muted/50 hover:ring-2">
                <div className="p-1">
                    <div
                        className="flex items-center rounded-lg px-4 py-4"
                        onClick={() => {
                            show(<UserSettingsOption/>)
                            close()
                        }}
                    >
                        <UserAvatar/>
                        <div className="ml-3 grow">
                            <Heading>{user.display_name || user.username}</Heading>
                            <Text alt>{user.username}</Text>
                        </div>
                        <div className="grow"/>
                        <Cog6ToothIcon className="h-5 w-5 text-muted-foreground"/>
                    </div>
                </div>
            </div>

            <div className="inline-flex w-full flex-col gap-2 px-3 py-2">
                <RingButton
                    icon={UserIcon}
                    href={`/@${user.username}`}
                    label="My Profile"
                    onClick={close}
                />

                <RingButton
                    icon={LogoutIcon}
                    onClick={() => signOut()}
                    label="Sign out of all accounts"
                    variant="destructive"
                />
            </div>
        </DropdownHeader>
    )
}

export default function UserDropdown() {
    const [isHovered, setIsHovered] = useState(false)
    const {user: {xp}} = useUserAccountStore()

    // Sets isHovered to true on load for 2 seconds, or until user interaction
    useEffect(() => {
        setIsHovered(true)
        const timeout = setTimeout(() => setIsHovered(false), 5000)
        return () => clearTimeout(timeout)
    }, [])

    return (
        <SignedIn>
            <div className="relative flex items-center">
                <motion.div
                    className="absolute flex bg-primary-midnight px-2 py-2 rounded-full items-center overflow-hidden whitespace-nowrap"
                    initial={{width: '4rem', height: '1rem', opacity: 0, right: '-0.5rem'}}
                    animate={{
                        height: '2.5rem',
                        width: isHovered ? '14rem' : '2.5rem',
                        opacity: isHovered ? 1 : 0,
                        right: '-0.4rem',
                    }}
                    transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 24,
                        delay: isHovered ? 1 : 0,
                    }}
                >
                    <AnimatePresence mode="popLayout">
                        {isHovered && (
                            <StatusLabel key="test">
                                <XPDisplay xp={xp}/>
                            </StatusLabel>
                        )}
                    </AnimatePresence>
                </motion.div>

                <BubblePopover
                    corner="top-right"
                    id="user-dropdown-action"
                    className="p-0 w-fit"
                    trigger={
                        ({setOpen}) => (
                            <div
                                onClick={() => setOpen(true)}
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                                className={`rounded-full duration-100 ease-in hover:duration-1000 hover:transition-shadow hover:ring-6 hover:ring-primary-midnight`}
                            >
                                <UserAvatar/>
                            </div>
                        )
                    }>
                    {({setOpen}) =>
                        <UserMenu close={() => setOpen(false)}/>
                    }
                </BubblePopover>
            </div>
        </SignedIn>
    )
}

/**
 * Prompts the user to pick which modal to open.
 * @constructor
 */
function UserSettingsOption() {
    const {show} = useModal()

    return (
        <div className="flex flex-col gap-4 p-6 max-w-lg">
            <PopoverHeader
                title="Change what?"
                description="Select which settings you would like to change. We're still re-organising settings into an unified modal."
            />
            <Button
                outline
                className="w-full justify-start"
                onClick={() => show(<UserProfile/>)}
            >
                <WildbaseAsteriskIcon data-slot="icon"/>
                Wild ID; Username, Avatar, Security, API Keys, etc.
            </Button>

            <Button
                className="w-full justify-start"
                onClick={() => show(<UserSettings/>)}
            >
                <Logo data-slot="icon" className="text-white!"/>
                Everything Else
            </Button>
        </div>
    )
}

function UserSettings() {
    return (
        <PagedModal>
            <PagedModal.Page
                id="profile"
                title="Profile"
                icon={Cog6ToothIcon}
            >
                <PagedModal.Body>
                    <ProfileSettings/>
                </PagedModal.Body>
            </PagedModal.Page>

            <PagedModal.Page
                id="storage"
                title="Storage"
                icon={HardDisk}
            >
                <PagedModal.Body>
                    <UserStoragePage/>
                </PagedModal.Body>
            </PagedModal.Page>

            <UserSettingsFromServer/>

            <PagedModal.Page
                id="invite"
                title="Invite"
                icon={EnvelopeOpenIcon}
            >
                <PagedModal.Body>
                    <InviteSettings/>
                </PagedModal.Body>
            </PagedModal.Page>
        </PagedModal>
    )
}

/**

 <UserButton>
 <UserButton.MenuItems>
 <UserButton.Action label="manageAccount"/>
 <UserButton.Action label="Your Profile" labelIcon={<UserIcon/>}
 onClick={() => setLocation(`~/@me`)}/>
 </UserButton.MenuItems>
 <UserButton.UserProfilePage label="Profile" url="/profile" labelIcon={<UserIcon/>}>
 <ProfileSettings/>
 </UserButton.UserProfilePage>
 <UserButton.UserProfilePage label="Storage" url="/storage" labelIcon={<HardDisk/>}>
 <UserStoragePage/>
 </UserButton.UserProfilePage>

 <UserButton.UserProfilePage label="Invite" url="/invite" labelIcon={<EnvelopeOpenIcon/>}>
 <InviteSettings/>
 </UserButton.UserProfilePage>
 <UserButton.UserProfilePage label="Theme" url="/theme" labelIcon={<SwatchIcon/>}>
 <TemplateSettings/>
 </UserButton.UserProfilePage>
 </UserButton>
 */
