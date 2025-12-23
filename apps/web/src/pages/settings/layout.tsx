/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import SettingsDeleteAccount from '@/components/layout/user-dropdown/delete/page'

// Import all settings pages
import ProfileSettings from '@/components/layout/user-dropdown/general/page'
import InviteSettings from '@/components/layout/user-dropdown/invite/page'
import TemplateSettings from '@/components/layout/user-dropdown/template/page'
import UnlockableSettings from '@/components/layout/user-dropdown/unlockables/page'
import PagedModal from '@/components/shared/paged-modal'
import {Text} from '@/components/shared/text'
import UserAvatar from '@/components/shared/user/avatar'
import {useUserAccountStore} from '@/lib'
import {EnvelopeOpenIcon, IdentificationIcon, SwatchIcon, TrophyIcon} from '@heroicons/react/16/solid'
import {TrashIcon} from '@heroicons/react/20/solid'
import {FC} from 'react'

const SettingsDialog: FC = () => {
    const {user} = useUserAccountStore()

    // Create the user profile footer component
    const UserProfileFooter = (
        <div className="flex items-center">
            <UserAvatar user={user} size="lg"/>
            <div className="ml-2">
                <Text className="text-sm font-medium">{user?.display_name || user?.username || 'Anonymous User'}</Text>
                <Text className="text-xs" alt>{user?.anonUser ? 'Not registered yet' : `@${user?.username}`}</Text>
            </div>
        </div>
    )

    // Render content based on user state
    if (!user) return null

    return (
        <PagedModal footer={UserProfileFooter}>
            <PagedModal.Page id="profile" title="Public Information" icon={IdentificationIcon}>
                <ProfileSettings/>
            </PagedModal.Page>

            <PagedModal.Page id="template" title="Template" icon={SwatchIcon}>
                <TemplateSettings/>
            </PagedModal.Page>

            <PagedModal.Page id="invite" title="Invite" icon={EnvelopeOpenIcon}
                             description="Invite a friend to join the community">
                <InviteSettings/>
            </PagedModal.Page>

            <PagedModal.Page
                id="unlockables"
                title="Events"
                icon={TrophyIcon}
                description="Invite your friends to join the community and unlock special rewards!"
                badge="Limited Event"
            >
                <UnlockableSettings/>
            </PagedModal.Page>

            <PagedModal.Page id="delete" title="Delete Account" icon={TrashIcon}
                             description="Delete your account and all associated data">
                <SettingsDeleteAccount/>
            </PagedModal.Page>
        </PagedModal>
    )
}

export default SettingsDialog
