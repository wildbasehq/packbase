/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React from 'react'
import {SignedIn, UserButton} from '@clerk/clerk-react'
import {UserIcon} from '@heroicons/react/24/solid'
import ProfileSettings from '@/pages/settings/general/page.tsx'
import {useLocation} from 'wouter'
import TemplateSettings from '@/pages/settings/template/page.tsx'
import {EnvelopeOpenIcon, SwatchIcon} from '@heroicons/react/16/solid'
import InviteSettings from '@/pages/settings/invite/page.tsx'

export default function UserDropdown() {
    const [location, setLocation] = useLocation()

    return (
        <SignedIn>
            <UserButton>
                <UserButton.MenuItems>
                    <UserButton.Action label="Your Profile" labelIcon={<UserIcon/>} onClick={() => setLocation(`/@me`)}/>
                </UserButton.MenuItems>
                <UserButton.UserProfilePage label="Profile" url="/profile" labelIcon={<UserIcon/>}>
                    <ProfileSettings/>
                </UserButton.UserProfilePage>
                <UserButton.UserProfilePage label="Invite" url="/invite" labelIcon={<EnvelopeOpenIcon/>}>
                    <InviteSettings/>
                </UserButton.UserProfilePage>
                {/*<UserButton.UserProfilePage label="Badges" url="/badges" labelIcon={<TrophyIcon />}>*/}
                {/*    <UnlockableSettings />*/}
                {/*</UserButton.UserProfilePage>*/}
                <UserButton.UserProfilePage label="Theme" url="/theme" labelIcon={<SwatchIcon/>}>
                    <TemplateSettings/>
                </UserButton.UserProfilePage>
            </UserButton>
        </SignedIn>
    )
}
