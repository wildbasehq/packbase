/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React from 'react'
import { SignedIn, UserButton } from '@clerk/clerk-react'
import { EnvelopeOpenIcon, UserIcon } from '@heroicons/react/24/solid'
import ProfileSettings from '@/pages/settings/general/page.tsx'
import InviteSettings from '@/pages/settings/invite/page.tsx'
import { useLocation } from 'wouter'
import { useUserAccountStore } from '@/lib'

export default function UserDropdown() {
    const { user } = useUserAccountStore()
    const [location, setLocation] = useLocation()
    return (
        <SignedIn>
            <UserButton>
                <UserButton.MenuItems>
                    <UserButton.Action label="Your Profile" labelIcon={<UserIcon />} onClick={() => setLocation(`/@${user.username}`)} />
                </UserButton.MenuItems>
                <UserButton.UserProfilePage label="Profile" url="/profile" labelIcon={<UserIcon />}>
                    <ProfileSettings />
                </UserButton.UserProfilePage>
                <UserButton.UserProfilePage label="Invite" url="/invite" labelIcon={<EnvelopeOpenIcon />}>
                    <InviteSettings />
                </UserButton.UserProfilePage>
            </UserButton>
        </SignedIn>
    )
}
