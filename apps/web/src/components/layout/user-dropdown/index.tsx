/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React from 'react'
import {SignedIn, useAuth, UserAvatar, UserProfile} from '@clerk/clerk-react'
import {useLocation} from 'wouter'
import {
    Button,
    Dropdown,
    DropdownButton,
    DropdownHeader,
    DropdownMenu,
    Heading,
    Logo,
    PopoverHeader,
    Text
} from "@/src/components";
import {Cog6ToothIcon} from "@heroicons/react/20/solid";
import {useModal} from "@/components/modal/provider.tsx";
import {useUserAccountStore} from "@/lib";
import LogoutIcon from "@/components/icons/logout.tsx";
import PagedModal from "@/components/shared/paged-modal";
import ProfileSettings from "@/components/layout/user-dropdown/general/page.tsx";
import UserStoragePage from "@/components/layout/user-dropdown/storage/page.tsx";
import WildbaseAsteriskIcon from "@/components/icons/wildbase-asterisk.tsx";
import {HardDisk} from "@/components/icons/plump";
import InviteSettings from "@/components/layout/user-dropdown/invite/page.tsx";
import {EnvelopeOpenIcon} from "@heroicons/react/16/solid";

function UserMenu() {
    const {user} = useUserAccountStore()
    const {show} = useModal()

    const {signOut} = useAuth()

    return (
        <DropdownHeader className="flex w-96 flex-col p-0!">
            <div className="h-fit w-full rounded-xl rounded-br bg-white/50 shadow-sm dark:bg-n-6/50">
                <div className="p-2">
                    <div
                        className="ring-default flex items-center rounded px-4 py-4 transition-all hover:bg-muted hover:ring-2"
                        onClick={() => show(<UserSettingsOption/>)}
                    >
                        <UserAvatar/>
                        <div className="ml-3 grow">
                            <Heading>{user.display_name || user.username}</Heading>
                            <Text alt>{user.username}</Text>
                        </div>
                    </div>
                </div>
            </div>

            <div className="inline-flex w-full flex-col gap-2 px-3 py-2">
                <div
                    className="group inline-flex w-full cursor-pointer items-center justify-start gap-4 rounded px-4 py-3 ring-destructive/25 transition-all hover:bg-destructive/75 hover:ring-2"
                    onClick={() => signOut()}
                >
                    <LogoutIcon className="fill-muted-foreground h-4 w-4 group-hover:fill-white!"/>{' '}
                    <Text alt className="group-hover:text-white!">
                        Sign out of all accounts
                    </Text>
                </div>
            </div>
        </DropdownHeader>
    )
}

export default function UserDropdown() {
    const [, setLocation] = useLocation()

    return (
        <SignedIn>
            <Dropdown>
                <DropdownButton as="div" className="cursor-pointer">
                    <UserAvatar/>
                </DropdownButton>

                <DropdownMenu>
                    <UserMenu/>
                </DropdownMenu>
            </Dropdown>
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
                Username, Avatar, Security, API Keys, etc.
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
            <PagedModal.Page id="profile" title="Profile Settings" description="Manage your profile settings"
                             icon={Cog6ToothIcon}>
                <PagedModal.Body>
                    <ProfileSettings/>
                </PagedModal.Body>
            </PagedModal.Page>

            <PagedModal.Page
                id="storage"
                title="Storage Settings"
                description="Manage your storage settings"
                icon={HardDisk}
            >
                <PagedModal.Body>
                    <UserStoragePage/>
                </PagedModal.Body>
            </PagedModal.Page>

            <PagedModal.Page
                id="invite"
                title="Invite Settings"
                description="Manage your invite settings"
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
