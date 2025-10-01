/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React from 'react'
import {SignedIn, UserButton} from '@clerk/clerk-react'
import {UserIcon} from '@heroicons/react/24/solid'
import {useLocation} from 'wouter'
import {EnvelopeOpenIcon, SwatchIcon} from '@heroicons/react/16/solid'
import ProfileSettings from './general/page.tsx'
import TemplateSettings from './template/page.tsx'
import InviteSettings from './invite/page.tsx'
import UserStoragePage from "./storage/page.tsx"
import {HardDisk} from "@/components/icons/plump/HardDisk.tsx";

export default function UserDropdown() {
    const [, setLocation] = useLocation()

    return (
        <SignedIn>
            <UserButton>
                <UserButton.MenuItems>
                    <UserButton.Action label="Your Profile" labelIcon={<UserIcon/>}
                                       onClick={() => setLocation(`/@me`)}/>
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
        </SignedIn>
    )
}
