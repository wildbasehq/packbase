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
import {useContentFrame} from "@/src/components";
import ServerConfigRender from "@/components/shared/input/server-config-render.tsx";

export default function UserDropdown() {
    const [, setLocation] = useLocation()

    const {data} = useContentFrame('get', `user/me/settings`)
    // Get unique categories that are ONLY strings.
    const userSettingsCategories =
        data?.reduce(
            (acc, obj) => {
                const category = obj.definition.category
                if (category) {
                    if (!acc[category]) acc[category] = []
                    acc[category].push(obj)
                }
                return acc
            },
            {} as Record<string, any[]>
        ) ?? {}

    return (
        <SignedIn>
            <UserButton>
                <UserButton.MenuItems>
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
                {Object.keys(userSettingsCategories || {})?.map(category => (
                    <UserButton.UserProfilePage label={category} url={`/settings/${category}`}
                                                labelIcon={<SwatchIcon/>}>
                        <ServerConfigRender config={userSettingsCategories[category]}
                                            updateEndpoint="user/me/settings"/>
                    </UserButton.UserProfilePage>
                ))}
            </UserButton>
        </SignedIn>
    )
}
