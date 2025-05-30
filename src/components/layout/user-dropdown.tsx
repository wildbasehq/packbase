import React from 'react'
import { SignedIn, UserButton } from '@clerk/clerk-react'
import { EnvelopeOpenIcon, UserIcon } from '@heroicons/react/24/solid'
import ProfileSettings from '@/pages/settings/general/page.tsx'
import InviteSettings from '@/pages/settings/invite/page.tsx'

export default function UserDropdown() {
    return (
        <SignedIn>
            <UserButton>
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
